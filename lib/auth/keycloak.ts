/**
 * O cliente OIDC do Keycloak, escrito à mão com `jose`.
 *
 * Tudo aqui usa Web Crypto (`crypto.getRandomValues`, `crypto.subtle`) porque o
 * site roda em Cloudflare Workers: o módulo `crypto` do Node não existe lá.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import { readConfig } from "@/lib/auth/config";

export type Endpoints = {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint: string;
  userinfo_endpoint: string;
};

/**
 * O que o token endpoint devolve, nos dois grants que usamos.
 *
 * `id_token` é opcional AQUI porque a renovação por refresh token nem sempre o
 * traz — e não precisa: quem já entrou já tem identidade, o que falta é um
 * access token novo. `refresh_expires_in` diz quanto tempo ainda dá para
 * renovar, e é ele que passa a mandar na validade da sessão.
 */
export type TokenSet = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  id_token?: string;
};

/**
 * A resposta do `authorization_code`, onde o `id_token` é obrigatório: sem ele
 * não há `sub`, nome nem e-mail, ou seja, não há quem logar. O tipo mais
 * estreito poupa a quem faz login um teste que nunca falharia.
 */
export type LoginTokenSet = TokenSet & { id_token: string };

/*
  Descoberta e JWKS ficam em escopo de módulo porque o isolate do Worker
  sobrevive a várias requisições: pagar o `.well-known` uma vez por isolate é a
  diferença entre um round-trip a mais em todo login e nenhum. A chave dos dois
  mapas é o endereço, e não uma variável solta, para o cache não sobreviver a
  uma troca de realm entre ambientes.
*/
const discoveryByIssuer = new Map<string, Promise<Endpoints>>();
const jwksByUri = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(
  source: Record<string, unknown>,
  key: string,
  origin: string
): string {
  const value = source[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`A resposta de ${origin} não trouxe "${key}".`);
  }
  return value;
}

function optionalText(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(
  source: Record<string, unknown>,
  key: string
): number | undefined {
  const value = source[key];
  return typeof value === "number" ? value : undefined;
}

/** O corpo do token endpoint, conferido antes de qualquer campo ser lido. */
function parseTokenResponse(text: string): Record<string, unknown> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("O token endpoint respondeu algo que não é JSON.");
  }
  if (!isRecord(data)) {
    throw new Error("O token endpoint não devolveu um objeto JSON.");
  }
  return data;
}

/**
 * O campo `error` da resposta de erro do Keycloak, e NADA mais.
 *
 * Código OAuth é texto curto de `[a-z_]`: "invalid_grant", "invalid_client",
 * "unauthorized_client". O filtro não é paranoia gratuita — ele garante que
 * nada que o servidor resolva ecoar naquele campo atravesse para a mensagem da
 * exceção só por estar sob o nome "error". `error_description` fica de fora
 * inteiro: é lá que o Keycloak repete pedaços do pedido.
 */
function errorCode(text: string): string {
  try {
    const data: unknown = JSON.parse(text);
    if (isRecord(data)) {
      const error = data["error"];
      if (typeof error === "string" && /^[a-z_]{1,64}$/i.test(error)) {
        return error;
      }
    }
  } catch {
    // Corpo que não é JSON não vira mensagem: o corpo é justamente o que não
    // pode sair daqui.
  }
  return "erro_sem_codigo";
}

/** base64url sem padding — é o que o RFC 7636 pede no verifier e no challenge. */
function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function fetchEndpoints(issuer: string): Promise<Endpoints> {
  const url = `${issuer}/.well-known/openid-configuration`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(
      `Descoberta OIDC falhou em ${url} (HTTP ${response.status}). Confira KEYCLOAK_ISSUER.`
    );
  }

  const data: unknown = await response.json();
  if (!isRecord(data)) {
    throw new Error(`A descoberta OIDC de ${url} não devolveu um objeto JSON.`);
  }

  return {
    authorization_endpoint: requiredText(data, "authorization_endpoint", url),
    token_endpoint: requiredText(data, "token_endpoint", url),
    jwks_uri: requiredText(data, "jwks_uri", url),
    end_session_endpoint: requiredText(data, "end_session_endpoint", url),
    userinfo_endpoint: requiredText(data, "userinfo_endpoint", url),
  };
}

export async function discover(): Promise<Endpoints> {
  const { issuer } = readConfig();
  const cached = discoveryByIssuer.get(issuer);
  if (cached) return cached;

  // Guarda a promessa, e não o resultado, para dois logins ao mesmo tempo no
  // mesmo isolate não dispararem dois `.well-known`. Mas a falha sai do cache:
  // um Keycloak que estava reiniciando não pode condenar o isolate inteiro a
  // repetir o mesmo erro até morrer.
  const pending = fetchEndpoints(issuer).catch((error: unknown) => {
    discoveryByIssuer.delete(issuer);
    throw error;
  });
  discoveryByIssuer.set(issuer, pending);
  return pending;
}

function jwksFor(jwksUri: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = jwksByUri.get(jwksUri);
  if (cached) return cached;
  // O próprio `createRemoteJWKSet` guarda as chaves e vai buscá-las de novo
  // quando aparece um `kid` desconhecido. O que ele não pode é ser recriado a
  // cada verificação, senão o cache nasce vazio toda vez.
  const jwks = createRemoteJWKSet(new URL(jwksUri));
  jwksByUri.set(jwksUri, jwks);
  return jwks;
}

/** 48 bytes viram exatamente 64 caracteres em base64url, sem sobra de padding. */
export function generateVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(48)));
}

export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return base64url(new Uint8Array(digest));
}

/** Texto aleatório para `state` e `nonce`. */
export function randomText(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function loginUrl(p: {
  redirectUri: string;
  state: string;
  nonce: string;
  challenge: string;
}): Promise<string> {
  const { clientId } = readConfig();
  const { authorization_endpoint } = await discover();

  const url = new URL(authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", p.redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", p.state);
  url.searchParams.set("nonce", p.nonce);
  url.searchParams.set("code_challenge", p.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/**
 * O `client_secret` no corpo — quando existe.
 *
 * O realm `aulas` atende este app pelo `aulas-web`, que é client PÚBLICO
 * porque também serve um front via keycloak-js, e client confidencial não
 * funciona no navegador. Sem secret, mandar o campo vazio é pior que não
 * mandar: o Keycloak responde `invalid_client` em vez de tratar o pedido como
 * de um client público.
 *
 * O que se perde sem ele, dito sem eufemismo: o Keycloak deixa de autenticar o
 * APP na troca do código. Quem continua protegendo o fluxo é o PKCE — o
 * `code_challenge` sai daqui em toda ida ao Keycloak (S256, logo abaixo), e o
 * `code_verifier` correspondente nunca sai deste servidor. Um código
 * interceptado não vira token sem ele, e é por isso que este fluxo segue de pé
 * num client público.
 *
 * O que isto NÃO cobre, e por isso está no pedido de configuração do realm: se
 * o client aceitar troca de código SEM `code_challenge`, um atacante que
 * intercepte o código pula o PKCE inteiro simplesmente não mandando o campo.
 * Quem fecha essa porta é o realm — Advanced Settings → "Proof Key for Code
 * Exchange Code Challenge Method" = S256 —, não este arquivo. Enquanto isso
 * não estiver marcado no `aulas-web`, o login funciona e a proteção é parcial.
 */
function withClientAuth(
  body: URLSearchParams,
  clientSecret: string | undefined
): URLSearchParams {
  if (clientSecret) body.set("client_secret", clientSecret);
  return body;
}

export async function exchangeCodeForTokens(p: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<LoginTokenSet> {
  const { clientId, clientSecret } = readConfig();
  const { token_endpoint } = await discover();

  const body = withClientAuth(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: p.code,
      redirect_uri: p.redirectUri,
      code_verifier: p.verifier,
      client_id: clientId,
    }),
    clientSecret
  );

  const response = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    // O corpo do erro do Keycloak é a única pista útil aqui: "invalid_grant",
    // "Incorrect redirect_uri". Sem ele sobra uma tela de erro genérica e uma
    // tarde perdida. É o corpo do ERRO — o de sucesso, que tem token, nunca.
    throw new Error(
      `O Keycloak recusou a troca do código (HTTP ${response.status}): ${text}`
    );
  }

  const data = parseTokenResponse(text);
  return {
    id_token: requiredText(data, "id_token", "token endpoint"),
    access_token: requiredText(data, "access_token", "token endpoint"),
    refresh_token: optionalText(data, "refresh_token"),
    refresh_expires_in: optionalNumber(data, "refresh_expires_in"),
    expires_in: optionalNumber(data, "expires_in") ?? 0,
  };
}

/**
 * Troca o refresh token por um access token novo.
 *
 * Quem chama isto é o proxy, e é decisão de arquitetura, não acaso: Server
 * Component não grava cookie no Next, então quem renova tem que ser quem
 * escreve a resposta. Ver o cabeçalho de lib/auth/tokens.ts.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenSet> {
  const { clientId, clientSecret } = readConfig();
  const { token_endpoint } = await discover();

  const body = withClientAuth(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
    clientSecret
  );

  const response = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    // Aqui, ao contrário da troca do código logo acima, o corpo do erro NÃO
    // entra na exceção. O `error_description` do Keycloak repete pedaços do
    // pedido, e o pedido inteiro é um refresh token — que não pode acabar num
    // log só porque a renovação falhou. Além disso, uma renovação roda a cada
    // poucos minutos, em toda navegação: é o caminho mais fácil de o segredo
    // parar no log, e por isso o mais rígido. Só o código passa, e mesmo ele
    // filtrado. "invalid_grant" é o caso normal e esperado — refresh vencido,
    // sessão encerrada no Keycloak — e é ele que manda deslogar em vez de
    // tentar de novo.
    throw new Error(
      `O Keycloak recusou a renovação do token (HTTP ${response.status}): ${errorCode(text)}`
    );
  }

  const data = parseTokenResponse(text);
  return {
    access_token: requiredText(data, "access_token", "renovação do token"),
    expires_in: optionalNumber(data, "expires_in") ?? 0,
    // O Keycloak devolve um refresh token NOVO a cada renovação quando a
    // rotação está ligada. Quem grava tem que gravar este, e não repetir o
    // antigo: com rotação, o antigo já foi invalidado no ato.
    refresh_token: optionalText(data, "refresh_token"),
    refresh_expires_in: optionalNumber(data, "refresh_expires_in"),
    id_token: optionalText(data, "id_token"),
  };
}

/**
 * Os claims do ACCESS token — que é onde as roles moram.
 *
 * O id_token não as carrega. O Keycloak põe `realm_access` e `resource_access`
 * no access token; o id_token leva identidade (`sub`, `name`, `email`, `nonce`)
 * e mais nada. Ler as roles de lá fazia `session.roles` sair vazio para todo
 * mundo, sempre — e com isso `isAdmin()` era falso para qualquer pessoa e
 * qualquer regra baseada em role recusava todo mundo, em silêncio.
 *
 * Assinatura e emissor são conferidos. A audiência NÃO, e é de propósito: este
 * token é destinado à API (`aud: leque-aulas-api`), não a este app. Passar
 * `audience: clientId` aqui faria a verificação falhar sempre — que é
 * exatamente o oposto do que se quer checar.
 *
 * Vale para o token do login. Depois de uma renovação as roles do access token
 * são as atuais, mas a sessão continua com as do login: quem ganha uma role
 * nova precisa sair e entrar, e o painel já diz isso na tela.
 */
export async function claimsDoAccessToken(
  accessToken: string
): Promise<Record<string, unknown>> {
  const { issuer } = readConfig();
  const { jwks_uri } = await discover();
  const { payload } = await jwtVerify(accessToken, jwksFor(jwks_uri), { issuer });
  return payload;
}

export async function verifyIdToken(
  idToken: string,
  nonce: string
): Promise<Record<string, unknown>> {
  const { issuer, clientId } = readConfig();
  const { jwks_uri } = await discover();

  const { payload } = await jwtVerify(idToken, jwksFor(jwks_uri), {
    issuer,
    audience: clientId,
  });

  // `jwtVerify` confere assinatura, issuer, audience e validade — não confere o
  // nonce. É esta comparação que amarra o token a ESTE login: sem ela, um
  // id_token legítimo obtido em outro lugar passaria por aqui.
  if (typeof payload.nonce !== "string" || payload.nonce !== nonce) {
    throw new Error("O nonce do id_token não confere com o desta sessão de login.");
  }

  return payload;
}

export async function logoutUrl(p: {
  idToken?: string;
  returnTo: string;
}): Promise<string> {
  const { clientId } = readConfig();
  const { end_session_endpoint } = await discover();

  const url = new URL(end_session_endpoint);
  url.searchParams.set("post_logout_redirect_uri", p.returnTo);
  // O Keycloak só valida o redirect de volta se souber de qual client ele é.
  // Com o id_token na mão, ele é a prova mais forte; sem ele, o client_id.
  if (p.idToken) url.searchParams.set("id_token_hint", p.idToken);
  else url.searchParams.set("client_id", clientId);
  return url.toString();
}
