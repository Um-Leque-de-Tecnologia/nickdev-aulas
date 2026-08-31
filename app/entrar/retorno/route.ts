import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, readConfig } from "@/lib/auth/config";
import {
  claimsDoAccessToken,
  exchangeCodeForTokens,
  verifyIdToken,
} from "@/lib/auth/keycloak";
import { rolesFromClaims } from "@/lib/auth/roles";
import {
  clearTokensCookies,
  cookieOptions,
  encryptSession,
  encryptTokens,
  ID_TOKEN_COOKIE,
  SESSION_COOKIE,
  writeTokensCookies,
  type Session,
} from "@/lib/auth/session";

/**
 * Os quatro cookies temporários gravados por app/entrar/route.ts. Os nomes
 * estão repetidos nas duas pontas porque `route.ts` não aceita export que não
 * seja verbo HTTP — mudou lá, muda aqui.
 */
const PKCE_COOKIE = "nd_pkce";
const STATE_COOKIE = "nd_state";
const NONCE_COOKIE = "nd_nonce";
const RETURN_COOKIE = "nd_return";
const TEMPORARY_COOKIES = [
  PKCE_COOKIE,
  STATE_COOKIE,
  NONCE_COOKIE,
  RETURN_COOKIE,
] as const;

/**
 * Quanto a sessão dura — agora amarrada ao refresh token, e não mais a oito
 * horas fixas.
 *
 * As oito horas existiam por falta de opção. O access token do Keycloak vale
 * uns cinco minutos, não havia renovação nenhuma aqui, e prender o cookie ao
 * `expires_in` deslogaria a pessoa no meio da aula. Oito horas era um chute
 * que cobria um dia de estudo.
 *
 * Com o refresh token guardado, o chute deixa de fazer sentido nos dois
 * sentidos. Para MENOS: se o refresh vence em trinta minutos, uma sessão de
 * oito horas continua desenhando a tela por sete horas e meia enquanto a API
 * recusa tudo — o pior dos mundos, um "logado" que não funciona e não explica.
 * Para MAIS: se o realm der um refresh de vários dias, cortar em oito horas é
 * expulsar quem o Keycloak ainda reconhece.
 *
 * A régua passa a ser o `refresh_expires_in`: a sessão vale exatamente
 * enquanto der para renovar. E a cada renovação no proxy a janela recomeça,
 * então quem está usando o site não é interrompido.
 */

/**
 * O teto de quando o Keycloak não diz.
 *
 * `refresh_expires_in` é opcional, e o Keycloak manda 0 quando o refresh token
 * não expira (o caso dos offline tokens). Nos dois casos não há número para
 * seguir, e cookie eterno não é resposta. Ficam as mesmas oito horas — agora
 * como limite explícito de último caso, e não como a regra.
 */
const SESSION_FALLBACK_MAX_AGE_SECONDS = 8 * 60 * 60;

function sessionMaxAge(refreshExpiresIn: number | undefined): number {
  if (refreshExpiresIn === undefined || refreshExpiresIn <= 0) {
    return SESSION_FALLBACK_MAX_AGE_SECONDS;
  }
  return refreshExpiresIn;
}

const DEFAULT_RETURN_PATH = "/painel";

/**
 * O que a pessoa vê no lugar do erro cru. Vira `?motivo=` em /entrar/erro, que
 * escolhe a frase. Detalhe técnico não passa por aqui: nem o erro do Keycloak,
 * nem a mensagem da exceção.
 */
type FailureReason =
  | "acesso_negado"
  | "login_falhou"
  | "pedido_invalido"
  | "token_invalido";

/**
 * Mesma regra de /entrar: barra sim, barra dupla não, e nenhum caractere de
 * controle — tab, CR e LF são apagados pelo parser de URL e deixariam
 * `/%09//site-falso.com` escapar dos testes de prefixo. Ver o comentário lá.
 */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * As roles desta pessoa, lidas do ACCESS token — não do id_token, que não as
 * carrega. Ver `claimsDoAccessToken` para o porquê.
 *
 * Falhar aqui não derruba o login: sem roles a pessoa entra como aluno comum,
 * que é o lado seguro para errar. Mas o motivo vai para o log, porque
 * `roles: []` silencioso foi justamente o defeito que morou aqui — e ele é
 * invisível na tela, já que tudo funciona, só que nada de admin aparece.
 */
async function rolesDoLogin(accessToken: string): Promise<string[]> {
  try {
    return rolesFromClaims(await claimsDoAccessToken(accessToken), readConfig().clientId);
  } catch (cause) {
    console.warn(
      "[entrar] não deu para ler as roles do access token; a sessão entra sem nenhuma:",
      cause instanceof Error ? cause.message : cause
    );
    return [];
  }
}

function safeReturnPath(raw: string | null): string {
  if (!raw) return DEFAULT_RETURN_PATH;
  if (CONTROL_CHARACTERS.test(raw)) return DEFAULT_RETURN_PATH;
  if (!raw.startsWith("/")) return DEFAULT_RETURN_PATH;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN_PATH;
  return raw;
}

/**
 * Apaga os quatro cookies do fluxo. Eles são de uso único: passado o retorno,
 * um nd_pkce esquecido no navegador só serve para tentativa de replay.
 */
function clearTemporaryCookies(res: NextResponse): void {
  for (const name of TEMPORARY_COOKIES) {
    res.cookies.set(name, "", cookieOptions(0));
  }
}

/** Todo caminho de erro sai por aqui — e todo caminho de erro limpa os cookies. */
function failure(origin: string, reason: FailureReason): NextResponse {
  const url = new URL("/entrar/erro", origin);
  url.searchParams.set("motivo", reason);
  const res = NextResponse.redirect(url, 302);
  clearTemporaryCookies(res);
  return res;
}

/** Claims chegam como `unknown`. Nada de `any`: confere o tipo e segue. */
function claimText(claims: Record<string, unknown>, key: string): string {
  const value = claims[key];
  return typeof value === "string" ? value : "";
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = baseUrl(req);

  // O state vem antes de tudo, inclusive antes de olhar `?error=`. Ele é a
  // prova de que este retorno responde a um login que começou neste navegador;
  // sem ela, qualquer pessoa monta uma URL de /entrar/retorno e a dispara
  // contra quem estiver logado. O Keycloak devolve o state também nas respostas
  // de erro, então conferir primeiro não custa nenhum caso legítimo.
  const state = params.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!state || !expectedState || state !== expectedState) {
    return failure(origin, "pedido_invalido");
  }

  // A pessoa cancelou, ou o Keycloak recusou. O motivo cru não vai para a tela.
  const error = params.get("error");
  if (error) {
    return failure(
      origin,
      error === "access_denied" ? "acesso_negado" : "login_falhou",
    );
  }

  const code = params.get("code");
  const verifier = req.cookies.get(PKCE_COOKIE)?.value;
  const nonce = req.cookies.get(NONCE_COOKIE)?.value;
  if (!code || !verifier || !nonce) {
    return failure(origin, "pedido_invalido");
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      verifier,
      redirectUri: `${origin}/entrar/retorno`,
    });
    const claims = await verifyIdToken(tokens.id_token, nonce);

    const sub = claimText(claims, "sub");
    // Sem `sub` não existe pessoa: é token de outra coisa, não de login.
    if (!sub) return failure(origin, "token_invalido");

    const now = Math.floor(Date.now() / 1000);
    const maxAge = sessionMaxAge(tokens.refresh_expires_in);

    const session: Session = {
      sub,
      name: claimText(claims, "name") || claimText(claims, "preferred_username"),
      email: claimText(claims, "email"),
      roles: await rolesDoLogin(tokens.access_token),
      expiresAt: now + maxAge,
    };

    const target = safeReturnPath(req.cookies.get(RETURN_COOKIE)?.value ?? null);
    const res = NextResponse.redirect(new URL(target, origin), 302);

    // Os três cookies vencem juntos, no mesmo instante: a sessão não pode
    // sobreviver ao refresh token que a sustenta, e o id_token do logout não
    // serve a uma sessão que já acabou.
    const options = cookieOptions(maxAge);
    res.cookies.set(SESSION_COOKIE, await encryptSession(session), options);
    // O id_token cru volta no logout como `id_token_hint`, para o Keycloak
    // aceitar o redirect de volta. Fica httpOnly, como o resto.
    res.cookies.set(ID_TOKEN_COOKIE, tokens.id_token, options);

    if (tokens.refresh_token) {
      // O cookie separado dos tokens — é ele que a chamada à API vai usar, e é
      // o refresh token dentro dele que o proxy vai gastar para renovar. O
      // vencimento do access token é gravado como INSTANTE, calculado do
      // `expires_in` agora: uma duração relativa não diz nada quando alguém for
      // lê-la de novo, três navegações depois.
      //
      // Vai fatiado: um access token com muitas roles dentro já passa sozinho
      // do teto de ~4 KB POR COOKIE do navegador, e cookie grande demais é
      // DESCARTADO em silêncio — a pessoa entraria e voltaria para o /entrar
      // sem uma linha de erro em lugar nenhum. `writeTokensCookies()` corta o
      // JWE em `nd_tok`, `nd_tok.1`… e apaga os nomes que sobraram.
      writeTokensCookies(
        res.cookies,
        await encryptTokens({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          accessExpiresAt: now + tokens.expires_in,
        }),
        maxAge,
      );
    } else {
      // Sem refresh token não há o que renovar, e guardar sozinho um access
      // token de cinco minutos seria gravar um cookie que já nasce quase
      // vencido. Melhor `getAccessToken()` devolver null desde o começo do que
      // um token velho ir para a API. Se cair aqui, olhe o client no Keycloak:
      // "OAuth 2.0 refresh token" desligado é a causa comum.
      // Todas as fatias, e não só `nd_tok`: um `nd_tok.1` de um login anterior
      // neste mesmo navegador é pedaço de refresh token vivo deixado para trás.
      clearTokensCookies(res.cookies);
      console.warn(
        "[entrar/retorno] o Keycloak não devolveu refresh token: esta sessão não vai poder ser renovada e a API vai recusar em poucos minutos.",
      );
    }

    clearTemporaryCookies(res);

    return res;
  } catch (cause) {
    // Só o nome da exceção vai para o log. A mensagem pode carregar o corpo da
    // resposta do Keycloak, e com ele o código de autorização — isso não entra
    // em log nenhum. O nome já diz se foi a troca do código ou a assinatura.
    console.error(
      "[entrar/retorno] login não concluído:",
      cause instanceof Error ? cause.name : "erro desconhecido",
    );
    return failure(origin, "token_invalido");
  }
}
