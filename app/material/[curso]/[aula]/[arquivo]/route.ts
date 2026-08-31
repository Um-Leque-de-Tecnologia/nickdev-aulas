import { NextResponse, type NextRequest } from "next/server";
import { getAccessToken } from "@/lib/auth/tokens";

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

const API = process.env.AULAS_API ?? "https://api.aulas.umlequedetecnologia.com.br";

type Params = { curso: string; aula: string; arquivo: string };

/** Redireciona sem deixar a URL assinada em cache de proxy ou no bfcache: ela
 *  é de uma pessoa só e expira. */
function vaiPara(destino: string) {
  return NextResponse.redirect(destino, {
    status: 307,
    headers: { "Cache-Control": "no-store" },
  });
}

function recado(status: number, titulo: string, texto: string, voltarPara: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8">
     <title>${titulo}</title>
     <div style="font:16px/1.6 system-ui,sans-serif;max-width:34rem;margin:20vh auto;padding:0 1.5rem">
       <h1 style="font-size:1.3rem;margin:0 0 .5rem">${titulo}</h1>
       <p style="margin:0 0 1.5rem;color:#555">${texto}</p>
       <a href="${voltarPara}">voltar para o curso</a>
     </div>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { curso, aula, arquivo } = await ctx.params;
  const paginaDoCurso = `/cursos/${encodeURIComponent(curso)}`;

  // O token pode não existir, e tudo bem: o catálogo e a lista de assets são
  // públicos mesmo para curso fechado — o que fica de fora é a URL do arquivo.
  const token = await getAccessToken();
  const cabecalhos: HeadersInit = { Accept: "application/json" };
  if (token) (cabecalhos as Record<string, string>).Authorization = `Bearer ${token}`;

  const rAula = await fetch(
    `${API}/v1/courses/${encodeURIComponent(curso)}/lessons/${encodeURIComponent(aula)}`,
    { headers: cabecalhos, cache: "no-store" },
  );
  if (!rAula.ok) {
    return recado(404, "Aula não encontrada",
      "Esse endereço não corresponde a nenhuma aula publicada.", paginaDoCurso);
  }

  const detalhe = (await rAula.json()) as {
    id: string;
    assets?: { id: string; filename: string; url?: string }[];
  };
  const asset = detalhe.assets?.find((a) => a.filename === arquivo);
  if (!asset) {
    return recado(404, "Material não encontrado",
      `A aula existe, mas não tem nenhum arquivo chamado “${arquivo}”.`, paginaDoCurso);
  }

  // Conteúdo aberto: o CDN entrega direto, sem sessão e sem mais uma volta.
  if (asset.url) return vaiPara(asset.url);

  // Daqui para baixo o conteúdo é fechado.
  const voltarAqui = `/entrar?de=${encodeURIComponent(req.nextUrl.pathname)}`;
  if (!token) return NextResponse.redirect(new URL(voltarAqui, req.nextUrl), { status: 307 });

  const rUrl = await fetch(`${API}/v1/lessons/${detalhe.id}/assets/${asset.id}/url`, {
    headers: cabecalhos,
    cache: "no-store",
  });

  // 401 aqui é token vencido entre a leitura da sessão e esta chamada: mandar
  // para o login resolve, e insistir com o mesmo token não.
  if (rUrl.status === 401) return NextResponse.redirect(new URL(voltarAqui, req.nextUrl), { status: 307 });

  if (rUrl.status === 403) {
    return recado(403, "Conteúdo restrito",
      "Você está logado, mas ainda não tem acesso a este curso.", paginaDoCurso);
  }
  if (!rUrl.ok) {
    return recado(502, "Não deu para abrir o material",
      "A API respondeu de um jeito inesperado. Tente de novo em instantes.", paginaDoCurso);
  }

  const { url } = (await rUrl.json()) as { url: string };
  if (!url) {
    return recado(502, "Não deu para abrir o material",
      "A API não devolveu um endereço para este arquivo.", paginaDoCurso);
  }
  return vaiPara(url);
}
