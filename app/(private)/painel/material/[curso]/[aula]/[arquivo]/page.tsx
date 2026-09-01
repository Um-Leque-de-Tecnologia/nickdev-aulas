import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import GuiaScripts from "@/components/GuiaScripts";
import { desmonta } from "@/lib/guia-inline";
import { resolveMaterial } from "@/lib/material";
import { readSession } from "@/lib/auth/session";
import { courseBySlug } from "@/lib/cursos";

/**
 * Material de aula lido DENTRO da área logada, com o tratamento de guia.
 *
 * Terceira da mesma família: `/painel/cursos/[slug]` e `/painel/guias/[slug]`
 * já existem, e a ideia é a de sempre — quem está logado não perde a navegação
 * ao abrir uma coisa. Aqui a coisa é um documento de consulta que mora no CDN.
 *
 * Como ela decide se um material serve para isso: pela ESTRUTURA, e não por uma
 * lista de nomes de arquivo. `desmonta()` procura um `<main>`; documento de
 * consulta tem, deck de slides não tem — ele é feito de
 * `<section class="slide">`. Quando não desmonta, esta página manda para a
 * versão de página inteira, que é onde um deck deve abrir mesmo: em tela cheia,
 * sem sidebar competindo com o slide.
 *
 * O ganho, comparado a abrir o mesmo arquivo por `/material/...`: a sidebar do
 * app continua na tela e o índice do documento vira barra fixa à direita,
 * acompanhando a leitura.
 *
 * Sem "voltar ao curso", e a ausência é decisão — igual à página de guia. A
 * sidebar do app já leva ao painel e a qualquer curso em um clique; um backlink
 * acima do documento repetia isso e empurrava a primeira dobra para baixo, num
 * texto que é para ser lido.
 */

type Props = {
  /** No Next 16 `params` é Promise, e precisa de `await`. */
  params: Promise<{ curso: string; aula: string; arquivo: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { curso, arquivo } = await params;
  const nome = courseBySlug(curso)?.name ?? curso;
  // O `robots: noindex` do layout de (private) é herdado sem repetir aqui.
  return { title: `${arquivo} · ${nome} · NickDev` };
}

export default async function MaterialNaAreaLogada({ params }: Props) {
  const { curso, aula, arquivo } = await params;

  // O layout já barrou quem não tem sessão. Repito pelo mesmo motivo das outras
  // páginas de (private): layout não entrega valor para a página, e uma página
  // que se protege sozinha continua protegida se mudar de pasta.
  const session = await readSession();
  if (!session) redirect("/entrar");

  /* `?inteira=1` e o que impede o laco: sem ele, o proxy pegaria este redirect
     e mandaria de volta para esta pagina, que desistiria de novo. Ver `INTEIRA`
     em proxy.ts. */
  const paginaInteira = `/material/${encodeURIComponent(curso)}/${encodeURIComponent(
    aula,
  )}/${encodeURIComponent(arquivo)}?inteira=1`;

  const material = await resolveMaterial({ curso, aula, arquivo, temSessao: true });

  if (!material.ok) {
    /* Aula ou arquivo que não existem são 404 do app, com a moldura do app.
       O resto — credencial morta, acesso negado, API estranha — não é 404: é
       um estado que a página inteira já sabe explicar, com botão de revalidar
       e tudo. Mandar para lá evita escrever a mesma explicação duas vezes. */
    if (material.motivo === "aula" || material.motivo === "arquivo") notFound();
    redirect(paginaInteira);
  }

  const resposta = await fetch(material.url, { cache: "no-store" });
  if (!resposta.ok) redirect(paginaInteira);

  const doc = desmonta(await resposta.text());

  /* Não desmontou: é deck de slides, ou qualquer coisa sem `<main>`. Página
     inteira é o lugar certo — e o redirect é para a URL que já existe, não uma
     tela nova dizendo "abra em outro lugar". */
  if (doc === null) redirect(paginaInteira);

  return (
    <>
      {/* O CSS do documento, já reescrito para não escapar de `.guia-doc`. */}
      <style dangerouslySetInnerHTML={{ __html: doc.css }} />

      <div className="guia-doc">
        <aside className="guia__indice">
          <span className="guia__indice-titulo">Neste documento</span>
          <nav
            aria-label={`Índice de ${arquivo}`}
            dangerouslySetInnerHTML={{ __html: doc.indice }}
          />
        </aside>

        <main className="guia__texto" dangerouslySetInnerHTML={{ __html: doc.conteudo }} />
      </div>

      <GuiaScripts codigo={doc.script} />

      {/*
        A saída para a versão de página inteira fica explícita. Quem quer o
        documento sem moldura — para imprimir, ou para abrir numa janela ao lado
        do editor — não deveria ter que descobrir a URL.
      */}
      <p className="guia-doc__saida">
        <a href={paginaInteira} target="_blank" rel="noopener noreferrer">
          Abrir em página inteira ↗
        </a>
      </p>
    </>
  );
}
