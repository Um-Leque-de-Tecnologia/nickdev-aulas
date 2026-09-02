#!/usr/bin/env node
/**
 * Sincroniza os materiais do disco com a Leque de Aulas API, que guarda o
 * conteúdo no MinIO e serve pelo CDN. Hoje eles moram em `materiais/`, e o
 * padrão daqui ainda é `public/` — daí o `--materiais=materiais` nos exemplos.
 *
 * Por padrão ele NÃO escreve nada: mostra o plano e para. Para valer:
 *
 *     AULAS_API_TOKEN="$(...)" node scripts/sincroniza-cdn.mjs --materiais=materiais --executar
 *
 * O que ele faz, nesta ordem:
 *   1. lê o estado do servidor pelas rotas públicas;
 *   2. compara com o disco por SHA-256 do conteúdo, não por tamanho —
 *      a troca de paleta mudou 55 arquivos sem mudar um byte de tamanho,
 *      e comparar tamanho teria dito que estava tudo em dia;
 *   3. cria as aulas que faltam;
 *   4. envia só o que difere;
 *   5. rebaixa o CDN e confere o hash do que subiu.
 *
 * Ele nunca apaga nada. Asset que existe no servidor e não existe mais no
 * disco é reportado, não removido — remover é decisão de quem lê o relatório.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = process.env.AULAS_API ?? "https://api.umlequedetecnologia.com.br/aulas";
const EXECUTAR = process.argv.includes("--executar");
const SO_CURSO = (process.argv.find((a) => a.startsWith("--curso=")) ?? "").split("=")[1];

/* Calcular o plano é lento — baixa cada asset do CDN para comparar hash — e
 * não precisa de token. Executar é rápido e precisa. Separar os dois deixa a
 * janela curta de um token colado render só upload:
 *
 *     node scripts/sincroniza-cdn.mjs --salvar-plano=plano.json     (sem token)
 *     AULAS_API_TOKEN=... node ... --plano=plano.json --executar    (com token)
 */
const SALVAR_PLANO = (process.argv.find((a) => a.startsWith("--salvar-plano=")) ?? "").split("=")[1];
const USAR_PLANO = (process.argv.find((a) => a.startsWith("--plano=")) ?? "").split("=")[1];

/* De onde ler os materiais. O padrão é `public/`, mas depois que os arquivos
 * saíram do repositório eles vivem no histórico do git e no CDN — e sem esta
 * opção a ferramenta não teria mais fonte para reenviar nada. Para corrigir
 * algo, extraia do histórico e aponte para lá:
 *
 *     mkdir -p /tmp/mat && git archive <commit> public | tar -x -C /tmp/mat
 *     node scripts/sincroniza-cdn.mjs --materiais=/tmp/mat/public --executar
 *
 * A pasta apontada precisa conter `cursos/` e/ou `guias/`. */
const MATERIAIS = (process.argv.find((a) => a.startsWith("--materiais=")) ?? "").split("=")[1]
  || path.join(RAIZ, "public");

/* --------------------------------------------------------------------------
 * Token.
 *
 * O access token do Keycloak vale 5 minutos. Isso não cobre 64 uploads com
 * verificação — a primeira tentativa morreu no meio, entre checar /v1/me e a
 * primeira escrita. Então a ferramenta cunha o próprio token e renova sozinha
 * quando faltar menos de um minuto.
 *
 * Em ordem de preferência:
 *   1. AULAS_CLIENT_ID + AULAS_CLIENT_SECRET  → client_credentials
 *   2. AULAS_CLIENT_ID + AULAS_REFRESH_TOKEN  → refresh_token
 *   3. AULAS_CLIENT_ID + AULAS_USER + AULAS_SENHA → password
 *   4. AULAS_API_TOKEN                        → colado à mão, sem renovação
 *
 * O que vale hoje para `leque-aulas-api`, apurado tentando:
 *   · client_credentials devolve 401 — o client não tem service account;
 *   · refresh_token + secret funciona e vem com a role `aulas-admin`;
 *   · refresh_token sozinho devolve `unauthorized_client`, porque o client é
 *     confidencial e o realm só aceita métodos que exigem credencial
 *     (client_secret_basic/post/jwt, private_key_jwt, tls_client_auth);
 *   · trocar o refresh por outro client dá `Token client and authorized client
 *     don't match` — ele é preso ao client que o emitiu.
 *
 * Ou seja, a combinação que roda é secret + refresh, e o refresh rotaciona a
 * cada uso: guarde-o com AULAS_REFRESH_FILE, senão a execução seguinte morre
 * com "Maximum allowed refresh token reuse exceeded".
 *
 *     AULAS_CLIENT_SECRET=... AULAS_REFRESH_FILE=~/.aulas-refresh \
 *       node scripts/sincroniza-cdn.mjs --materiais=materiais --executar
 * ------------------------------------------------------------------------ */

const ISSUER = process.env.AULAS_ISSUER ?? "https://auth.rodolfodebonis.com.br/realms/aulas";
const CLIENT_ID = process.env.AULAS_CLIENT_ID ?? "leque-aulas-api";
const env = (n) => process.env[n] ?? "";

let tokenAtual = env("AULAS_API_TOKEN");
let expiraEm = tokenAtual ? expiraDoJwt(tokenAtual) : 0;

function expiraDoJwt(jwt) {
  try { return JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString()).exp ?? 0; }
  catch { return 0; }
}

/* O Keycloak rotaciona o refresh: cada troca devolve um novo e invalida o
 * anterior. Guardar o mais recente em memória cobre uma execução longa; para
 * cobrir a PRÓXIMA execução é preciso gravar em algum lugar, senão o token do
 * ambiente já nasce queimado e a resposta é "Maximum allowed refresh token
 * reuse exceeded". Daí AULAS_REFRESH_FILE: lê de lá e escreve de volta.
 *
 * O arquivo guarda uma credencial viva — deixe-o fora do repositório. */
const ARQ_REFRESH = env("AULAS_REFRESH_FILE");
let refreshAtual = env("AULAS_REFRESH_TOKEN")
  || (ARQ_REFRESH && fs.existsSync(ARQ_REFRESH) ? fs.readFileSync(ARQ_REFRESH, "utf8").trim() : "");

function guardaRefresh(novo) {
  if (!novo) return;
  refreshAtual = novo;
  if (ARQ_REFRESH) fs.writeFileSync(ARQ_REFRESH, novo, { mode: 0o600 });
}

async function cunhar() {
  const corpo = new URLSearchParams({ client_id: CLIENT_ID });
  if (env("AULAS_CLIENT_SECRET") && !refreshAtual && !env("AULAS_USER")) {
    corpo.set("grant_type", "client_credentials");
    corpo.set("client_secret", env("AULAS_CLIENT_SECRET"));
  } else if (refreshAtual) {
    corpo.set("grant_type", "refresh_token");
    corpo.set("refresh_token", refreshAtual);
    if (env("AULAS_CLIENT_SECRET")) corpo.set("client_secret", env("AULAS_CLIENT_SECRET"));
  } else if (env("AULAS_USER")) {
    corpo.set("grant_type", "password");
    corpo.set("username", env("AULAS_USER"));
    corpo.set("password", env("AULAS_SENHA"));
    corpo.set("scope", "openid");
    if (env("AULAS_CLIENT_SECRET")) corpo.set("client_secret", env("AULAS_CLIENT_SECRET"));
  } else {
    return null;   // só há o token colado, que não dá para renovar
  }

  const r = await fetch(`${ISSUER}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Keycloak ${r.status}: ${t.slice(0, 200)}`);
  const j = JSON.parse(t);
  tokenAtual = j.access_token;
  expiraEm = expiraDoJwt(tokenAtual);
  guardaRefresh(j.refresh_token);
  return tokenAtual;
}

/** Devolve um token válido, renovando quando faltar menos de 60 segundos. */
// Uma renovação de cada vez: com upload em paralelo várias chamadas chegam
// aqui juntas, e como o refresh rotaciona duas trocas simultâneas invalidariam
// uma à outra. Quem chega durante a troca espera a mesma promessa.
let renovando = null;

async function token() {
  const agora = Math.floor(Date.now() / 1000);
  if (tokenAtual && expiraEm - agora > 60) return tokenAtual;
  if (!renovando) renovando = cunhar().finally(() => { renovando = null; });
  const novo = await renovando;
  if (novo) return novo;
  if (tokenAtual && expiraEm > agora) return tokenAtual;   // colado, ainda vivo
  throw new Error("sem token válido e sem credencial para renovar — veja o cabeçalho do arquivo");
}

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/** Desfaz a ofuscação de e-mail que o Cloudflare aplica na RESPOSTA.
 *
 *  O recurso "Email Address Obfuscation" reescreve todo e-mail do HTML em
 *  trânsito, trocando `ana@exemplo.com` por uma âncora `/cdn-cgi/l/...` e
 *  injetando um script para desembrulhá-la no navegador. O arquivo guardado no
 *  MinIO continua intacto — quem muda é o que sai pela borda.
 *
 *  Sem desfazer isso aqui, todo material com e-mail dentro (hoje 11 arquivos,
 *  20 trechos) diverge do disco para sempre, e a ferramenta o reenvia em toda
 *  execução sem nunca convergir.
 *
 *  A reversão é exata: `data-cfemail` é o e-mail em hex, com XOR do primeiro
 *  byte. Mas ela só limpa o DIFF — o conteúdo que o aluno lê continua alterado,
 *  e num exemplo de código isso é um defeito de verdade. O conserto é desligar
 *  Email Address Obfuscation para o host do CDN, no painel do Cloudflare. */
function semOfuscacaoDeEmail(buf) {
  const t = buf.toString("utf8");
  if (!t.includes("__cf_email__")) return buf;
  return Buffer.from(
    t.replace(/<a href="\/cdn-cgi\/l\/email-protection"[^>]*data-cfemail="([0-9a-f]+)"[^>]*>[\s\S]*?<\/a>/gi,
        (_, hex) => {
          const b = hex.match(/../g).map((h) => parseInt(h, 16));
          return b.slice(1).map((x) => String.fromCharCode(x ^ b[0])).join("");
        })
      .replace(/<script[^>]*\/cdn-cgi\/scripts\/[^"]*email-decode[^>]*><\/script>/gi, ""),
    "utf8",
  );
}
const kb = (n) => `${String(Math.round(n / 1024)).padStart(4)}KB`;

/** O enum de `kind` da API — slides, guia, desafio, codigos, modelo, roteiro,
 *  projeto, imagem, estilo, outro — deduzido do nome do arquivo. No curso dos
 *  guias o arquivo se chama pela tecnologia (css.html, java.html), então quem
 *  decide ali é o curso, não o prefixo do nome. */
function kindDe(rel, curso) {
  if (curso === CURSO_GUIAS.slug) return "guia";
  const nome = path.basename(rel).toLowerCase();
  if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(nome)) return "imagem";
  if (/\.css$/.test(nome)) return "estilo";
  if (nome === "brief.html") return "projeto";
  for (const [prefixo, kind] of [["slides", "slides"], ["guia", "guia"], ["desafio", "desafio"],
                                 ["codigos", "codigos"], ["modelo", "modelo"], ["roteiro", "roteiro"],
                                 // `manual.html` é guia de aula: passo a passo de consulta, não
                                 // roteiro de quem ensina. Sem esta linha ele entrava como "outro".
                                 ["manual", "guia"]]) {
    if (nome.startsWith(prefixo)) return kind;
  }
  return "outro";
}

/** O MIME que o CDN vai devolver.
 *
 *  A API grava o Content-Type que vem na parte do multipart. Mandar um Blob sem
 *  tipo faz o navegador receber `application/octet-stream` e BAIXAR o arquivo
 *  em vez de abrir — que foi o que aconteceu com os 67 primeiros envios. O
 *  `charset=utf-8` casa com o que os assets antigos já usam, para o tipo não
 *  virar sozinho um motivo de reenvio. */
function tipoDe(rel) {
  const ext = path.extname(rel).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
  }[ext] ?? "application/octet-stream";
}

function arquivosDe(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? arquivosDe(p, base)
      : [{ abs: p, rel: path.relative(base, p).split(path.sep).join("/") }];
  });
}

/** As rotas públicas não levam token; as de admin levam, e retentam uma vez
 *  se o token morreu entre a renovação e o envio. */
async function api(caminho, opcoes = {}, jaRetentou = false) {
  const precisaDeToken = opcoes.method || /^\/v1\/(admin|me|lessons)\b/.test(caminho);
  const cabecalhos = { Accept: "application/json", ...opcoes.headers };
  if (precisaDeToken) cabecalhos.Authorization = `Bearer ${await token()}`;

  const r = await fetch(API + caminho, { ...opcoes, headers: cabecalhos });
  const corpo = await r.text();

  if (r.status === 401 && precisaDeToken && !jaRetentou) {
    expiraEm = 0;                       // força cunhar de novo
    return api(caminho, opcoes, true);
  }
  if (!r.ok) {
    let detalhe = corpo.slice(0, 300);
    try { detalhe = JSON.stringify(JSON.parse(corpo).error ?? corpo); } catch { /* texto puro */ }
    throw new Error(`${r.status} ${opcoes.method ?? "GET"} ${caminho} — ${detalhe}`);
  }
  return corpo ? JSON.parse(corpo) : null;
}

/* ------------------------------------------------------------------ */

async function estadoDoServidor() {
  const { courses } = await api("/v1/courses");
  const cursos = new Map();
  for (const c of courses) {
    const det = await api(`/v1/courses/${c.slug}`);
    cursos.set(c.slug, {
      id: c.id,
      aulas: new Map((det.lessons ?? []).map((a) => [a.slug, a])),
    });
  }
  return cursos;
}

/**
 * Os guias não são de curso nenhum, mas o modelo da API é curso → aula →
 * asset. Eles entram como um curso próprio, uma aula por tecnologia:
 *
 *     public/guias/nextjs.html  →  curso "guias" / aula "nextjs" / nextjs.html
 */
const CURSO_GUIAS = {
  slug: "guias",
  title: "Guias de tecnologia",
  description: "Documentação de consulta por tecnologia, independente de curso.",
  level: "referência",
  status: "em_andamento",
  visibility: "public",
  position: 99,
};

function estadoDoDisco() {
  const base = path.join(MATERIAIS, "cursos");
  const cursos = new Map();
  for (const curso of fs.readdirSync(base)) {
    if (SO_CURSO && curso !== SO_CURSO) continue;
    const aulas = new Map();
    for (const pasta of fs.readdirSync(path.join(base, curso))) {
      const dirAula = path.join(base, curso, pasta);
      if (!fs.statSync(dirAula).isDirectory()) continue;
      aulas.set(pasta, arquivosDe(dirAula));
    }
    cursos.set(curso, aulas);
  }

  // Cada guia vira uma aula do curso "guias", com o slug da tecnologia.
  if (!SO_CURSO || SO_CURSO === CURSO_GUIAS.slug) {
    const guias = new Map();
    for (const g of arquivosDe(path.join(MATERIAIS, "guias"))) {
      if (g.rel.includes("/")) continue;                 // só o nível de cima
      guias.set(path.basename(g.rel, ".html"), [g]);
    }
    if (guias.size) cursos.set(CURSO_GUIAS.slug, guias);
  }

  return cursos;
}

/** Índice da aula pela pasta: `aula-03-...` → 3, `projeto` → 0. */
const idxDe = (slug) => Number((/^aula-(\d+)/.exec(slug) ?? [, 0])[1]);

const NOME_DO_GUIA = {
  html: "HTML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript",
  nextjs: "Next.js", java: "Java", "spring-boot": "Spring Boot",
  // A ordem deste objeto é a posição da aula dentro do curso "guias"
  // (`posicaoDe`), então guia novo entra no FIM — senão os sete já publicados
  // trocam de lugar na listagem sem ninguém ter pedido.
  github: "GitHub",
};

/** Título legível a partir do slug, para quando a aula precisar ser criada. */
/* Título de verdade das aulas, quando o slug não dá um bom nome sozinho.
 *
 * Derivar do slug produz coisas como "Beans E Injecao" — que foi o que as duas
 * primeiras aulas ganharam, e não há PATCH de aula na API para consertá-las.
 * Aula nova entra aqui ANTES de ser criada; depois não dá mais. */
const TITULO_DA_AULA = {
  "introducao-spring-boot/aula-03-api-rest": "API REST: recursos, verbos e status",

  // As doze de Introdução ao GitHub, cadastradas antes da primeira publicação.
  // Os títulos são os mesmos de `components/cursos/IntroducaoGithub.tsx`, para
  // a API e a landing não contarem histórias diferentes.
  "introducao-github/aula-01-controle-de-versao": "Controle de versão e o primeiro repositório",
  "introducao-github/aula-02-branches-e-merge": "Branches, merge e o conflito que todo mundo teme",
  "introducao-github/aula-03-repositorio-remoto": "O repositório remoto: clone, push, pull e fetch",
  "introducao-github/aula-04-anatomia-do-github": "Anatomia do GitHub: repositório, perfil e organização",
  "introducao-github/aula-05-issues-e-projects": "Issues, labels, milestones e Projects",
  "introducao-github/aula-06-pull-request-e-code-review": "Pull Request e code review",
  "introducao-github/aula-07-fluxos-e-branch-protection": "Fluxos de trabalho e proteção da branch principal",
  "introducao-github/aula-08-github-actions": "GitHub Actions: a primeira automação",
  "introducao-github/aula-09-qualidade-automatica": "Qualidade automática: testes, lint e segurança no PR",
  "introducao-github/aula-10-release-e-deploy": "Release, versionamento e deploy contínuo",
  "introducao-github/aula-11-desfazendo": "Desfazendo: reflog, revert, reset e amigos",
  "introducao-github/aula-12-open-source": "Open source, ecossistema e o que levar daqui",
};

function tituloDe(slug, curso) {
  const escrito = TITULO_DA_AULA[`${curso}/${slug}`];
  if (escrito) return escrito;
  if (curso === CURSO_GUIAS.slug) return `Guia de ${NOME_DO_GUIA[slug] ?? slug}`;
  if (slug === "projeto") return "Projeto do curso";
  const resto = slug.replace(/^aula-\d+-/, "").replace(/-/g, " ");
  return `Aula ${String(idxDe(slug)).padStart(2, "0")} — ${resto}`;
}

/** Ordem da aula: nos guias o slug não tem número, então vale a ordem do mapa. */
function posicaoDe(slug, curso) {
  if (curso !== CURSO_GUIAS.slug) return idxDe(slug);
  const ordem = Object.keys(NOME_DO_GUIA).indexOf(slug);
  return ordem < 0 ? 99 : ordem + 1;
}

async function enviar(aulaId, arquivo, nomeRemoto, curso) {
  const dados = new FormData();
  const buf = fs.readFileSync(arquivo);
  dados.append("file", new Blob([buf], { type: tipoDe(nomeRemoto) }), nomeRemoto);
  dados.append("kind", kindDe(nomeRemoto, curso));
  return api(`/v1/admin/lessons/${aulaId}/assets`, { method: "POST", body: dados });
}

/* ------------------------------------------------------------------ */

const plano = { criarCurso: [], criarAula: [], enviar: [], igual: [], soNoServidor: [] };

console.log(`\n  API   ${API}`);
console.log(`  modo  ${EXECUTAR ? "EXECUTAR — vai escrever" : "ensaio — não escreve nada"}`);
const comoAutentica = env("AULAS_CLIENT_SECRET") && !refreshAtual && !env("AULAS_USER") ? "client_credentials (renova sozinho)"
  : refreshAtual ? "refresh_token (renova sozinho)"
  : env("AULAS_USER") ? "password (renova sozinho)"
  : env("AULAS_API_TOKEN") ? "token colado (NÃO renova — para 20s antes de expirar)"
  : "nenhuma credencial";
console.log(`  auth  ${comoAutentica}${SO_CURSO ? `\n  curso ${SO_CURSO}` : ""}\n`);

if (USAR_PLANO) {
  const salvo = JSON.parse(fs.readFileSync(USAR_PLANO, "utf8"));
  Object.assign(plano, salvo);
  console.log(`  plano lido de ${USAR_PLANO} (calculado em ${salvo.calculadoEm})`);
  // O que já foi enviado em execuções anteriores sai da fila.
  const antes = plano.enviar.length;
  plano.enviar = plano.enviar.filter((e) => !e.enviado);
  if (antes !== plano.enviar.length) console.log(`  ${antes - plano.enviar.length} já enviado(s) numa rodada anterior`);
  console.log();
}

const servidor = USAR_PLANO ? new Map() : await estadoDoServidor();
const disco = USAR_PLANO ? new Map() : estadoDoDisco();

for (const [curso, aulas] of disco) {
  let remoto = servidor.get(curso);
  if (!remoto) {
    if (curso !== CURSO_GUIAS.slug) {
      console.log(`  ⚠ curso "${curso}" não existe na API — crie antes com POST /v1/admin/courses`);
      continue;
    }
    // O curso dos guias é o único que a ferramenta cria sozinha: ele não
    // existe na página do site, existe só para dar casa aos sete arquivos.
    plano.criarCurso.push(CURSO_GUIAS);
    remoto = { id: null, aulas: new Map() };
  }
  for (const [aulaSlug, arquivos] of aulas) {
    const aulaRemota = remoto.aulas.get(aulaSlug);
    if (!aulaRemota) plano.criarAula.push({ curso, cursoId: remoto.id, aulaSlug });

    for (const f of arquivos) {
      const chave = `${curso}/${aulaSlug}/${f.rel}`;
      const asset = aulaRemota?.assets?.find((a) => a.filename === f.rel);
      if (!asset) { plano.enviar.push({ chave, curso, aulaSlug, aulaId: aulaRemota?.id, ...f, motivo: "novo" }); continue; }

      const localBuf = fs.readFileSync(f.abs);
      let iguais = false;
      if (asset.locked || !asset.url) {
        /* Curso fechado por matrícula: o CDN não entrega o arquivo por URL
         * pública, então não há como comparar hash. Comparar tamanho é o mais
         * forte que sobra — e reenviar sempre, por não conseguir conferir,
         * seria pior. */
        iguais = asset.size_bytes === localBuf.length;
      } else {
        try {
          const remotoBuf = Buffer.from(await (await fetch(asset.url)).arrayBuffer());
          iguais = sha(localBuf) === sha(semOfuscacaoDeEmail(remotoBuf));
        } catch { /* sem rede para o CDN: trata como diferente e reenvia */ }
      }

      /* Conteúdo igual não basta. Servido com o tipo errado o navegador baixa
       * o arquivo em vez de abrir, então tipo divergente também manda reenviar
       * — senão o diff por hash diria "em dia" para sempre. */
      const tipoOk = asset.content_type === tipoDe(f.rel);

      if (iguais && tipoOk) plano.igual.push(chave);
      else plano.enviar.push({ chave, curso, aulaSlug, aulaId: aulaRemota.id, ...f,
                               motivo: !iguais ? "mudou" : "tipo" });
    }

    for (const a of aulaRemota?.assets ?? []) {
      if (!arquivos.some((f) => f.rel === a.filename)) plano.soNoServidor.push(`${curso}/${aulaSlug}/${a.filename}`);
    }
  }
}

/* ------------------------------ relatório ------------------------------ */

if (SALVAR_PLANO) {
  plano.calculadoEm = new Date().toISOString();
  fs.writeFileSync(SALVAR_PLANO, JSON.stringify(plano, null, 2));
  console.log(`  plano salvo em ${SALVAR_PLANO}\n`);
}

console.log(`  ✓ em dia          ${plano.igual.length}`);
console.log(`  ↑ a enviar        ${plano.enviar.length}`);
console.log(`  + cursos a criar  ${plano.criarCurso.length}`);
console.log(`  + aulas a criar   ${plano.criarAula.length}`);
console.log(`  − só no servidor  ${plano.soNoServidor.length}\n`);

if (plano.criarCurso.length) {
  console.log("  === cursos a criar ===");
  for (const c of plano.criarCurso) console.log(`    ${c.slug.padEnd(12)} "${c.title}"  ${c.visibility} · position ${c.position}`);
  console.log();
}
if (plano.criarAula.length) {
  console.log("  === aulas a criar ===");
  for (const a of plano.criarAula) {
    console.log(`    ${(a.curso + "/" + a.aulaSlug).padEnd(44)} idx ${posicaoDe(a.aulaSlug, a.curso)}  "${tituloDe(a.aulaSlug, a.curso)}"`);
  }
  console.log();
}
if (plano.enviar.length) {
  console.log("  === a enviar ===");
  for (const e of plano.enviar) console.log(`    ${e.motivo === "novo" ? "+" : "↑"} ${e.chave.padEnd(64)} ${kb(fs.statSync(e.abs).size)}  [${kindDe(e.rel, e.curso)}]`);
  console.log();
}
if (plano.soNoServidor.length) {
  console.log("  === no servidor e não no disco (nada é apagado; confira) ===");
  for (const s of plano.soNoServidor) console.log(`    ${s}`);
  console.log();
}
if (!EXECUTAR) {
  console.log("  ensaio. para valer, com credencial que renova:\n");
  console.log("    AULAS_CLIENT_ID=... AULAS_CLIENT_SECRET=... \\");
  console.log("      node scripts/sincroniza-cdn.mjs --materiais=materiais --executar\n");
  process.exit(0);
}
try {
  await token();
} catch (e) {
  console.error(`  ${e.message}\n`);
  process.exit(1);
}

/* ------------------------------ execução ------------------------------ */

let cursosCriados = 0, criadas = 0, enviados = 0, falhas = 0;
const json = (corpo) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });

for (const c of plano.criarCurso) {
  try {
    const novo = await api("/v1/admin/courses", json(c));
    console.log(`  + curso ${c.slug} → ${novo.id}`);
    // As aulas planejadas para ele ainda não têm cursoId: só existe agora.
    for (const a of plano.criarAula) if (a.curso === c.slug) a.cursoId = novo.id;
    cursosCriados++;
  } catch (err) { console.error(`  ✗ curso ${c.slug}: ${err.message}`); falhas++; }
}

for (const a of plano.criarAula) {
  if (!a.cursoId) { console.error(`  ✗ aula ${a.curso}/${a.aulaSlug}: curso não existe`); falhas++; continue; }
  try {
    const nova = await api(`/v1/admin/courses/${a.cursoId}/lessons`, json({
      slug: a.aulaSlug,
      title: tituloDe(a.aulaSlug, a.curso),
      idx: posicaoDe(a.aulaSlug, a.curso),
      position: posicaoDe(a.aulaSlug, a.curso),
      // O schema aceita qualquer string, mas as 15 aulas que já existem só usam
      // "em_andamento" e "em_breve". Inventar um terceiro valor aqui deixaria a
      // aula fora de qualquer filtro escrito contra esse vocabulário.
      status: "em_andamento",
      description: "",
    }));
    console.log(`  + aula ${a.curso}/${a.aulaSlug} → ${nova.id}`);
    for (const e of plano.enviar) if (e.curso === a.curso && e.aulaSlug === a.aulaSlug) e.aulaId = nova.id;
    criadas++;
  } catch (err) { console.error(`  ✗ aula ${a.curso}/${a.aulaSlug}: ${err.message}`); falhas++; }
}

/** Com token colado não há como renovar: para antes de ele morrer no meio de
 *  um upload, em vez de deixar metade do arquivo e um 401 sem explicação. */
const podeRenovar = !!(env("AULAS_CLIENT_SECRET") || env("AULAS_REFRESH_TOKEN") || env("AULAS_USER"));
const sobraFolga = () => podeRenovar || expiraEm - Math.floor(Date.now() / 1000) > 20;

let parouPorTempo = false;
let tokenMorreu = false;

/** Cada asset custa três idas ao servidor — POST, pedido da URL e download de
 *  conferência. Em série isso não cabe na vida de um token colado; em cinco
 *  frentes cabe com folga, sem sobrecarregar a API. */
async function subirTodos(fila, largura = 5) {
  let proximo = 0;
  const frente = async () => {
    while (proximo < fila.length) {
      if (tokenMorreu || !sobraFolga()) { parouPorTempo = true; return; }
      const e = fila[proximo++];
      if (!e.aulaId) { console.error(`  ✗ ${e.chave}: aula não existe e não pôde ser criada`); falhas++; continue; }
      try {
        const asset = await enviar(e.aulaId, e.abs, e.rel, e.curso);
        // Confere o que ficou no CDN em vez de confiar no 201. A URL já vem no
        // corpo do POST; a rota /url é reserva para asset travado. Nada de
        // engolir a exceção: verificação que falha calada vira relatório falso.
        const local = fs.readFileSync(e.abs);

        /* Curso fechado por matrícula: a rota que devolve a URL responde 403
         * mesmo para admin — a checagem é de matrícula, não de papel — então
         * hash é impossível e tamanho é o mais forte que sobra. Não é falha: é
         * o limite do que dá para conferir sem furar o controle de acesso. */
        const porTamanho = () => typeof asset.size_bytes !== "number"
          ? "NÃO VERIFICADO (travado e sem size_bytes na resposta)"
          : asset.size_bytes === local.length ? "tamanho confere (travado)" : "TAMANHO DIFERENTE";

        let ok;
        if (asset.locked) ok = porTamanho();
        else {
          try {
            const url = asset.url || (await api(`/v1/lessons/${e.aulaId}/assets/${asset.id}/url`)).url;
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) throw new Error(`CDN respondeu ${r.status}`);
            ok = sha(semOfuscacaoDeEmail(Buffer.from(await r.arrayBuffer()))) === sha(local) ? "hash confere" : "HASH DIFERENTE";
          } catch (err) {
            // A resposta do POST nem sempre traz `locked`; o 403 aqui é a
            // mesma informação chegando pelo outro caminho.
            ok = /\b403\b/.test(err.message) ? porTamanho() : `NÃO VERIFICADO (${err.message})`;
          }
        }

        const bom = ok === "hash confere" || ok === "tamanho confere (travado)";
        console.log(`  ${bom ? "↑" : "✗"} ${e.chave.padEnd(64)} ${ok}`);
        if (bom) { enviados++; e.enviado = true; }
        else falhas++;
      } catch (err) {
        // 401 aqui é token morto: parar vale mais que colecionar 60 falhas iguais.
        if (/\b401\b/.test(err.message)) { tokenMorreu = true; parouPorTempo = true; }
        console.error(`  ✗ ${e.chave}: ${err.message}`);
        falhas++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(largura, fila.length) }, frente));
}

/** A API só tem POST de asset — não há PUT nem DELETE. Se esse POST inserir uma
 *  linha nova em vez de substituir a de mesmo nome, as 55 atualizações viram 55
 *  duplicatas e não existe rota para limpar. Então sobe UM arquivo pequeno que
 *  já existe, confere a contagem, e só libera o resto se tiver substituído.
 *  O custo de descobrir errado é uma duplicata; o de não descobrir, 55. */
async function sondar(fila) {
  const candidatos = fila.filter((e) => e.motivo !== "novo" && e.aulaId);
  if (!candidatos.length) return true;                       // só arquivos novos: nada a sobrescrever
  const alvo = candidatos.reduce((a, b) =>
    (fs.statSync(a.abs).size <= fs.statSync(b.abs).size ? a : b));

  const conta = async () => {
    const d = await api(`/v1/courses/${alvo.curso}/lessons/${alvo.aulaSlug}`);
    const todos = d.assets ?? [];
    return { total: todos.length, homonimos: todos.filter((a) => a.filename === alvo.rel).length };
  };

  const antes = await conta();
  console.log(`\n  sonda  ${alvo.chave} (${kb(fs.statSync(alvo.abs).size)})`);
  console.log(`         antes: ${antes.total} asset(s) na aula, ${antes.homonimos} com esse nome`);
  await enviar(alvo.aulaId, alvo.abs, alvo.rel, alvo.curso);
  const depois = await conta();
  console.log(`         depois: ${depois.total} asset(s) na aula, ${depois.homonimos} com esse nome`);

  if (depois.homonimos > antes.homonimos) {
    console.error(`\n  ✗ o POST DUPLICOU em vez de substituir.`);
    console.error(`    Não há rota de DELETE de asset, então parei antes de repetir isso`);
    console.error(`    nas outras ${candidatos.length - 1} atualizações. A sonda deixou 1 duplicata`);
    console.error(`    em ${alvo.chave} — limpar exige acesso ao banco.`);
    console.error(`    Os ${fila.filter((e) => e.motivo === "novo").length} arquivos novos ainda podem subir: --so-novos\n`);
    return false;
  }
  console.log(`         ✓ substituiu — liberando as outras ${candidatos.length - 1} atualizações\n`);
  return true;                                               // não marca enviado: o laço refaz com hash
}

const SO_NOVOS = process.argv.includes("--so-novos");
if (SO_NOVOS) {
  const antes = plano.enviar.length;
  plano.enviar = plano.enviar.filter((e) => e.motivo === "novo");
  console.log(`  --so-novos: ${antes - plano.enviar.length} atualização(ões) fora da fila`);
}

if (SO_NOVOS || await sondar(plano.enviar)) await subirTodos(plano.enviar);
else falhas++;

// Grava o progresso de volta no plano, para a próxima janela continuar daqui.
const arqPlano = USAR_PLANO ?? SALVAR_PLANO;
if (arqPlano) fs.writeFileSync(arqPlano, JSON.stringify(plano, null, 2));

const faltam = plano.enviar.filter((e) => !e.enviado).length;
console.log(`\n  ${cursosCriados} curso(s) · ${criadas} aula(s) · ${enviados} asset(s) · ${falhas} falha(s)`);
if (parouPorTempo) {
  console.log(`\n  PAROU: o token está expirando e não há credencial para renovar.`);
  console.log(`  Faltam ${faltam}. Cole um token novo e repita o mesmo comando — ele continua daqui.\n`);
} else if (faltam) {
  console.log(`  ainda faltam ${faltam}\n`);
} else {
  console.log(`  tudo sincronizado\n`);
}
process.exit(falhas ? 1 : 0);
