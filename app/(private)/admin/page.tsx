import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicarMaterial, { type CursoResumo } from "@/components/PublicarMaterial";
import { readSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Admin · NickDev",
};

const API = process.env.AULAS_API ?? "https://api.aulas.umlequedetecnologia.com.br";

/**
 * O catálogo publicado, lido da API.
 *
 * Sem token: `/v1/courses` e `/v1/courses/<slug>` são públicos, e é de propósito
 * — o catálogo e a lista de arquivos de uma aula não são segredo, só a URL do
 * arquivo é. Então esta leitura funciona mesmo quando a credencial de API da
 * sessão está morta, e a tela mostra o estado em vez de uma página vazia.
 *
 * `no-store` porque o único motivo de abrir esta tela é ver o que já subiu. Uma
 * lista de cinco minutos atrás faria a pessoa republicar o que já está lá.
 */
async function catalogo(): Promise<CursoResumo[] | null> {
  try {
    const r = await fetch(`${API}/v1/courses`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) return null;

    const { courses } = (await r.json()) as {
      courses: { id: string; slug: string; title: string }[];
    };

    /* Uma chamada por curso, em paralelo: a listagem não traz as aulas, e são
       sete cursos. Em série isso seriam sete idas e voltas somadas na frente de
       quem só quer ver a tela. */
    return await Promise.all(
      courses.map(async (c) => {
        const det = await fetch(`${API}/v1/courses/${c.slug}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const aulas = det.ok
          ? (
              (await det.json()) as {
                lessons?: { id: string; slug: string; title: string; assets?: unknown[] }[];
              }
            ).lessons ?? []
          : [];

        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          aulas: aulas.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            assets: a.assets?.length ?? 0,
          })),
        };
      }),
    );
  } catch {
    /* API fora do ar não pode derrubar a tela: o componente do formulário sabe
       dizer que sem catálogo não há para onde publicar. */
    return null;
  }
}

export default async function AdminPage() {
  const session = await readSession();

  // 404, e não 403. Um 403 confirma que /admin existe e que alguém tem essa
  // permissão — informação de graça para quem está fuçando. Para quem não é
  // admin, esta rota não existe.
  if (!isAdmin(session)) notFound();

  const cursos = await catalogo();

  const totalAulas = (cursos ?? []).reduce((n, c) => n + c.aulas.length, 0);
  const totalArquivos = (cursos ?? []).reduce(
    (n, c) => n + c.aulas.reduce((m, a) => m + a.assets, 0),
    0,
  );

  return (
    <>
      <div className="eyebrow">Administração</div>
      <h1>Publicar material</h1>
      <p className="lead">
        Sobe slide, guia, desafio ou código para a API, que guarda e entrega pelo
        CDN. O envio usa a sua própria credencial de admin — a mesma role do
        Keycloak que abre esta tela.
      </p>
      <div className="brand-rule" />

      <PublicarMaterial cursos={cursos ?? []} />

      <div className="section-label">Já publicado</div>
      {cursos === null ? (
        <div className="card">
          <p>A API não respondeu agora. Recarregue em instantes.</p>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-2)", fontSize: 15, marginBottom: 18 }}>
            {cursos.length} cursos · {totalAulas} aulas · {totalArquivos} arquivos
            no CDN.
          </p>
          <div className="pubtree">
            {cursos.map((c) => (
              <details className="pubtree__curso" key={c.slug} open={c.aulas.length === 0}>
                <summary>
                  <span className="pubtree__titulo">{c.title}</span>
                  <span className="mono pubtree__slug">{c.slug}</span>
                  <span className="pubtree__conta">
                    {c.aulas.length === 0
                      ? "nenhuma aula"
                      : `${c.aulas.length} ${c.aulas.length === 1 ? "aula" : "aulas"}`}
                  </span>
                </summary>
                {c.aulas.length > 0 && (
                  <ul className="pubtree__aulas">
                    {c.aulas.map((a) => (
                      <li key={a.id}>
                        <span className="mono">{a.slug}</span>
                        <span className="pubtree__aula-titulo">{a.title}</span>
                        <span className="pubtree__conta">
                          {a.assets} {a.assets === 1 ? "arquivo" : "arquivos"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Para um lote grande, use o script</div>
      <div className="card">
        <p>
          Esta tela é para subir um material ou dois. Para republicar um curso
          inteiro — ou para reenviar os 87 arquivos de uma migração — o caminho
          continua sendo o <span className="mono">scripts/sincroniza-cdn.mjs</span>,
          que compara disco e CDN, mostra o plano antes e só envia o que mudou.
        </p>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-3)" }}>
          Ele também é o único que cria curso. Aqui dá para criar aula, porque
          isso acontece toda semana; curso novo acontece uma vez por semestre e
          exige decidir <span className="mono">visibility</span>,{" "}
          <span className="mono">level</span> e posição — coisas que uma tela
          apressada acerta errado.
        </p>
      </div>

      <div className="section-label">Como se libera acesso hoje</div>
      <div className="card">
        <p>
          Pelo console do Keycloak. Abra a pessoa em <em>Users</em>, vá em{" "}
          <em>Role mapping</em> e atribua a role do client{" "}
          <span className="mono">curso-&lt;slug&gt;</span> — o slug é o mesmo da
          pasta do curso, então o Next.js + IA é{" "}
          <span className="mono">curso-nextjs-ia</span>.
        </p>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-3)" }}>
          Hoje isso não muda nada para curso pago: quem tem sessão vê todos —
          ver <span className="mono">canSee</span> em{" "}
          <span className="mono">lib/auth/roles.ts</span>. A role que ainda
          decide algo é a <span className="mono">aulas-admin</span>, que é a que
          abre esta tela.
        </p>
      </div>
    </>
  );
}
