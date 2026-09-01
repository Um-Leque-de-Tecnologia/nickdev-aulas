import { getAccessToken } from "@/lib/auth/tokens";

/**
 * Onde um material de aula está, resolvido contra a API.
 *
 * Isto era o corpo de `app/material/[curso]/[aula]/[arquivo]/route.ts`, e saiu
 * de lá quando um segundo lugar passou a precisar da mesma resposta: a página
 * que lê material de dentro da área logada. As duas perguntas são idênticas —
 * "onde está o arquivo, e posso pegá-lo?" — e a sequência para responder tem
 * quatro passos e três formas de falhar. Duas cópias disso divergiriam.
 *
 * O que NÃO mora aqui é a decisão do que fazer com a resposta. A rota
 * redireciona ou reescreve links; a página desmonta o documento e desenha no
 * shell. Cada uma decide o seu, com o mesmo `Material` na mão.
 */

const API = process.env.AULAS_API ?? "https://api.aulas.umlequedetecnologia.com.br";

export type MaterialOk = {
  ok: true;
  /** URL de onde buscar os bytes — pública ou assinada, indiferente daqui. */
  url: string;
  contentType?: string;
};

/**
 * Os motivos de não dar, cada um com o tratamento que a tela precisa dar:
 *
 * - `aula` / `arquivo`: não existe. 404, e não há o que tentar.
 * - `sem-sessao`: mandar para o login resolve.
 * - `sem-credencial`: a pessoa ESTÁ logada e a credencial de API morreu.
 *    Mandar para o /entrar sem `renovar=1` devolveria ela para cá com o mesmo
 *    problema — ver `descartaCredencial()` no proxy.ts.
 * - `recusado`: token aceito e a API negou mesmo depois da matrícula.
 * - `api`: a API respondeu o que não devia.
 */
export type MaterialErro = {
  ok: false;
  motivo: "aula" | "arquivo" | "sem-sessao" | "sem-credencial" | "recusado" | "api";
  detalhe?: string;
};

export type Material = MaterialOk | MaterialErro;

export async function resolveMaterial(p: {
  curso: string;
  aula: string;
  arquivo: string;
  /** `false` quando quem chama já sabe que não há sessão nenhuma. */
  temSessao: boolean;
}): Promise<Material> {
  const token = await getAccessToken();

  const cabecalhos: Record<string, string> = { Accept: "application/json" };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  /* O catálogo e a lista de assets são públicos mesmo em curso fechado — o que
     fica de fora é a URL do arquivo. Então esta primeira chamada funciona sem
     token, e é ela que distingue "aula não existe" de "não posso te dar". */
  const rAula = await fetch(
    `${API}/v1/courses/${encodeURIComponent(p.curso)}/lessons/${encodeURIComponent(p.aula)}`,
    { headers: cabecalhos, cache: "no-store" },
  );
  if (!rAula.ok) return { ok: false, motivo: "aula" };

  const detalhe = (await rAula.json()) as {
    id: string;
    assets?: { id: string; filename: string; url?: string; content_type?: string }[];
  };
  const asset = detalhe.assets?.find((a) => a.filename === p.arquivo);
  if (!asset) return { ok: false, motivo: "arquivo" };

  // A API já devolveu a URL no detalhe da aula: não precisa pedir de novo.
  if (asset.url) {
    return { ok: true, url: asset.url, contentType: asset.content_type };
  }

  if (!token) {
    return { ok: false, motivo: p.temSessao ? "sem-credencial" : "sem-sessao" };
  }

  const pedeUrl = () =>
    fetch(`${API}/v1/lessons/${detalhe.id}/assets/${asset.id}/url`, {
      headers: cabecalhos,
      cache: "no-store",
    });

  let rUrl = await pedeUrl();

  /* 403 aqui quer dizer "logado, mas sem matrícula". A regra do produto é que
     quem está logado vê todo curso pago, e a API concorda: o endpoint de
     matrícula aceita qualquer sessão válida. Então matricula e pede de novo —
     uma vez só, senão viraria laço contra a API. */
  if (rUrl.status === 403) {
    const rMatricula = await fetch(
      `${API}/v1/courses/${encodeURIComponent(p.curso)}/enroll`,
      { method: "POST", headers: cabecalhos, cache: "no-store" },
    );
    // 409 é "já estava matriculado" — para o que se quer aqui, sucesso também.
    if (rMatricula.ok || rMatricula.status === 409) rUrl = await pedeUrl();
  }

  // 401 é a API recusando um token que este servidor considerava bom.
  if (rUrl.status === 401) return { ok: false, motivo: "sem-credencial" };
  if (rUrl.status === 403) return { ok: false, motivo: "recusado" };
  if (!rUrl.ok) {
    return { ok: false, motivo: "api", detalhe: `HTTP ${rUrl.status}` };
  }

  const { url } = (await rUrl.json()) as { url: string };
  if (!url) return { ok: false, motivo: "api", detalhe: "resposta sem url" };

  return { ok: true, url, contentType: asset.content_type };
}
