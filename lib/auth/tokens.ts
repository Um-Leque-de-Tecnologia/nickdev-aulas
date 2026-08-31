/**
 * Quem LÊ o token, quem RENOVA o token, e por que não é o mesmo lugar.
 *
 * Esta é a parte que confunde, então está escrita antes do código:
 *
 * - **Server Component não pode gravar cookie.** É restrição do Next, não
 *   escolha nossa: quando a página renderiza, os cabeçalhos da resposta já
 *   foram. Só Route Handler, Server Action e o proxy escrevem cookie.
 * - Logo, um Server Component que descobrisse o access token vencido não teria
 *   o que fazer com um token novo — não teria onde guardá-lo. Renovar ali
 *   seria pedir um token ao Keycloak a cada render e jogá-lo fora em seguida,
 *   uma vez por componente que precisasse dele.
 * - Por isso a divisão: `getAccessToken()` só LÊ. Devolve o access token se
 *   ainda dá para usar, e `null` se não dá, sem nunca tentar consertar.
 * - Quem CONSERTA é o proxy (proxy.ts), que roda ANTES da página e escreve na
 *   resposta. Ele renova e regrava os cookies; quando a página finalmente
 *   renderiza, `getAccessToken()` encontra um token novo em folha. É por isso
 *   que o caso comum aqui é o token estar bom: o conserto já aconteceu.
 *
 * Na prática: se um Server Component recebeu `null`, o que era consertável já
 * não tinha conserto — não há refresh token, ou ele venceu, ou é a sessão de
 * mentira do desenvolvimento. O caminho é mandar a pessoa para /entrar ou
 * desenhar a tela sem os dados da API; nunca ficar tentando renovar daqui.
 *
 * E o token não sai deste módulo para Client Component nem para corpo de
 * resposta. Ele existe para virar um `Authorization: Bearer` numa chamada que
 * acontece no servidor, e só.
 */

import { readSession, readTokens, type Tokens } from "@/lib/auth/session";

/**
 * A folga padrão, em segundos.
 *
 * Ela existe por dois motivos que se somam. O relógio deste Worker e o do
 * Keycloak não são o mesmo relógio: alguns segundos de diferença entre eles já
 * bastam para o nosso "ainda tenho três segundos" ser "venceu" do lado de lá.
 * E, depois de decidirmos que o token serve, a requisição ainda vai levar
 * tempo até a API. Um token que vence "daqui a pouco" é um token que vence no
 * meio do caminho, e o 401 chega depois de a página já ter começado.
 *
 * Um minuto cobre os dois com sobra e custa uma renovação um pouco mais cedo,
 * que é o lado barato de errar.
 */
const DEFAULT_SKEW_SECONDS = 60;

/** `true` quando falta MENOS que a folga para o access token vencer. */
export function isExpiring(
  tokens: Tokens,
  skewSeconds: number = DEFAULT_SKEW_SECONDS
): boolean {
  const now = Math.floor(Date.now() / 1000);
  return tokens.accessExpiresAt - now < skewSeconds;
}

/**
 * O access token para um Server Component usar, ou `null`.
 *
 * `null` não é erro: é "não tenho token bom para te dar". Quem chamou decide o
 * que fazer com isso — redirecionar, esconder o bloco que vem da API, mostrar
 * um aviso. Aqui não se decide nada disso.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await readSession();
  if (session === null) return null;

  // A sessão do atalho de desenvolvimento nunca passou pelo Keycloak: não
  // existe access token de verdade para ela, e inventar um só empurraria o
  // erro para a API. A checagem é explícita, e não confia no "o atalho não
  // grava nd_tok": um nd_tok de um login real anterior pode ter sobrado no
  // mesmo navegador, e ele não pertence a esta sessão.
  if (session.dev) return null;

  const tokens = await readTokens();
  if (tokens === null) return null;

  // Vencido, ou perto disso. O proxy é quem renova; se ele não renovou é
  // porque não deu, e um token vencido na mão não vira chamada boa — vira 401
  // com uma volta de rede desperdiçada no meio.
  if (isExpiring(tokens)) return null;

  return tokens.accessToken;
}
