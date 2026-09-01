import { hrefDoGuia } from "@/lib/guias";

/**
 * O guia do CDN, desmontado para caber dentro de uma página do app.
 *
 * O guia é um documento HTML inteiro e auto-contido: `<head>` próprio, ~14 KB
 * de CSS próprio, índice próprio e um script que faz os botões de copiar e as
 * prévias ao vivo funcionarem. Antes ele entrava num `<iframe>`, que resolvia
 * o isolamento de graça — e cobrava caro por ele: o conteúdo ficava preso num
 * retângulo com rolagem própria, dentro da rolagem da página.
 *
 * Sem o iframe, o isolamento passa a ser trabalho deste arquivo. São três
 * problemas, e cada função abaixo resolve um:
 *
 *   1. o CSS do guia vazaria no app. Ele tem 24 seletores de elemento nu
 *      (`body`, `a`, `h1`, `main`, `aside`, `*`) e um `:root` que redefine as
 *      variáveis da marca — solto na página, ele repinta o app inteiro. Por
 *      isso todo seletor é reescrito para viver sob `.guia`;
 *   2. o guia traz a própria moldura — marca NickDev e um "← todos os guias"
 *      que aponta para a home pública. Na área logada isso é marca repetida e
 *      uma porta para fora do app no meio da tela. Só o `<nav>` do índice e o
 *      `<main>` são aproveitados;
 *   3. `<style>` e `<script>` que moram no corpo do documento precisam sair do
 *      HTML extraído: o estilo vai para o escopador junto com o resto, e o
 *      script volta pelo componente de cliente, porque marcação injetada por
 *      `innerHTML` nunca executa script.
 */

/** O container que passa a delimitar tudo que veio do guia. */
/* `.guia-doc`, e não `.guia`: aquele nome já era o CARD de guia da home
 * (fundo, borda, raio, padding — ver globals.css). Usar o mesmo aqui fazia o
 * documento inteiro herdar a aparência de card por acidente: o guia abria
 * dentro de uma caixa com sobra dos dois lados, e ninguém tinha escrito isso
 * em lugar nenhum. */
const SCOPE = ".guia-doc";

export type GuiaInline = {
  /** CSS do guia, já reescrito para não escapar de `.guia`. */
  css: string;
  /** O `<nav>` do índice, sem a marca e sem o "voltar" do guia. */
  indice: string;
  /** O conteúdo do guia. */
  conteudo: string;
  /** O script do guia, para o cliente executar depois da montagem. */
  script: string;
};

/**
 * Um seletor reescrito para valer só dentro de `.guia`.
 *
 * `:root`, `html` e `body` viram o próprio container: são os três que carregam
 * as variáveis da marca e a tipografia base do guia, e sem essa troca ou eles
 * repintariam o app inteiro, ou as variáveis sumiriam e o guia sairia sem cor.
 */
function scopeSelector(raw: string): string {
  const selector = raw.trim();
  if (selector === "") return "";
  if (selector === "*") return `${SCOPE} *`;
  if (selector === ":root") return SCOPE;

  // `:root[data-theme="dark"]` e parentes: o resto do seletor é preservado.
  if (selector.startsWith(":root")) return SCOPE + selector.slice(":root".length);

  // `body`, `body.algo`, `html main`: o primeiro pedaço vira o container.
  const raiz = selector.match(/^(?:html|body)\b/);
  if (raiz) {
    const resto = selector.slice(raiz[0].length);
    return resto.trim() === "" ? SCOPE : `${SCOPE}${resto}`;
  }

  return `${SCOPE} ${selector}`;
}

/**
 * O conteúdo entre `{` e o `}` que o fecha, respeitando aninhamento.
 *
 * Precisa contar chaves em vez de procurar o primeiro `}`: um `@media` tem
 * regras dentro, e parar na primeira chave fechada cortaria o bloco no meio.
 * Aspas entram na conta porque `content: "}"` é CSS válido e derrubaria a
 * contagem.
 */
function readBlock(css: string, open: number): { content: string; end: number } {
  let depth = 0;
  let i = open;
  let quote: string | null = null;

  while (i < css.length) {
    const ch = css[i];

    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "/" && css[i + 1] === "*") {
      const fim = css.indexOf("*/", i + 2);
      i = fim === -1 ? css.length : fim + 1;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return { content: css.slice(open + 1, i), end: i + 1 };
    }

    i++;
  }

  // Chave sem fechamento: devolve o que sobrou em vez de perder o resto.
  return { content: css.slice(open + 1), end: css.length };
}

/** At-rules cujo miolo NÃO é lista de seletores e não pode ser escopado. */
const AT_RULES_SEM_SELETOR = /^@(-\w+-)?(keyframes|font-face|property|counter-style|page)\b/i;

/**
 * Todo o CSS do guia reescrito para não sair de `.guia`.
 *
 * Regras aninhadas (`&`) não precisam de tratamento: elas moram dentro de um
 * bloco cujo seletor já foi escopado, então herdam o container de graça.
 */
export function scopeCss(css: string): string {
  let saida = "";
  let i = 0;

  while (i < css.length) {
    const ch = css[i];

    // Comentário: copiado como está.
    if (ch === "/" && css[i + 1] === "*") {
      const fim = css.indexOf("*/", i + 2);
      const parada = fim === -1 ? css.length : fim + 2;
      saida += css.slice(i, parada);
      i = parada;
      continue;
    }

    if (/\s/.test(ch)) {
      saida += ch;
      i++;
      continue;
    }

    if (ch === "@") {
      const abre = css.indexOf("{", i);
      const ponto = css.indexOf(";", i);

      // `@import`, `@charset`: terminam em `;`, sem bloco.
      if (ponto !== -1 && (abre === -1 || ponto < abre)) {
        saida += css.slice(i, ponto + 1);
        i = ponto + 1;
        continue;
      }
      if (abre === -1) {
        saida += css.slice(i);
        break;
      }

      const prelude = css.slice(i, abre + 1);
      const bloco = readBlock(css, abre);

      // `@media`, `@supports`, `@layer`, `@container` embrulham regras — o
      // miolo passa pelo mesmo tratamento. `@keyframes` e `@font-face` não:
      // ali dentro `from`, `to` e `50%` não são seletores de elemento.
      saida += AT_RULES_SEM_SELETOR.test(prelude)
        ? prelude + bloco.content + "}"
        : prelude + scopeCss(bloco.content) + "}";

      i = bloco.end;
      continue;
    }

    const abre = css.indexOf("{", i);
    if (abre === -1) {
      saida += css.slice(i);
      break;
    }

    const bloco = readBlock(css, abre);
    const escopado = css
      .slice(i, abre)
      .split(",")
      .map(scopeSelector)
      .filter((s) => s !== "")
      .join(", ");

    saida += `${escopado}{${bloco.content}}`;
    i = bloco.end;
  }

  return saida;
}

/** O miolo da primeira ocorrência de uma tag que aparece uma vez só no guia. */
function inner(html: string, tag: string): string {
  const abre = html.search(new RegExp(`<${tag}[\\s>]`, "i"));
  if (abre === -1) return "";
  const fimDaAbertura = html.indexOf(">", abre);
  const fecha = html.toLowerCase().indexOf(`</${tag}>`, fimDaAbertura);
  if (fimDaAbertura === -1 || fecha === -1) return "";
  return html.slice(fimDaAbertura + 1, fecha);
}

/** Todo o conteúdo de `<style>`/`<script>`, e o HTML sem essas tags. */
function extrairTags(html: string, tag: "style" | "script") {
  const padrao = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const partes: string[] = [];
  const limpo = html.replace(padrao, (_todo, corpo: string) => {
    partes.push(corpo);
    return "";
  });
  return { partes, limpo };
}

/**
 * Busca o guia no CDN e devolve as peças prontas para a página montar.
 *
 * `no-store` porque a rota já é dinâmica e o guia é republicado pelo script de
 * sincronia do CDN — guardar aqui só atrasaria a correção de um texto errado.
 */
/**
 * Desmonta um documento já em mãos.
 *
 * Separado do `carregaGuia` porque a origem do HTML deixou de ser sempre a
 * mesma: o guia de tecnologia vem de uma URL pública do CDN, e o manual da IA —
 * que é material de curso fechado — vem de uma URL ASSINADA, emitida pela API
 * por pessoa e por pedido. Quem sabe obter aquela URL é a rota do material, não
 * este arquivo; então este arquivo passou a aceitar o HTML pronto.
 *
 * Devolve `null` quando o documento não é desmontável — sem `<main>`, não há o
 * que colocar na coluna de leitura. É esse `null` que separa um documento de
 * consulta de um deck de slides, sem precisar de uma lista de nomes de arquivo:
 * o deck não tem `<main>`, tem `<section class="slide">`, e cai fora sozinho.
 */
export function desmonta(html: string): GuiaInline | null {
  const estilos = extrairTags(html, "style");
  const scripts = extrairTags(estilos.limpo, "script");
  const semTags = scripts.limpo;

  const conteudo = inner(semTags, "main");
  if (conteudo.trim() === "") return null;

  return {
    css: scopeCss(estilos.partes.join("\n")),
    indice: inner(inner(semTags, "aside"), "nav"),
    conteudo,
    script: scripts.partes.join("\n;\n"),
  };
}

export async function carregaGuia(slug: string): Promise<GuiaInline | null> {
  const resposta = await fetch(hrefDoGuia(slug), { cache: "no-store" });
  if (!resposta.ok) return null;

  /* O índice sai do `<nav>` de dentro do `<aside>`, e não do `<aside>` inteiro:
     ali vêm também a marca do guia e o "← todos os guias", que aponta para a
     home pública. Os dois já existem, e melhor, na sidebar do app. O como está
     em `desmonta()`. */
  return desmonta(await resposta.text());
}
