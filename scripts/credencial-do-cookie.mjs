#!/usr/bin/env node
/**
 * Tira uma credencial de API do cookie de sessão do navegador.
 *
 * Por que isto existe: publicar material no CDN precisa de um token do
 * Keycloak, e conseguir um à mão dava errado toda vez — refresh token é preso
 * ao client que o emitiu, `leque-aulas-api` é confidencial e exige secret, e o
 * que costuma estar à mão para copiar é o cookie do app, que não é nem uma
 * coisa nem outra.
 *
 * O caminho curto estava na frente o tempo todo: quem já entrou no app tem, no
 * cookie `nd_tok`, o refresh token do client `aulas-web` — que é PÚBLICO
 * (Authorization Code + PKCE, sem secret em .dev.vars), e cujo token a API já
 * aceita, porque é com ele que a rota /material chama /v1/lessons.
 *
 * Uso:
 *
 *   1. entre no app, e no DevTools abra Application → Cookies
 *   2. copie o valor de `nd_tok` — e de `nd_tok.1`, `.2`, `.3` se existirem,
 *      NA ORDEM: o cookie é fatiado porque o teto do navegador é ~4 KB
 *   3. cole tudo num arquivo, uma fatia por linha:
 *
 *        node scripts/credencial-do-cookie.mjs cookie.txt ~/.aulas-refresh
 *
 * Ele escreve o refresh token rotacionado no segundo caminho, que é o que
 * `AULAS_REFRESH_FILE` do sincronizador lê:
 *
 *   AULAS_CLIENT_ID=aulas-web AULAS_REFRESH_FILE=~/.aulas-refresh \
 *     node scripts/sincroniza-cdn.mjs --executar
 *
 * Os dois arquivos guardam credencial viva. Deixe-os fora do repositório.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactDecrypt } from "jose";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [, , arqCookie, arqSaida] = process.argv;

if (!arqCookie || !arqSaida) {
  console.error("uso: node scripts/credencial-do-cookie.mjs <cookie.txt> <destino-do-refresh>");
  process.exit(2);
}

/** Lê uma chave do .dev.vars sem trazer o arquivo inteiro para a memória do log. */
function devVar(nome) {
  const arq = path.join(RAIZ, ".dev.vars");
  if (!fs.existsSync(arq)) throw new Error(".dev.vars não encontrado — rode a partir da raiz do projeto");
  const linha = fs.readFileSync(arq, "utf8").split("\n").find((l) => l.startsWith(`${nome}=`));
  if (!linha) throw new Error(`${nome} ausente no .dev.vars`);
  return linha.slice(nome.length + 1).trim().replace(/^["']|["']$/g, "");
}

/* A chave do A256GCM tem 32 bytes exatos e SESSION_SECRET é texto livre; o
 * SHA-256 faz a ponte. É a MESMA derivação de `sessionKey()` em
 * lib/auth/session.ts — mudou lá, muda aqui, senão o cookie para de abrir e o
 * erro não diz por quê. */
const chave = new Uint8Array(
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode(devVar("SESSION_SECRET"))),
);

/* Aceita as três formas que aparecem na prática, porque exigir uma só faria
 * a ferramenta falhar justamente em quem copiou do jeito mais natural:
 *
 *   · o cabeçalho Cookie inteiro, como o DevTools copia — vem com nd_session
 *     junto, e às vezes o primeiro valor sem o nome na frente;
 *   · pares `nd_tok=…; nd_tok.1=…`;
 *   · só os valores, um por linha.
 *
 * Em todos os casos o que interessa são as fatias do nd_tok, NA ORDEM: elas
 * voltam a ser um JWE só antes de qualquer tentativa de decifrar, porque
 * decifrar um pedaço falha exatamente como um cookie adulterado falharia. */
function fatiasDoTok(texto) {
  const bruto = texto.replace(/\s+/g, " ").trim();
  if (!bruto.includes(";") && !bruto.includes("=e")) {
    return bruto.split(" ").filter(Boolean);            // valores soltos
  }
  const nomeadas = new Map();
  const anonimas = [];
  for (const parte of bruto.split(";")) {
    const p = parte.trim();
    if (!p) continue;
    const i = p.indexOf("=");
    // Valor de JWE não tem "=" ; nome de cookie não tem "." seguido de base64.
    if (i > 0 && /^[\w.]+$/.test(p.slice(0, i))) nomeadas.set(p.slice(0, i), p.slice(i + 1));
    else anonimas.push(p);
  }
  const emOrdem = ["nd_tok", "nd_tok.1", "nd_tok.2", "nd_tok.3"]
    .map((n) => nomeadas.get(n)).filter(Boolean);
  return emOrdem.length ? emOrdem : anonimas;           // sem nome = era só o nd_tok
}

const fatias = fatiasDoTok(fs.readFileSync(arqCookie, "utf8"));
console.log(`  fatias de nd_tok encontradas: ${fatias.length}`);
const jwe = fatias.join("");
if (jwe.split(".").length !== 5) {
  console.error(`  o valor não parece um JWE (${jwe.split(".").length} partes, esperado 5).`);
  console.error("  confira se copiou o cookie inteiro, e se juntou as fatias na ordem.");
  process.exit(1);
}

let dados;
try {
  const { plaintext } = await compactDecrypt(jwe, chave);
  dados = JSON.parse(new TextDecoder().decode(plaintext));
} catch (e) {
  console.error(`  não abriu: ${e.message}`);
  console.error("  causas comuns: é o nd_session (que não tem token dentro), faltou uma fatia,");
  console.error("  ou o SESSION_SECRET do .dev.vars não é o que cifrou esse cookie.");
  process.exit(1);
}

if (!dados.rt) {
  console.error("  o cookie abriu, mas não tem refresh token dentro.");
  console.error(`  campos encontrados: ${Object.keys(dados).join(", ")}`);
  console.error("  isso é o nd_session. O que serve é o nd_tok (e suas fatias).");
  process.exit(1);
}

const issuer = devVar("KEYCLOAK_ISSUER");
const clientId = devVar("KEYCLOAK_CLIENT_ID");

const r = await fetch(`${issuer}/protocol/openid-connect/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, refresh_token: dados.rt }),
});
const j = await r.json();
if (!r.ok) {
  console.error(`  Keycloak ${r.status}: ${j.error} — ${j.error_description ?? ""}`);
  if (j.error === "invalid_grant") console.error("  o refresh já foi usado ou a sessão expirou: entre no app de novo e copie outra vez.");
  process.exit(1);
}

const claims = JSON.parse(Buffer.from(j.access_token.split(".")[1], "base64url"));
const papeis = claims.realm_access?.roles ?? [];
const admin = papeis.includes("aulas-admin");
const audiencia = [].concat(claims.aud ?? []);

fs.writeFileSync(arqSaida, j.refresh_token, { mode: 0o600 });

console.log(`\n  client     : ${clientId} (público — troca sem secret)`);
console.log(`  access     : vale ${j.expires_in}s`);
console.log(`  aud        : ${audiencia.length ? audiencia.join(", ") : "(vazio)"}`);
console.log(`  aulas-admin: ${admin ? "sim" : "não"}`);
console.log(`  refresh    : gravado em ${arqSaida}`);

/* A prova dos nove: a API aceita ESTE token?
 *
 * Ter as roles certas não basta. A API recusa token cuja audiência não a
 * inclui, e o sintoma é confuso porque as rotas de auth opcional (como o
 * detalhe do curso) IGNORAM o token inválido em silêncio e respondem 200 —
 * só as que exigem auth devolvem 401. Daí dar para ver a listagem do curso e
 * não o material dele.
 *
 * /v1/me exige auth e não depende de matrícula nem de papel: é o teste limpo. */
const API = process.env.AULAS_API ?? "https://api.umlequedetecnologia.com.br/aulas";
const me = await fetch(`${API}/v1/me`, { headers: { Authorization: `Bearer ${j.access_token}` } });
const aceita = me.ok;

console.log(`\n  a API aceita este token? ${aceita ? "SIM" : `NÃO — ${me.status}`}`);
if (!aceita) {
  console.log(`     ${(await me.text()).slice(0, 160)}`);
  console.log(`\n  Falta a audiência da API no token. No Keycloak:`);
  console.log(`     Clients → ${clientId} → Client scopes → ${clientId}-dedicated`);
  console.log(`       → Add mapper → By configuration → Audience`);
  console.log(`       Included Client Audience: leque-aulas-api`);
  console.log(`       Add to access token: ON`);
  console.log(`\n  Depois saia e entre de novo no app: o token é emitido no login.`);
  console.log(`  Se ainda assim der 401 com a audiência presente, o filtro é por`);
  console.log(`  client (azp) e o conserto é na API, não aqui.\n`);
  process.exit(1);
}

console.log(`\n  agora:  AULAS_CLIENT_ID=${clientId} AULAS_REFRESH_FILE=${arqSaida} \\`);
console.log(`            node scripts/sincroniza-cdn.mjs --materiais=<pasta> --executar\n`);
process.exit(admin ? 0 : 1);
