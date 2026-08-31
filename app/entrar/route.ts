import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, isKeycloakConfigured } from "@/lib/auth/config";
import {
  challengeFor,
  generateVerifier,
  loginUrl,
  randomText,
} from "@/lib/auth/keycloak";
import { devSession, isDevLoginEnabled } from "@/lib/auth/dev";
import {
  clearTokensCookies,
  cookieOptions,
  encryptSession,
  readSession,
  SESSION_COOKIE,
} from "@/lib/auth/session";

/**
 * Os quatro cookies temporários do fluxo de login. Os mesmos nomes aparecem em
 * app/entrar/retorno/route.ts, que é quem os lê e os apaga.
 *
 * A repetição é proposital: um arquivo `route.ts` do Next só pode exportar os
 * verbos HTTP e as opções de rota — qualquer outro `export` quebra a checagem
 * de tipos da rota. Mexeu num nome aqui, mexa no retorno também.
 */
const PKCE_COOKIE = "nd_pkce";
const STATE_COOKIE = "nd_state";
const NONCE_COOKIE = "nd_nonce";
const RETURN_COOKIE = "nd_return";

/** Dez minutos: o tempo de ir ao Keycloak, digitar a senha e voltar. */
const TEMPORARY_COOKIE_MAX_AGE_SECONDS = 10 * 60;

const DEFAULT_RETURN_PATH = "/painel";

/**
 * Para onde a pessoa volta depois do login, a partir de `?de=`.
 *
 * Só passa caminho que começa com uma barra e não com duas. Isto impede o
 * redirect aberto: `//site-falso.com` é URL relativa a protocolo, o navegador
 * lê como `https://site-falso.com`, e o nosso `Location:` levaria a pessoa
 * para fora do site logo depois de ela digitar a senha — é assim que se faz
 * phishing parecer legítimo, com um link que começa no domínio de verdade.
 * `/\site-falso.com` cai no mesmo buraco, porque o navegador troca a barra
 * invertida por barra antes de resolver a URL. Qualquer outra coisa vira
 * /painel: destino inválido não é motivo para recusar o login, é motivo para
 * ignorar o destino.
 *
 * E olhar só o começo do texto não basta. O parser de URL **apaga** tab, CR e
 * LF antes de resolver o endereço, então `/%09//site-falso.com` chega aqui
 * como "/", tab, "//..." — passa nos dois testes de prefixo acima e mesmo
 * assim vira `https://site-falso.com` no `Location:`. Por isso qualquer
 * caractere de controle reprova o caminho inteiro, antes de tudo.
 */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

function safeReturnPath(raw: string | null): string {
  if (!raw) return DEFAULT_RETURN_PATH;
  if (CONTROL_CHARACTERS.test(raw)) return DEFAULT_RETURN_PATH;
  if (!raw.startsWith("/")) return DEFAULT_RETURN_PATH;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN_PATH;
  return raw;
}

export async function GET(req: NextRequest) {
  const origin = baseUrl(req);

  // Sem Keycloak e sem o atalho de desenvolvimento não há login possível, e
  // `readConfig()` lá embaixo lançaria — devolvendo 500 para quem só clicou em
  // "Entrar". Enquanto o realm não estiver configurado em produção, o botão
  // existe no cabeçalho e precisa levar a uma tela que explica, não a um erro
  // de servidor. A checagem vem antes de tudo porque é a única que não depende
  // de nada estar configurado.
  if (!isDevLoginEnabled() && !isKeycloakConfigured()) {
    return NextResponse.redirect(new URL("/entrar/erro?motivo=login_falhou", origin));
  }

  // Quem já tem sessão não precisa dar a volta no Keycloak de novo. As duas
  // exceções são do atalho de desenvolvimento:
  //
  // - com o atalho ligado não há volta nenhuma para evitar, e reemitir o
  //   cookie é o que faz `?dev=aluno` trocar a sessão de admin já aberta pela
  //   de aluno sem ter que sair antes;
  // - com o atalho desligado, uma sessão marcada como `dev` não vale mais
  //   nada. O layout da área logada a recusa, e devolvê-la para o /painel aqui
  //   deixaria os dois se empurrando até o navegador desistir por redirects
  //   demais. Ignorá-la faz o login de verdade sobrescrever o cookie velho.
  const session = await readSession();
  if (session && !isDevLoginEnabled() && !session.dev) {
    return NextResponse.redirect(new URL(DEFAULT_RETURN_PATH, origin), 302);
  }

  // O atalho de desenvolvimento: sem Keycloak configurado não existe para onde
  // mandar a pessoa, então a sessão é montada aqui mesmo e o ciclo termina no
  // primeiro request. PKCE, `state` e `nonce` não entram neste caminho — eles
  // protegem a ida ao Keycloak, e aqui não há ida.
  if (isDevLoginEnabled()) {
    // Qualquer coisa diferente de `aluno` dá a sessão de admin, que é a que
    // mostra a área logada inteira; `?dev=aluno` mostra o que um aluno comum vê.
    const fake = devSession(
      req.nextUrl.searchParams.get("dev") === "aluno" ? "student" : "admin",
    );
    const target = safeReturnPath(req.nextUrl.searchParams.get("de"));
    const res = NextResponse.redirect(new URL(target, origin), 302);

    // O cookie vence junto com a sessão que ele carrega, sem um segundo número
    // para manter em dia.
    const maxAge = fake.expiresAt - Math.floor(Date.now() / 1000);
    res.cookies.set(SESSION_COOKIE, await encryptSession(fake), cookieOptions(maxAge));

    // A sessão de mentira não tem token do Keycloak, então o cookie de tokens
    // sai do navegador junto com ela. Sem esta linha, um `nd_tok` sobrando de
    // um login de verdade neste mesmo navegador — mesmo domínio, mesmo
    // SESSION_SECRET — continuaria decifrando, e a sessão de mentira herdaria
    // o access token de uma pessoa de verdade.
    // Todas as fatias: `nd_tok` sozinho apagado deixaria `nd_tok.1` e as
    // seguintes vivas no navegador, com o resto do JWE de um login de verdade.
    clearTokensCookies(res.cookies);

    return res;
  }

  const verifier = generateVerifier();
  const challenge = await challengeFor(verifier);
  const state = randomText();
  const nonce = randomText();
  const redirectUri = `${origin}/entrar/retorno`;

  const destination = await loginUrl({ redirectUri, state, nonce, challenge });
  const res = NextResponse.redirect(destination, 302);

  // O verifier, o state e o nonce ficam no navegador, não na memória do
  // Worker: cada requisição pode cair numa instância diferente, e não há KV
  // nem D1 aqui. Cookie httpOnly de vida curta é o estado que sobrevive.
  const options = cookieOptions(TEMPORARY_COOKIE_MAX_AGE_SECONDS);
  res.cookies.set(PKCE_COOKIE, verifier, options);
  res.cookies.set(STATE_COOKIE, state, options);
  res.cookies.set(NONCE_COOKIE, nonce, options);
  res.cookies.set(
    RETURN_COOKIE,
    safeReturnPath(req.nextUrl.searchParams.get("de")),
    options,
  );

  return res;
}
