import { NextResponse, type NextRequest } from "next/server";
import { refreshAccessToken } from "@/lib/auth/keycloak";
import { isExpiring } from "@/lib/auth/tokens";
import {
  clearTokensCookies,
  cookieOptions,
  decryptSession,
  decryptTokens,
  encryptSession,
  encryptTokens,
  ID_TOKEN_COOKIE,
  joinTokensCookie,
  SESSION_COOKIE,
  splitTokensCookie,
  TOKENS_COOKIE_NAMES,
  writeTokensCookies,
  type Session,
  type Tokens,
} from "@/lib/auth/session";

/**
 * Atalho de navegação e renovação de token — isto NÃO é autorização.
 *
 * Duas coisas acontecem aqui, e nenhuma das duas decide quem você é:
 *
 * 1. sem cookie de sessão, a pessoa vai para o /entrar em vez de bater numa
 *    tela que não vai carregar;
 * 2. com o access token do Keycloak vencendo, ele é trocado por um novo e o
 *    cookie de tokens é regravado na resposta — porque Server Component não
 *    grava cookie no Next, e o proxy é o único lugar que roda ANTES da página e
 *    ainda escreve na resposta dela.
 *
 * O passo 2 deixou este arquivo esperto, e é exatamente aí que mora o risco de
 * alguém achar que ele virou o guardião da área logada. Não virou, e a
 * diferença é a coisa mais importante escrita aqui: renovar token é manter uma
 * credencial em dia; autorizar é decidir se a pessoa entra. O proxy continua
 * sem abrir o cookie de SESSÃO, sem conferir assinatura e sem saber quem você
 * é — um `nd_session` falsificado, com qualquer lixo dentro, passa por estas
 * linhas sem tropeçar. O que ele abre é o cookie de TOKENS, que não diz quem a
 * pessoa é nem o que ela pode ver: diz só quando a credencial vence e com o que
 * trocá-la.
 *
 * Quem autoriza de verdade segue sendo o Server Component, chamando
 * `readSession()`: é lá que a sessão é decifrada e validada, é lá que o lixo
 * vira `null` e volta para o /entrar, e é `lib/auth/roles.ts` que decide o
 * resto. Se um dia as duas barreiras discordarem, a que vale é a de lá. Nunca
 * ponha regra de permissão neste arquivo.
 */

/*
 * Importar de lib/auth/session.ts deixou de ser problema — e antes era.
 *
 * A versão anterior deste arquivo repetia `"nd_session"` à mão para não
 * arrastar `jose` para dentro de um middleware que roda em toda navegação. Não
 * há mais o que evitar: para abrir o cookie de tokens o proxy PRECISA da mesma
 * cifra da sessão, então o módulo entra no bundle de qualquer jeito, e manter
 * uma segunda cópia dos nomes só criaria a chance de eles divergirem.
 *
 * O que continua fora de alcance são as funções que leem a jarra de cookies:
 * `readSession()` e `readTokens()` chamam `cookies()`, do `next/headers`, que
 * só existe dentro de uma requisição de página ou de Route Handler. O proxy não
 * é nenhum dos dois — ele lê do próprio request. Por isso a leitura aqui é
 * `decryptTokens(valor)`, que faz o mesmo trabalho a partir da string crua.
 */

/**
 * O teto de vida do cookie quando o Keycloak não diz até quando dá para
 * renovar. É o mesmo número e o mesmo motivo de
 * SESSION_FALLBACK_MAX_AGE_SECONDS, em app/entrar/retorno/route.ts: um arquivo
 * `route.ts` só pode exportar verbos HTTP, então a constante não tem como ser
 * compartilhada. Mudou lá, muda aqui.
 */
const REFRESH_FALLBACK_MAX_AGE_SECONDS = 8 * 60 * 60;

function tokensMaxAge(refreshExpiresIn: number | undefined): number {
  if (refreshExpiresIn === undefined || refreshExpiresIn <= 0) {
    return REFRESH_FALLBACK_MAX_AGE_SECONDS;
  }
  return refreshExpiresIn;
}

/**
 * Quanto vale o access token quando a resposta vem sem `expires_in`.
 *
 * O Keycloak sempre manda esse campo, então isto é rede de segurança, não
 * caminho normal. Mas o valor precisa ser MAIOR que a folga de `isExpiring()`:
 * gravar um vencimento colado no agora faria a próxima requisição achar que o
 * token acabou de nascer vencido, e cada navegação viraria uma renovação. Cinco
 * minutos é o tempo padrão de access token de um realm novo.
 */
const FALLBACK_ACCESS_LIFETIME_SECONDS = 5 * 60;

/**
 * Só o motivo da falha vai para o log, nunca o token.
 *
 * `refreshAccessToken()` já derruba o corpo da resposta do Keycloak antes de
 * montar a exceção, e a mensagem termina no código do OAuth 2 —
 * `...(HTTP 400): invalid_grant`. Este é o segundo portão, e ele é cego ao que
 * veio antes: pega o trecho depois do último dois-pontos e só o deixa passar se
 * couber no formato de um código do OAuth, que é minúscula e sublinhado.
 * Nenhum token tem essa forma; eles são longos e têm ponto, hífen e maiúscula.
 */
const OAUTH_ERROR_CODE = /^[a-z_]{1,40}$/;

function failureReason(cause: unknown): string {
  if (!(cause instanceof Error)) return "erro_desconhecido";
  const tail = cause.message.slice(cause.message.lastIndexOf(":") + 1).trim();
  return OAUTH_ERROR_CODE.test(tail) ? tail : cause.name;
}

function redirectToLogin(request: NextRequest): NextResponse {
  // O caminho original vai no `de=` para a pessoa cair onde queria depois de
  // entrar. Quem valida esse valor é o /entrar — redirect aberto se resolve
  // na leitura, não na escrita.
  const url = new URL("/entrar", request.url);
  url.searchParams.set("de", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

/**
 * Refresh token morto significa sessão morta.
 *
 * Deixar a pessoa navegando com o `nd_session` de pé e sem token é o pior dos
 * mundos: a tela desenha, o menu funciona, e toda chamada à API responde 401
 * sem explicar nada. Apagar os três cookies e mandar para o /entrar transforma
 * um erro silencioso numa tela de login, que é o que a situação de fato é. Os
 * três juntos porque eles nascem juntos em app/entrar/retorno/route.ts, e um
 * `nd_id` sobrevivente só serviria de `id_token_hint` para uma sessão que o
 * Keycloak já não tem.
 */
function expireSession(request: NextRequest): NextResponse {
  const res = redirectToLogin(request);
  const expired = cookieOptions(0);
  for (const name of [SESSION_COOKIE, ID_TOKEN_COOKIE]) {
    res.cookies.set(name, "", expired);
  }
  // As fatias do cookie de tokens saem todas — deixar uma para trás é deixar
  // um refresh token vivo no navegador de quem acabou de ser deslogado.
  clearTokensCookies(res.cookies);
  return res;
}

/**
 * Reescreve o header `cookie` da REQUISIÇÃO — não o da resposta.
 *
 * `res.cookies.set()` manda o valor novo para o navegador, mas a página que vai
 * renderizar agora, nesta mesma volta, ainda leria o valor velho: o access
 * token vencido que acabamos de trocar. Sem isto, a navegação que DISPARA a
 * renovação é justamente a que chama a API com o token ruim — o bug que esta
 * mudança existe para consertar, uma vez a cada cinco minutos.
 * `NextResponse.next({ request: { headers } })` é o que faz o valor novo já
 * valer para esta requisição.
 *
 * Concatenar sem escapar nada é seguro aqui: o valor é um JWE compacto, feito
 * só de base64url e ponto, e nenhum desses caracteres precisa de codificação
 * dentro de um header `cookie`.
 */
function withTokensCookie(header: string, value: string): string {
  const others = header
    .split(";")
    .map((pair) => pair.trim())
    .filter(
      (pair) =>
        pair !== "" &&
        !TOKENS_COOKIE_NAMES.some((name) => pair.startsWith(`${name}=`)),
    );
  // Todas as fatias antigas saíram no filtro acima, e só as novas entram. Uma
  // fatia velha sobrevivente seria concatenada às novas na leitura desta mesma
  // requisição e produziria um JWE que não decifra.
  splitTokensCookie(value)
    .slice(0, TOKENS_COOKIE_NAMES.length)
    .forEach((part, index) => {
      others.push(`${TOKENS_COOKIE_NAMES[index]}=${part}`);
    });
  return others.join("; ");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!request.cookies.has(SESSION_COOKIE)) return redirectToLogin(request);

  // As fatias voltam a ser um JWE só antes de qualquer tentativa de decifrar.
  // Ler só `nd_tok` traria o primeiro pedaço de um JWE cortado em quatro, e
  // decifrar um pedaço falha exatamente como um cookie adulterado falharia —
  // deslogando, a cada navegação, quem tem access token grande demais.
  const value = joinTokensCookie((name) => request.cookies.get(name)?.value);

  // Sessão sem cookie de tokens é normal, e não é erro. É o caso da sessão de
  // mentira do atalho de desenvolvimento (lib/auth/dev.ts), que nunca falou com
  // o Keycloak e não tem token de verdade para renovar — e é também o de um
  // client sem refresh token, que app/entrar/retorno/route.ts já registrou no
  // log ao entrar. Nos dois a pessoa segue navegando, sem erro e sem redirect:
  // quebrar o atalho local seria regressão, e a área logada desenha bem sem
  // API. Quem for chamar a API recebe `null` de `getAccessToken()` e decide o
  // que fazer — a decisão é de lá, não daqui.
  if (!value) return NextResponse.next();

  const tokens = await decryptTokens(value);

  // Cookie presente e ilegível é outra história: SESSION_SECRET trocado, valor
  // adulterado, truncado pelo teto de 4 KB do navegador. Não dá para renovar
  // nem para chamar a API, e o `nd_session` do lado continua abrindo a tela: é
  // exatamente a sessão zumbi. Sessão zumbi sai.
  if (!tokens) return expireSession(request);

  // A folga mora dentro de `isExpiring()`, junto com o motivo dela, para o
  // proxy não ter um segundo número para manter em dia. O caso comum é este
  // `return`: o token ainda serve e a requisição segue sem falar com ninguém.
  if (!isExpiring(tokens)) return NextResponse.next();

  // Duas requisições da mesma pessoa podem chegar juntas — a navegação e um
  // `fetch` do cliente, por exemplo — e as duas vão tentar renovar. Não há lock
  // possível aqui: este Worker não tem KV nem Durable Object, e cada requisição
  // pode cair num isolate diferente. A corrida é TOLERADA porque o Keycloak vem
  // com "Revoke Refresh Token" DESLIGADO por padrão: o refresh token antigo
  // continua valendo, as duas renovações dão certo, e a última resposta a
  // chegar é a que fica no navegador — as outras só gastaram uma volta de rede.
  //
  // Se alguém ligar a rotação de refresh no realm, isto deixa de valer: a
  // primeira renovação invalida o refresh token no ato, a segunda recebe
  // `invalid_grant`, e este arquivo vai deslogar quem só estava navegando
  // rápido. Nesse dia é preciso serializar a renovação de verdade — um Durable
  // Object por `sub`, ou uma janela de poucos segundos em KV na qual a resposta
  // da primeira renovação é reaproveitada em vez de pedir outra.
  try {
    const fresh = await refreshAccessToken(tokens.refreshToken);

    const now = Math.floor(Date.now() / 1000);
    const renewed: Tokens = {
      accessToken: fresh.access_token,
      // Com a rotação ligada o Keycloak devolve um refresh token novo e mata o
      // antigo na hora; sem rotação ele não devolve nada e o antigo segue
      // valendo. Gravar o novo quando vier e repetir o antigo quando não vier
      // é o que acerta nos dois realms.
      refreshToken: fresh.refresh_token ?? tokens.refreshToken,
      accessExpiresAt:
        now +
        (fresh.expires_in > 0
          ? fresh.expires_in
          : FALLBACK_ACCESS_LIFETIME_SECONDS),
    };

    const encrypted = await encryptTokens(renewed);

    const headers = new Headers(request.headers);
    headers.set("cookie", withTokensCookie(headers.get("cookie") ?? "", encrypted));

    const res = NextResponse.next({ request: { headers } });

    // Fatiado, e não num cookie só: o JWE renovado carrega o access token novo
    // inteiro, e o teto de ~4 KB é POR COOKIE. Num cookie único o navegador
    // descartaria o `Set-Cookie` calado, a próxima requisição não acharia token
    // nenhum, e a renovação recomeçaria do zero em toda navegação até o refresh
    // token vencer. `writeTokensCookies()` ainda apaga as fatias que sobraram.
    const maxAge = tokensMaxAge(fresh.refresh_expires_in);
    writeTokensCookies(res.cookies, encrypted, maxAge);

    // A sessão anda junto com o refresh, e isso não é enfeite.
    //
    // O `nd_session` nasce no /entrar com o `Max-Age` do `refresh_expires_in`
    // daquele momento — que no Keycloak, com as configurações padrão, é o SSO
    // Session Idle: trinta minutos. Sem reemitir aqui, meia hora depois do
    // login o cookie some do navegador e a pessoa é mandada para o /entrar no
    // meio do uso, com o refresh funcionando perfeitamente ao lado. O bug não
    // aparece em teste rápido: só quem fica mais de trinta minutos na tela
    // tropeça nele.
    //
    // Reemitir aqui não é decidir de novo quem a pessoa é. As claims são as
    // mesmas, vindas do cookie que já estava lá; o que muda é só o prazo, e o
    // prazo novo é o que o próprio Keycloak acabou de conceder ao renovar. Cada
    // renovação reinicia o relógio de ocioso dele — a sessão do site espelha
    // isso, em vez de contradizer.
    //
    // Se a sessão não abrir (chave trocada, cookie adulterado), não reemite: o
    // caminho de baixo já derruba tudo na próxima requisição.
    const current = await decryptSession(
      request.cookies.get(SESSION_COOKIE)?.value ?? "",
    );
    if (current) {
      const renewedSession: Session = {
        ...current,
        expiresAt: now + maxAge,
      };
      res.cookies.set(
        SESSION_COOKIE,
        await encryptSession(renewedSession),
        cookieOptions(maxAge),
      );
    }

    return res;
  } catch (cause) {
    console.warn("[proxy] renovação recusada:", failureReason(cause));
    return expireSession(request);
  }
}

export const config = {
  matcher: ["/painel/:path*", "/perfil/:path*", "/admin/:path*"],
};
