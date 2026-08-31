/**
 * As variáveis de ambiente do login, lidas num lugar só.
 *
 * Nada é lido em escopo de módulo de propósito: no Worker o `env` chega por
 * requisição, e o adaptador do OpenNext só popula `process.env` quando a
 * requisição já está rodando. Ler cedo demais devolveria `undefined` no
 * primeiro acesso de cada isolate.
 */

export type AuthConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  appUrl?: string;
};

/**
 * Falhar calado em autenticação é pior do que não subir — por isso o erro traz
 * o nome da variável e onde defini-la.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Defina em .dev.vars para rodar local, ou com "npx wrangler secret put ${name}" em produção.`
    );
  }
  return value;
}

/** O issuer do Keycloak não tem barra no fim; a do .env, se vier, atrapalha a comparação. */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function readConfig(): AuthConfig {
  const appUrl = process.env.APP_URL;
  return {
    issuer: trimTrailingSlash(required("KEYCLOAK_ISSUER")),
    clientId: required("KEYCLOAK_CLIENT_ID"),
    clientSecret: required("KEYCLOAK_CLIENT_SECRET"),
    sessionSecret: required("SESSION_SECRET"),
    appUrl: appUrl ? trimTrailingSlash(appUrl) : undefined,
  };
}

/**
 * A origem que o Keycloak vai ver no `redirect_uri`.
 *
 * `APP_URL` manda quando existe: o redirect precisa bater caractere a caractere
 * com o cadastrado no client, e a origem do request pode chegar diferente do
 * domínio público dependendo de como o pedido entrou. Sem ela, a origem do
 * request serve — é o que faz `localhost:3000` funcionar sem configurar nada.
 */
export function baseUrl(req: Request): string {
  // Lê a variável direto, sem passar por readConfig(): esta função também roda
  // em caminho de erro, e não deveria explodir por causa de um segredo que
  // falta e que ela nem usa.
  const appUrl = process.env.APP_URL;
  if (appUrl) return trimTrailingSlash(appUrl);
  return new URL(req.url).origin;
}

/**
 * As variáveis que o login pelo Keycloak exige. `SESSION_SECRET` fica de fora
 * de propósito: ela cifra o cookie de sessão e faz sentido mesmo sem Keycloak
 * nenhum — lib/auth/session.ts trata dela por conta própria.
 */
const KEYCLOAK_VARIABLES = [
  "KEYCLOAK_ISSUER",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_CLIENT_SECRET",
] as const;

/**
 * Dá para falar com o Keycloak neste ambiente?
 *
 * Serve a quem tem um plano B honesto quando ele não está configurado: /perfil
 * esconde o link da conta, /sair apaga os cookies e volta para a home. Quem
 * PRECISA do Keycloak continua chamando `readConfig()` e quebrando alto — um
 * `try/catch` em volta dele engoliria erro de verdade (rede, realm derrubado)
 * junto com a falta de configuração, que é justamente o que não se quer.
 *
 * É o avesso de `isDevLoginEnabled()`: o atalho de desenvolvimento só liga com
 * `KEYCLOAK_ISSUER` vazia, que é a primeira variável desta lista. Atalho
 * ligado implica esta função em `false`, e as duas nunca dizem sim juntas.
 */
export function isKeycloakConfigured(): boolean {
  return KEYCLOAK_VARIABLES.every((name) => {
    const value = process.env[name];
    return value !== undefined && value.trim() !== "";
  });
}
