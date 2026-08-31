import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, isKeycloakConfigured } from "@/lib/auth/config";
import { logoutUrl } from "@/lib/auth/keycloak";
import {
  clearTokensCookies,
  cookieOptions,
  ID_TOKEN_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/session";

/**
 * Sair é POST, e só POST.
 *
 * Não existe `GET` aqui de propósito. Logout por GET qualquer site dispara: uma
 * `<img src="https://aulas.../sair">` num fórum desloga quem estiver lendo a
 * página. É CSRF de baixo impacto, mas é gratuito de evitar — o botão de sair é
 * um `<form method="post" action="/sair">`. Sem handler GET, o Next responde
 * 405 sozinho.
 */
export async function POST(req: NextRequest) {
  const origin = baseUrl(req);

  // O id_token guardado no login vira `id_token_hint`: é com ele que o Keycloak
  // sabe qual sessão encerrar e aceita o redirect de volta para cá.
  const idToken = req.cookies.get(ID_TOKEN_COOKIE)?.value;

  // Sem Keycloak configurado — o caso do atalho de login de desenvolvimento —
  // não existe sessão remota para encerrar, e montar a URL de fim de sessão
  // exigiria variáveis que não estão lá. Apagar os cookies e voltar para a home
  // JÁ É o logout inteiro nesse ambiente, porque a única sessão possível é a de
  // mentira, que vive só neste cookie.
  const destination = isKeycloakConfigured()
    ? await logoutUrl({ idToken, returnTo: origin })
    : origin;

  // 303, não 307: o 307 mandaria o navegador repetir o POST no destino. Depois
  // de um formulário, quem redireciona quer um GET do outro lado.
  const res = NextResponse.redirect(destination, 303);

  // Apaga aqui, antes de ir para o Keycloak. Se a volta falhar por qualquer
  // motivo, a pessoa já saiu deste site — que é o que ela pediu.
  const expired = cookieOptions(0);
  res.cookies.set(SESSION_COOKIE, "", expired);
  res.cookies.set(ID_TOKEN_COOKIE, "", expired);
  // O cookie dos tokens sai junto, e este é o que menos pode ficar para trás:
  // sessão esquecida é um nome antigo no cookie jar; refresh token esquecido é
  // uma credencial viva do Keycloak parada no navegador de quem acabou de
  // pedir para sair. Cookie de sessão apagado em qualquer lugar deste código
  // apaga este também — são um par, não dois cookies independentes.
  // Todas as fatias saem, e não só `nd_tok`: o JWE fica cortado em quatro
  // cookies, e apagar o primeiro deixa os outros três parados no navegador
  // guardando o pedaço maior do refresh token de quem acabou de pedir para sair.
  clearTokensCookies(res.cookies);

  return res;
}
