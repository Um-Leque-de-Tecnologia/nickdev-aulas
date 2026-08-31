/**
 * A sessão, inteira dentro de um cookie.
 *
 * Não existe KV nem D1 neste Worker, então não há onde guardar sessão do lado
 * do servidor. O cookie é um JWE (`dir` + `A256GCM`): cifrado, e não só
 * assinado — o conteúdo tem e-mail e roles, que não são da conta de quem
 * abrir o DevTools.
 *
 * São DOIS cookies cifrados, e não um: `nd_session` com quem a pessoa é, e
 * `nd_tok` com os tokens do Keycloak — este último ainda fatiado em
 * `nd_tok`, `nd_tok.1`… quando não cabe. O motivo dos dois cortes está escrito
 * na segunda metade do arquivo, junto de `TOKENS_COOKIE` — é decisão de
 * tamanho, e o teto de ~4 KB POR COOKIE do navegador não perdoa.
 */

import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt, type JWTPayload } from "jose";
import { isDevLoginEnabled } from "@/lib/auth/dev";

export type Session = {
  sub: string;
  name: string;
  email: string;
  roles: string[];
  /** Epoch em segundos. */
  expiresAt: number;
  /**
   * Marca da sessão de mentira do atalho de desenvolvimento (lib/auth/dev.ts).
   * A sessão que vem do Keycloak nunca grava esta claim, então quem a tiver
   * saiu do atalho. `readSession()` recusa a marca sempre que o atalho não
   * está ligado, e o layout da área logada repete a recusa por cima.
   */
  dev?: boolean;
};

export const SESSION_COOKIE = "nd_session";
export const ID_TOKEN_COOKIE = "nd_id";

/**
 * Valor fixo e público, e não tem problema: ele só entra com o atalho de
 * desenvolvimento ligado, e ali a única sessão que existe é a de mentira.
 */
const DEVELOPMENT_SESSION_SECRET = "nickdev-desenvolvimento-nao-use-em-producao";

/**
 * O segredo do cookie, lido direto do ambiente.
 *
 * Não passa pelo `readConfig()` de propósito: ele exige as quatro variáveis de
 * uma vez, inclusive as do Keycloak, e o atalho de login de desenvolvimento
 * existe exatamente quando nenhuma delas está definida. Amarrar a cifra do
 * cookie ao Keycloak faria o atalho depender da configuração que ele veio
 * dispensar.
 *
 * A queda para a constante está amarrada ao MESMO `isDevLoginEnabled()` do
 * atalho, e não a um `NODE_ENV === "development"` solto. Assim a invariante
 * fica escrita em um lugar só: a constante pública só entra quando o atalho
 * está ligado, ou seja, exatamente quando a única sessão que existe é a de
 * mentira. Em `development` com o Keycloak já configurado — atalho desligado,
 * sessão de gente de verdade — a falta de `SESSION_SECRET` volta a ser erro,
 * em vez de cifrar login real com um segredo que está no Git.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (isDevLoginEnabled()) return DEVELOPMENT_SESSION_SECRET;

  throw new Error(
    'Variável de ambiente ausente: SESSION_SECRET. Defina em .dev.vars para rodar local, ou com "npx wrangler secret put SESSION_SECRET" em produção.'
  );
}

/**
 * `A256GCM` exige uma chave de exatamente 32 bytes, e `SESSION_SECRET` é texto
 * de tamanho livre. O SHA-256 faz a ponte. Derivar a cada chamada custa
 * microssegundos e evita deixar a chave viva em escopo de módulo.
 */
async function sessionKey(): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(sessionSecret())
  );
  return new Uint8Array(digest);
}

export async function encryptSession(s: Session): Promise<string> {
  const key = await sessionKey();

  const claims: JWTPayload = { name: s.name, email: s.email, roles: s.roles };
  // A claim só existe na sessão de mentira. Sessão de verdade sem `dev` no
  // payload é a diferença entre "não é de desenvolvimento" e "veio de uma
  // versão antiga do código".
  if (s.dev) claims["dev"] = true;

  return new EncryptJWT(claims)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(s.expiresAt)
    .encrypt(key);
}

/**
 * Lê a sessão do cookie. **Nunca lança**: qualquer falha vira `null`.
 *
 * Cookie corrompido, `SESSION_SECRET` trocado ou sessão vencida têm que
 * deslogar a pessoa, não derrubar a página com erro 500 — e sem cookie válido
 * não há como saber quem é, que é exatamente o que `null` diz.
 */
export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptSession(token);
}

/**
 * A mesma leitura, a partir da string crua do cookie.
 *
 * Existe porque o `proxy.ts` não tem `cookies()` de `next/headers` — em
 * middleware o cookie chega pela requisição. É o mesmo par que `decryptTokens`
 * faz com `readTokens`: a regra mora num lugar só, e quem não pode usar o
 * `next/headers` entra por aqui.
 */
export async function decryptSession(token: string): Promise<Session | null> {
  try {
    const key = await sessionKey();
    // `jwtDecrypt` já recusa o token vencido pelo `exp` — o mesmo número que
    // sai daqui como `expiresAt`.
    const { payload } = await jwtDecrypt(token, key);

    const { sub, exp, name, email, roles, dev } = payload;
    if (typeof sub !== "string" || typeof exp !== "number") return null;

    const session: Session = {
      sub,
      name: typeof name === "string" ? name : "",
      email: typeof email === "string" ? email : "",
      roles: Array.isArray(roles)
        ? roles.filter((role): role is string => typeof role === "string")
        : [],
      expiresAt: exp,
    };
    if (dev === true) {
      // A marca `dev` só vale enquanto o atalho que a emite está ligado. Fora
      // disso a sessão não existe — e a recusa mora AQUI, e não só no layout
      // da área logada, porque `readSession()` é a única porta por onde a
      // sessão entra: /api/me, /painel, /perfil, /admin e qualquer rota nova
      // passam por ela. Barrar no layout deixaria de fora todo mundo que lê a
      // sessão por conta própria.
      if (!isDevLoginEnabled()) return null;
      session.dev = true;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * O cookie dos tokens — SEPARADO do cookie de sessão, e de propósito.
 *
 * O navegador tem teto de ~4 KB POR COOKIE. O access token do Keycloak é um
 * JWT com as roles dentro: numa conta com muitas roles ele já chega perto
 * desse teto sozinho, e somado ao refresh token, às claims e ao overhead do
 * JWE (cabeçalho, IV, tag, base64url) um cookie único estoura. E estoura em
 * silêncio: o navegador simplesmente descarta o cookie grande demais, sem erro
 * na tela nem no log. A pessoa é deslogada sem explicação — e só ela, porque o
 * cookie de todo mundo com menos roles coube.
 *
 * Separando, cada cookie paga o próprio tamanho. A sessão, que TODA página da
 * área logada lê e que viaja em toda requisição, fica pequena: sub, nome,
 * e-mail e roles. Os tokens só são lidos por quem vai chamar a API, e só eles
 * carregam o peso do JWT do Keycloak.
 */
export const TOKENS_COOKIE = "nd_tok";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  /** Epoch em segundos: quando o ACCESS TOKEN vence, não o cookie. */
  accessExpiresAt: number;
};

/**
 * E um cookie de tokens ainda não basta — por isso ele é FATIADO.
 *
 * Separar sessão de tokens resolveu metade do problema. A outra metade é que o
 * teto de ~4 KB é POR COOKIE, e o cookie de tokens sozinho já o estoura no caso
 * que este projeto tem que aguentar. A conta, medida com o mesmo `jose` que
 * cifra aqui: access token de 3 KB mais refresh token de 1 KB dão ~4,1 KB de
 * JSON, que o base64url do JWE compacto multiplica por 4/3 — ~5,6 KB de
 * `Set-Cookie`. O navegador descarta calado, e a pessoa cai da sessão sem uma
 * linha de erro em lugar nenhum. O limite real de UM cookie só é um access
 * token de ~2 KB; acima disso ele some.
 *
 * Então o JWE é cortado em pedaços de tamanho seguro e cada pedaço vai num
 * cookie: `nd_tok`, `nd_tok.1`, `nd_tok.2`, `nd_tok.3`. Quem lê concatena na
 * ordem e decifra o resultado. O primeiro pedaço mantém o nome antigo de
 * propósito: sessão aberta antes desta mudança continua abrindo.
 *
 * Quatro fatias dão ~14 KB de JWE, ou seja, uns 10 KB de token — folga de
 * sobra para qualquer conta com roles demais.
 */
const TOKENS_COOKIE_CHUNK_BYTES = 3500;

export const TOKENS_COOKIE_NAMES: readonly string[] = [
  TOKENS_COOKIE,
  `${TOKENS_COOKIE}.1`,
  `${TOKENS_COOKIE}.2`,
  `${TOKENS_COOKIE}.3`,
];

/** O JWE em pedaços que cabem num cookie. JWE compacto é ASCII: byte = caractere. */
export function splitTokensCookie(value: string): string[] {
  const parts: string[] = [];
  for (let at = 0; at < value.length; at += TOKENS_COOKIE_CHUNK_BYTES) {
    parts.push(value.slice(at, at + TOKENS_COOKIE_CHUNK_BYTES));
  }
  return parts;
}

/**
 * Remonta o JWE a partir dos cookies. **Nunca lança**: sem pedaço nenhum,
 * `null`.
 *
 * Recebe a função de leitura em vez da jarra porque as duas pontas leem de
 * lugares diferentes: o Server Component pela `cookies()` do `next/headers`, o
 * proxy pelo próprio request. O primeiro buraco encerra a leitura — pedaço que
 * falta significa cookie truncado, e emendar o que sobrou só produziria um JWE
 * inválido mais adiante.
 */
export function joinTokensCookie(
  read: (name: string) => string | undefined
): string | null {
  let joined = "";
  for (const name of TOKENS_COOKIE_NAMES) {
    const part = read(name);
    if (part === undefined || part === "") break;
    joined += part;
  }
  return joined === "" ? null : joined;
}

/**
 * Onde os cookies são escritos. Tipado pela forma, e não por `NextResponse`,
 * porque este módulo é lido também por Server Component — e `res.cookies` do
 * Route Handler e do proxy têm exatamente esta cara.
 */
type CookieWriter = {
  set(
    name: string,
    value: string,
    options: ReturnType<typeof cookieOptions>
  ): unknown;
};

/**
 * Grava o cookie de tokens fatiado — e APAGA as fatias que sobraram.
 *
 * Apagar o resto não é zelo: o JWE novo pode precisar de menos fatias que o
 * antigo, e um `nd_tok.2` esquecido do valor anterior seria concatenado ao
 * novo na próxima leitura, produzindo lixo que não decifra. Escrever todos os
 * nomes, sempre, é o que mantém a leitura previsível.
 */
export function writeTokensCookies(
  jar: CookieWriter,
  value: string,
  maxAgeSeconds: number
): void {
  const parts = splitTokensCookie(value);

  // Não cabe nem fatiado. Não dá para inventar cookie novo aqui — os nomes
  // precisam ser conhecidos por quem lê e por quem apaga —, então o que resta
  // é dizer alto. O aviso conta fatias e bytes, e NÃO imprime o conteúdo.
  if (parts.length > TOKENS_COOKIE_NAMES.length) {
    console.warn(
      `[auth] o cookie de tokens precisaria de ${parts.length} fatias e só existem ${TOKENS_COOKIE_NAMES.length} (${value.length} bytes de JWE). A sessão não vai conseguir renovar. Causa provável: roles demais dentro do access token deste client.`
    );
  }

  const options = cookieOptions(maxAgeSeconds);
  const expired = cookieOptions(0);
  TOKENS_COOKIE_NAMES.forEach((name, index) => {
    const part = parts[index];
    if (part === undefined) jar.set(name, "", expired);
    else jar.set(name, part, options);
  });
}

/** Apaga todas as fatias. Sai em todo caminho de logout e de sessão morta. */
export function clearTokensCookies(jar: CookieWriter): void {
  const expired = cookieOptions(0);
  for (const name of TOKENS_COOKIE_NAMES) jar.set(name, "", expired);
}

/**
 * Mesma chave e mesmo esquema da sessão (`dir` + `A256GCM`): um segredo só
 * para manter em dia, e um lugar só para mexer se ele vazar.
 *
 * As claims têm nome curto (`at`, `rt`, `axp`) porque aqui cada byte disputa
 * espaço com o access token dentro do mesmo teto de 4 KB.
 *
 * E este JWE **não** leva `exp`, ao contrário do da sessão. O vencimento do
 * access token é DADO aqui dentro, não portão de entrada: quem renova precisa
 * conseguir abrir este cookie justamente DEPOIS de o access token ter vencido,
 * para alcançar o refresh token que está ao lado. Um `exp` igual a
 * `accessExpiresAt` trancaria o cofre com a chave dentro, e a renovação nunca
 * aconteceria. Quem limita a vida deste cookie é o `Max-Age` dele, amarrado ao
 * refresh token em app/entrar/retorno/route.ts.
 */
export async function encryptTokens(t: Tokens): Promise<string> {
  const key = await sessionKey();

  const jwe = await new EncryptJWT({
    at: t.accessToken,
    rt: t.refreshToken,
    axp: t.accessExpiresAt,
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(key);

  // Quem cifra não avisa mais sobre tamanho: passar de 3,8 KB deixou de ser
  // problema no dia em que o cookie passou a ser fatiado. O único tamanho que
  // ainda machuca é o que não cabe nem em todas as fatias, e quem sabe disso é
  // `writeTokensCookies()`, que é quem conta as fatias.
  return jwe;
}

/**
 * Abre o cookie de tokens a partir do VALOR cru. **Nunca lança**: qualquer
 * falha vira `null`.
 *
 * Existe separado de `readTokens()` por causa do proxy. Quem renova o token é
 * proxy.ts — Server Component não grava cookie —, e lá não existe `cookies()`:
 * o `next/headers` só funciona dentro de uma requisição de página ou de Route
 * Handler. O middleware lê do próprio request, e o que ele tem na mão é esta
 * string. Uma função para abrir, duas maneiras de chegar até ela.
 */
export async function decryptTokens(value: string): Promise<Tokens | null> {
  try {
    const key = await sessionKey();
    const { payload } = await jwtDecrypt(value, key);

    // Vindas do payload, as três chegam como `unknown`. Nada aqui confia no
    // formato antes de olhar.
    const { at, rt, axp } = payload;
    if (typeof at !== "string" || at === "") return null;
    if (typeof rt !== "string" || rt === "") return null;
    if (typeof axp !== "number") return null;

    return { accessToken: at, refreshToken: rt, accessExpiresAt: axp };
  } catch {
    return null;
  }
}

/**
 * Lê os tokens do cookie. **Nunca lança**: qualquer falha vira `null`.
 *
 * Mesmo contrato de `readSession()`, e pelo mesmo motivo — cookie corrompido,
 * truncado ou cifrado com outro segredo tem que virar "não tenho token", e não
 * erro 500 numa página que carregaria bem sem token nenhum.
 */
export async function readTokens(): Promise<Tokens | null> {
  const jar = await cookies();
  // As fatias voltam a ser um JWE só antes de qualquer tentativa de decifrar.
  const value = joinTokensCookie((name) => jar.get(name)?.value);
  if (value === null) return null;
  return decryptTokens(value);
}

export function cookieOptions(maxAgeSeconds: number): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    // Sem httpOnly, qualquer script na página lê a sessão.
    httpOnly: true,
    // Em `http://localhost` o navegador descarta cookie `secure`, e o login
    // local nunca fecharia o ciclo.
    secure: process.env.NODE_ENV !== "development",
    // `lax`, não `strict`: a volta do Keycloak é uma navegação vinda de outro
    // domínio, e com `strict` os cookies do login não viriam junto.
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
