"use client";

import { useState } from "react";
import { idxDe, kindDe, SLUG_VALIDO } from "@/lib/materiais";

/**
 * O formulário de publicação de material.
 *
 * É Client Component porque precisa de três coisas que só existem no navegador:
 * `<input type="file">`, o `FormData` com os bytes, e o estado do resultado
 * enquanto o envio acontece.
 *
 * O que atravessa a fronteira é o catálogo já lido pelo servidor — id, slug,
 * título e as aulas. Nada de sessão, nada de token: quem tem o token é a rota
 * `/admin/publicar`, do outro lado.
 *
 * O `kind` aparece na tela ANTES do envio, ao lado de cada arquivo. Isso não é
 * enfeite: `kind` é metadado que a API grava e não tem PATCH, e ele é deduzido
 * do nome do arquivo. Ver o nome errado virar `outro` na tela é a única chance
 * de renomear antes que fique permanente.
 */

export type AulaResumo = {
  id: string;
  slug: string;
  title: string;
  assets: number;
};

export type CursoResumo = {
  id: string;
  slug: string;
  title: string;
  aulas: AulaResumo[];
};

type Resultado = {
  arquivo: string;
  kind: string;
  ok: boolean;
  detalhe?: string;
};

type Resposta = {
  erro?: string;
  revalidar?: string;
  aulaCriada?: string | null;
  enviados?: number;
  total?: number;
  resultados?: Resultado[];
};

export default function PublicarMaterial({ cursos }: { cursos: CursoResumo[] }) {
  const [cursoSlug, setCursoSlug] = useState(cursos[0]?.slug ?? "");
  const [aulaModo, setAulaModo] = useState<"existente" | "nova">("existente");
  const [aulaId, setAulaId] = useState("");
  const [aulaSlug, setAulaSlug] = useState("");
  const [aulaTitulo, setAulaTitulo] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<Resposta | null>(null);

  const curso = cursos.find((c) => c.slug === cursoSlug);
  const aulas = curso?.aulas ?? [];

  // A aula selecionada só faz sentido dentro do curso selecionado. Trocar de
  // curso sem limpar isto mandaria um `aulaId` de outro curso para a API.
  function trocaCurso(slug: string) {
    setCursoSlug(slug);
    setAulaId("");
    setResposta(null);
  }

  const slugRuim = aulaModo === "nova" && aulaSlug !== "" && !SLUG_VALIDO.test(aulaSlug);
  const pronto =
    cursoSlug !== "" &&
    arquivos.length > 0 &&
    !enviando &&
    (aulaModo === "existente"
      ? aulaId !== ""
      : SLUG_VALIDO.test(aulaSlug) && aulaTitulo.trim() !== "");

  async function publicar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!pronto || !curso) return;

    setEnviando(true);
    setResposta(null);

    const dados = new FormData();
    dados.set("curso", curso.slug);
    dados.set("cursoId", curso.id);
    dados.set("aulaModo", aulaModo);
    if (aulaModo === "existente") dados.set("aulaId", aulaId);
    else {
      dados.set("aulaSlug", aulaSlug);
      dados.set("aulaTitulo", aulaTitulo);
    }
    for (const a of arquivos) dados.append("arquivos", a);

    try {
      const r = await fetch("/admin/publicar", { method: "POST", body: dados });
      setResposta((await r.json()) as Resposta);
    } catch {
      // Rede caindo no meio do upload. Não dá para saber se a API recebeu, e
      // dizer "falhou" seria um palpite — o texto diz o que fazer em vez disso.
      setResposta({
        erro:
          "A conexão caiu durante o envio. Confira a lista de publicados abaixo " +
          "antes de tentar de novo, para não enviar o mesmo arquivo duas vezes.",
      });
    } finally {
      setEnviando(false);
    }
  }

  if (cursos.length === 0) {
    return (
      <div className="box">
        A API não respondeu o catálogo agora. Sem a lista de cursos não há para
        onde publicar — recarregue em instantes.
      </div>
    );
  }

  return (
    <form className="pub" onSubmit={publicar}>
      <div className="pub__linha">
        <label className="pub__campo">
          <span className="pub__rotulo">Curso</span>
          <select
            value={cursoSlug}
            onChange={(e) => trocaCurso(e.target.value)}
            disabled={enviando}
          >
            {cursos.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title} ({c.slug})
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="pub__grupo" disabled={enviando}>
        <legend className="pub__rotulo">Aula</legend>

        <label className="pub__radio">
          <input
            type="radio"
            name="aulaModo"
            checked={aulaModo === "existente"}
            onChange={() => setAulaModo("existente")}
          />
          <span>
            Uma que já existe
            {aulas.length === 0 && " — este curso ainda não tem aula nenhuma"}
          </span>
        </label>

        {aulaModo === "existente" && (
          <select
            className="pub__select-aula"
            value={aulaId}
            onChange={(e) => setAulaId(e.target.value)}
            disabled={aulas.length === 0}
          >
            <option value="">escolha…</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.slug} · {a.title} · {a.assets}{" "}
                {a.assets === 1 ? "arquivo" : "arquivos"}
              </option>
            ))}
          </select>
        )}

        <label className="pub__radio">
          <input
            type="radio"
            name="aulaModo"
            checked={aulaModo === "nova"}
            onChange={() => setAulaModo("nova")}
          />
          <span>Criar uma aula nova</span>
        </label>

        {aulaModo === "nova" && (
          <div className="pub__nova">
            <label className="pub__campo">
              <span className="pub__rotulo">Slug</span>
              <input
                type="text"
                value={aulaSlug}
                placeholder="aula-04-autenticacao"
                onChange={(e) => setAulaSlug(e.target.value)}
                aria-invalid={slugRuim || undefined}
              />
            </label>
            <label className="pub__campo">
              <span className="pub__rotulo">Título</span>
              <input
                type="text"
                value={aulaTitulo}
                placeholder="Aula 04 — autenticação com cookie httpOnly"
                onChange={(e) => setAulaTitulo(e.target.value)}
              />
            </label>

            {slugRuim && (
              <p className="pub__erro">
                Só minúsculas, números e hífen. O slug entra na URL do material.
              </p>
            )}

            {/*
              O aviso é duro de propósito. A API não tem PATCH de aula: slug e
              título entram uma vez e ficam. Duas aulas já nasceram chamadas
              "Beans E Injecao" porque alguém derivou o título do slug, e não há
              como consertá-las.
            */}
            <p className="pub__aviso">
              <b>Confira antes de publicar:</b> slug e título não podem ser
              trocados depois — a API não tem como renomear aula.
              {SLUG_VALIDO.test(aulaSlug) && (
                <>
                  {" "}
                  Esta vai entrar na posição <b>{idxDe(aulaSlug)}</b>, deduzida
                  do slug.
                </>
              )}
            </p>
          </div>
        )}
      </fieldset>

      <div className="pub__linha">
        <label className="pub__campo">
          <span className="pub__rotulo">Arquivos</span>
          <input
            type="file"
            multiple
            disabled={enviando}
            onChange={(e) => {
              setArquivos(Array.from(e.target.files ?? []));
              setResposta(null);
            }}
          />
        </label>
      </div>

      {arquivos.length > 0 && (
        <ul className="pub__arquivos">
          {arquivos.map((a) => (
            <li key={a.name}>
              <span className="pub__nome">{a.name}</span>
              <span className="pub__kind">{kindDe(a.name, cursoSlug)}</span>
              <span className="pub__tamanho">{Math.max(1, Math.round(a.size / 1024))} KB</span>
            </li>
          ))}
        </ul>
      )}

      <button className="glow-btn" type="submit" disabled={!pronto}>
        {enviando
          ? "publicando…"
          : `Publicar ${arquivos.length || ""} ${
              arquivos.length === 1 ? "arquivo" : "arquivos"
            }`.trim()}
      </button>

      {resposta?.erro && (
        <div className="pub__resultado pub__resultado--erro">
          <p>{resposta.erro}</p>
          {resposta.revalidar && (
            <p>
              <a href={resposta.revalidar}>Revalidar o acesso →</a>
            </p>
          )}
        </div>
      )}

      {resposta?.resultados && (
        <div className="pub__resultado">
          <p>
            <b>
              {resposta.enviados} de {resposta.total} enviados.
            </b>
            {resposta.aulaCriada && <> Aula {resposta.aulaCriada} criada.</>}
          </p>
          <ul>
            {resposta.resultados.map((r) => (
              <li key={r.arquivo} className={r.ok ? "ok" : "falhou"}>
                {r.ok ? "✓" : "✗"} {r.arquivo}
                {r.detalhe && <> — {r.detalhe}</>}
              </li>
            ))}
          </ul>
          {/*
            Recarregar é a forma honesta de atualizar a lista de publicados: ela
            vem do servidor, e refazer o `fetch` no cliente criaria uma segunda
            fonte para a mesma informação.
          */}
          <p>
            <a href="/admin">Recarregar a lista de publicados →</a>
          </p>
        </div>
      )}
    </form>
  );
}
