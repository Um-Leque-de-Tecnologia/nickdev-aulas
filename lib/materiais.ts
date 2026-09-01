/**
 * As regras de material que a tela de publicação e o script precisam concordar.
 *
 * ⚠️ Isto é uma SEGUNDA cópia. A primeira está em `scripts/sincroniza-cdn.mjs`,
 * e a duplicação não é descuido: o script é um `.mjs` que roda com `node` cru,
 * sem passar por bundler nenhum, então ele não consegue importar TypeScript. As
 * duas cópias precisam bater na mão.
 *
 * O que acontece se elas divergirem, para quem vier depois medir o risco: um
 * arquivo publicado pela tela ganharia um `kind` diferente do mesmo arquivo
 * publicado pelo script, e `kind` é metadado que a API grava e não tem PATCH.
 * Por isso o que mora aqui é só a parte pequena e estável — derivação de `kind`,
 * de MIME e de índice — e não a lógica de plano, que continua só no script.
 */

/** O enum de `kind` da API. */
export type Kind =
  | "slides"
  | "guia"
  | "desafio"
  | "codigos"
  | "modelo"
  | "roteiro"
  | "projeto"
  | "imagem"
  | "estilo"
  | "outro";

/** O curso que guarda os guias de tecnologia, um por aula. */
export const CURSO_GUIAS = "guias";

/**
 * O `kind` deduzido do nome do arquivo.
 *
 * No curso dos guias o arquivo se chama pela tecnologia (`css.html`,
 * `java.html`), então quem decide ali é o curso, não o prefixo do nome.
 */
export function kindDe(nomeArquivo: string, cursoSlug: string): Kind {
  if (cursoSlug === CURSO_GUIAS) return "guia";

  const nome = nomeArquivo.toLowerCase();
  if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(nome)) return "imagem";
  if (/\.css$/.test(nome)) return "estilo";
  if (nome === "brief.html") return "projeto";

  const prefixos: [string, Kind][] = [
    ["slides", "slides"],
    ["guia", "guia"],
    ["desafio", "desafio"],
    ["codigos", "codigos"],
    ["modelo", "modelo"],
    ["roteiro", "roteiro"],
    // `manual.html` e guia de aula: passo a passo de consulta, e nao o
    // roteiro de quem ensina. Sem esta linha ele entraria como "outro".
    ["manual", "guia"],
  ];
  for (const [prefixo, kind] of prefixos) {
    if (nome.startsWith(prefixo)) return kind;
  }
  return "outro";
}

/**
 * O MIME que a API grava e o CDN devolve depois.
 *
 * Não é detalhe: a API guarda o Content-Type que veio na parte do multipart, e
 * um arquivo enviado sem tipo chega ao aluno como `application/octet-stream` —
 * que o navegador BAIXA em vez de abrir. Aconteceu com os 67 primeiros envios do
 * script. O `charset=utf-8` casa com o que os assets antigos já usam, para o
 * tipo não virar sozinho um motivo de reenvio.
 *
 * O `File` do navegador já traz um `type`, mas ele vem do sistema operacional e
 * costuma ser `text/html` sem charset — então aqui a fonte é a extensão, e não o
 * que o SO achou.
 */
export function tipoDe(nomeArquivo: string): string {
  const ponto = nomeArquivo.lastIndexOf(".");
  const ext = ponto < 0 ? "" : nomeArquivo.slice(ponto).toLowerCase();
  const tipos: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  return tipos[ext] ?? "application/octet-stream";
}

/**
 * O índice da aula a partir do slug: `aula-03-...` → 3, `projeto` → 0.
 *
 * O número decide a ORDEM da aula na listagem da API, e o slug é o único lugar
 * onde ele já está escrito — pedir para a pessoa digitar de novo é pedir para
 * as duas coisas divergirem.
 */
export function idxDe(slug: string): number {
  const m = /^aula-(\d+)/.exec(slug);
  return m ? Number(m[1]) : 0;
}

/**
 * Slug aceitável para uma aula nova.
 *
 * Estreito de propósito: o slug entra na URL do material e no caminho do CDN, e
 * a API não tem PATCH de aula — slug errado é permanente. Minúsculas, dígitos e
 * hífen, começando e terminando em caractere alfanumérico.
 */
export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
