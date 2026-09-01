import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { resolveMaterial } from "@/lib/material";

/**
 * Entrega um material de aula.
 *
 * A maior parte do conteúdo é pública e mora no CDN, e as páginas de curso
 * apontam direto para lá — sem passar por aqui, sem custo de Worker e sem
 * exigir login. Esta rota existe para o resto: curso com
 * `visibility=authenticated` tem os arquivos FORA do caminho público (o
 * `/public/{curso}/{aula}/{arquivo}` do CDN devolve 404 para eles) e só é
 * alcançável por URL assinada, que a API emite por pedido e por pessoa.
 *
 * Ela funciona para os dois casos, e é isso que a torna segura de usar em
 * qualquer link: quando o asset tem URL pública, redireciona para ela e não
 * pede nada; só exige sessão quando o conteúdo é realmente fechado. Assim um
 * link apontado para cá por engano não passa a pedir login sem motivo.
 *
 * O que ela NÃO faz é decidir quem pode ver: isso é a API que responde. Aqui
 * só se traduz a resposta dela em algo navegável.
 */

/**
 * O domínio que está GRAVADO dentro dos arquivos de material.
 *
 * Quando os materiais sairam de `public/` para o CDN (commit 98bded0), os links
 * internos deles foram reescritos de `/cursos/x` para
 * `https://aulas.umlequedetecnologia.com.br/cursos/x`. Foi a decisão certa na
 * hora: o arquivo passou a ser servido pelo domínio do CDN, e ali um caminho
 * relativo resolve para `cdn.aulas…/cursos/x`, que não existe.
 *
 * O efeito colateral é que o link ficou preso em produção. Rodando local, o
 * "voltar ao curso" do slide manda a pessoa para o site publicado — outra
 * origem, outro cookie — e ela perde a área logada onde estava. É este valor
 * que `paraOrigemDoApp()` troca por caminho relativo, e é por isso que ele mora
 * aqui e não numa variável de ambiente: não é configuração deste app, é uma
 * string que está dentro de arquivos que vivem em outro lugar.
 */
const DOMINIO_NOS_ARQUIVOS =
  /https?:\/\/(?:www\.)?aulas\.umlequedetecnologia\.com\.br/g;

/**
 * Deixa os links do material apontando para a origem que está servindo a
 * página — que é esta, agora que o HTML passa por aqui. Root-relative funciona
 * em localhost e em produção sem saber o nome de nenhum dos dois, e de quebra o
 * desvio do proxy passa a valer: `/cursos/x` com sessão vira
 * `/painel/cursos/x`.
 */
function paraOrigemDoApp(html: string): string {
  /* Regex, e nao string fixa: os arquivos foram reescritos em massa e nada
     garante que todos usem exatamente a mesma forma. `http` ou `https`, com ou
     sem `www` — todas viram caminho relativo. */
  return html.replace(DOMINIO_NOS_ARQUIVOS, "");
}

type Params = { curso: string; aula: string; arquivo: string };

/**
 * Entrega o arquivo: HTML pela nossa origem, o resto direto do CDN.
 *
 * Existe porque havia dois caminhos de saida nesta rota — a URL que a API ja
 * devolve no detalhe da aula, e a URL assinada que ela emite sob pedido — e so
 * o segundo passava pela reescrita de links. Resultado: dependendo de qual
 * caminho a aula seguia, o "voltar ao curso" do slide continuava apontando para
 * o dominio de producao e jogava a pessoa fora da area logada.
 *
 * O erro estava em tratar `asset.url` preenchido como "conteudo aberto". Ele nao
 * diz isso: numa requisicao autenticada a API pode simplesmente ja ter incluido
 * a URL no detalhe da aula. Publico ou fechado e questao de AUTORIZACAO, e nao
 * muda o fato de que HTML servido de outra origem carrega links que apontam para
 * fora do app.
 *
 * Por isso a decisao aqui e por TIPO, nao por procedencia: HTML atravessa o
 * Worker para os links serem reescritos; PDF, imagem e zip vao direto, porque
 * neles nao ha link nenhum e o Worker so custaria banda.
 */
async function entrega(p: {
  url: string;
  arquivo: string;
  contentType?: string;
  paginaDoCurso: string;
}): Promise<NextResponse> {
  const ehHtml =
    (p.contentType ?? "").includes("text/html") || p.arquivo.endsWith(".html");
  if (!ehHtml) return vaiPara(p.url);

  const r = await fetch(p.url, { cache: "no-store" });
  if (!r.ok) {
    return recado(502, "Não deu para abrir o material",
      "O arquivo não respondeu no CDN. Tente de novo em instantes.", p.paginaDoCurso);
  }

  return new NextResponse(paraOrigemDoApp(await r.text()), {
    headers: {
      "Content-Type": p.contentType ?? "text/html; charset=utf-8",
      /* `private`: a resposta pode ter vindo de uma URL assinada para uma
         pessoa. Cinco minutos poupam o Worker de refazer a volta a cada F5 num
         slide que fica aberto a aula inteira. */
      "Cache-Control": "private, max-age=300",
    },
  });
}

/** Redireciona sem deixar a URL assinada em cache de proxy ou no bfcache: ela
 *  é de uma pessoa só e expira. */
function vaiPara(destino: string) {
  return NextResponse.redirect(destino, {
    status: 307,
    headers: { "Cache-Control": "no-store" },
  });
}

function recado(
  status: number,
  titulo: string,
  texto: string,
  voltarPara: string,
  /* Acao principal, quando existe uma. Sem ela a pagina so oferece a volta —
     que e o certo para "nao existe" e "nao deu", onde nao ha o que tentar. */
  acao?: { texto: string; href: string },
) {
  const botao = acao
    ? `<p style="margin:0 0 1.25rem"><a href="${acao.href}" style="display:inline-block;padding:.6rem 1.1rem;border-radius:.5rem;background:#F24487;color:#fff;text-decoration:none;font-weight:600">${acao.texto}</a></p>`
    : "";
  return new NextResponse(
    `<!doctype html><meta charset="utf-8">
     <title>${titulo}</title>
     <div style="font:16px/1.6 system-ui,sans-serif;max-width:34rem;margin:20vh auto;padding:0 1.5rem">
       <h1 style="font-size:1.3rem;margin:0 0 .5rem">${titulo}</h1>
       <p style="margin:0 0 1.5rem;color:#555">${texto}</p>
       ${botao}
       <a href="${voltarPara}">voltar para o curso</a>
     </div>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { curso, aula, arquivo } = await ctx.params;
  const paginaDoCurso = `/cursos/${encodeURIComponent(curso)}`;
  const voltarAqui = `/entrar?de=${encodeURIComponent(req.nextUrl.pathname)}`;
  /* Mesmo destino, forçando a reautenticação: é o link de quem tem sessão viva
     e credencial morta. Ver `renovar` em app/entrar. */
  const renovarAqui = `${voltarAqui}&renovar=1`;

  /* Onde está o arquivo — e se dá para pegá-lo. A sequência tem quatro passos e
     três formas de falhar, e mora em lib/material.ts porque a página que lê
     material dentro da área logada faz a mesma pergunta. Aqui só se traduz a
     resposta em algo navegável. */
  const material = await resolveMaterial({
    curso,
    aula,
    arquivo,
    temSessao: (await readSession()) !== null,
  });

  if (!material.ok) {
    switch (material.motivo) {
      case "aula":
        return recado(404, "Aula não encontrada",
          "Esse endereço não corresponde a nenhuma aula publicada.", paginaDoCurso);

      case "arquivo":
        return recado(404, "Material não encontrado",
          `A aula existe, mas não tem nenhum arquivo chamado “${arquivo}”.`, paginaDoCurso);

      /* Sem sessão o /entrar resolve: leva ao Keycloak e volta. */
      case "sem-sessao":
        return NextResponse.redirect(new URL(voltarAqui, req.nextUrl), { status: 307 });

      /* Com sessão e sem credencial, mandar para o /entrar sem `renovar=1` não
         resolve: ele vê sessão válida e devolve para cá com o mesmo problema.
         Antes isso era um 307 calado que virava passeio até o painel. */
      case "sem-credencial":
        return recado(
          409,
          "Precisamos revalidar o seu acesso",
          "Você continua logado — o que venceu foi a credencial que a API pede " +
            "para liberar o material. É um clique para recuperar, e você volta " +
            "direto para este arquivo.",
          paginaDoCurso,
          { texto: "Revalidar e abrir o material", href: renovarAqui },
        );

      case "recusado":
        return recado(403, "Conteúdo restrito",
          "Você está logado e a matrícula foi tentada, mas a API não liberou este material.",
          paginaDoCurso);

      default:
        return recado(502, "Não deu para abrir o material",
          "A API respondeu de um jeito inesperado. Tente de novo em instantes.", paginaDoCurso);
    }
  }

  return entrega({
    url: material.url,
    arquivo,
    contentType: material.contentType,
    paginaDoCurso,
  });
}
