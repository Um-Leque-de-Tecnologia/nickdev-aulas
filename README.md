# NickDev · Aulas

Hub das aulas da NickDev (slides, guias e recursos), agora como um projeto
**Next.js** (App Router + TypeScript). As páginas de navegação são React e
reutilizam a mesma identidade visual; os materiais pesados e auto-contidos de
cada aula (slides, guias) continuam servidos como HTML estático.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros scripts: `npm run build` (build de produção) e `npm run start` (serve o
build).

### Scripts de deploy (Cloudflare / OpenNext)

| Script | O que faz |
| --- | --- |
| `npm run build` | build do Next puro (`.next/`) — usado pra conferir erros |
| `npm run build:cf` | build do OpenNext (`.open-next/worker.js` + `assets`) |
| `npm run preview` | build do OpenNext + roda no workerd local |
| `npm run deploy` | build do OpenNext + publica no Cloudflare |

> ⚠️ **Não aponte `build` para `opennextjs-cloudflare build`.** O
> `opennextjs-cloudflare build` executa `npm run build` internamente pra buildar
> o Next — apontar um pro outro cria recursão infinita. É por isso que existe o
> `build:cf` separado.

**Cloudflare Workers Builds:** o comando de build configurado no painel precisa
ser `npm run build:cf`. Se for só `npm run build`, o CI gera apenas `.next/`, o
`opennextjs-cloudflare deploy` não encontra `.open-next/` e o deploy falha com
_"Could not find compiled Open Next config"_.

## Estrutura

```
nickdeve-aulas/
├── app/
│   ├── layout.tsx                     # layout raiz: <html>, cenário ambiente, globals.css
│   ├── globals.css                    # tokens da marca (cores, fontes, cards) — ex-brand.css
│   ├── page.tsx                       # hub: lista os cursos  →  /
│   └── cursos/
│       └── frontend-transicao/
│           └── page.tsx               # landing do curso  →  /cursos/frontend-transicao
├── components/
│   ├── Ambient.tsx                    # brilhos de fundo
│   ├── SiteHeader.tsx                 # logo + nome
│   └── Footer.tsx                     # rodapé (prop withHome nas páginas internas)
├── public/
│   ├── assets/logo/                   # logos NickDev
│   └── cursos/frontend-transicao/aula-01-abertura/
│       ├── slides.html                # deck da aula (auto-contido: CSS + JS + imagens)
│       └── guia-html-css.html         # material de apoio (auto-contido)
├── next.config.mjs
├── tsconfig.json
└── package.json
```

As URLs seguem previsíveis, ex.:
`seudominio.com/cursos/frontend-transicao/aula-01-abertura/slides.html`

## Área logada (Keycloak)

Quem desenha login, cadastro e "esqueci a senha" é o **Keycloak** — este projeto
não tem tela de senha. O site faz Authorization Code + PKCE, valida o `id_token`
e guarda uma sessão cifrada num cookie `httpOnly`. Quem pode ver qual curso vem
de **role do client**, não de banco: não existe banco aqui.

### 1. O client no Keycloak

O realm é o **`aulas`**, em `https://auth.rodolfodebonis.com.br`, e o client é o
**`aulas-web`** — o mesmo que um front via `keycloak-js` usa. Por isso ele é
**público**: client confidencial não funciona no navegador, e o secret que o
`keycloak-js` não pode ter também não existe para este site.

| Campo | Valor |
| --- | --- |
| Client ID | `aulas-web` — o mesmo de `KEYCLOAK_CLIENT_ID` |
| Client authentication | **Off** (client público: não tem `client_secret`) |
| Standard flow | **ligado** — é o Authorization Code que o site usa |
| Direct access grants | **desligado** |
| PKCE Code Challenge Method | **`S256`** (Advanced Settings) — obrigatório, ver abaixo |
| Valid redirect URIs | `http://localhost:3000/entrar/retorno` e `https://aulas.umlequedetecnologia.com.br/entrar/retorno` |
| Valid post logout redirect URIs | `http://localhost:3000/` e `https://aulas.umlequedetecnologia.com.br/` |
| Web origins | não precisa para este site — o navegador nunca fala com o Keycloak por XHR aqui; a troca do código acontece no servidor |

> ⚠️ **Em client público, o `S256` no Advanced Settings não é detalhe.** Sem
> `client_secret`, quem impede que um código de autorização interceptado vire
> token é o PKCE: o site manda `code_challenge` na ida e guarda o
> `code_verifier` num cookie `httpOnly` que nunca sai do servidor. Mas se o
> client aceitar troca de código **sem** `code_challenge`, o atacante simplesmente
> não manda o campo e pula a proteção inteira. Quem fecha essa porta é o realm,
> não o código — marcar `S256` ali obriga todo mundo a jogar com PKCE.

**Se um dia este site ganhar um client confidencial só dele** (recomendado, e é
o modelo para o qual o código foi escrito), basta criar o client com
`Client authentication` **On**, pôr o segredo da aba *Credentials* em
`KEYCLOAK_CLIENT_SECRET` e trocar o `KEYCLOAK_CLIENT_ID`. Nada de código muda:
`lib/auth/keycloak.ts` manda o `client_secret` quando a variável existe e trata
a ausência dela como client público.

**Por que `Direct access grants` fica desligado:** esse é o fluxo em que a
aplicação recebe usuário e senha e repassa para o Keycloak. Aqui a senha só é
digitada na tela do Keycloak, então esse fluxo nunca é chamado — e um fluxo
ligado que ninguém usa é só uma porta a mais para tentativa de força bruta
contra as contas do realm.

> ⚠️ **Redirect URI casa com o caminho inteiro.** Cadastrar só o domínio não
> basta: precisa terminar em `/entrar/retorno`. Se errar, a pessoa faz login,
> volta, e leva um `Invalid parameter: redirect_uri` na tela do Keycloak — não
> na sua, o que faz o erro parecer um bug do site.

> ⚠️ **E casa com a PORTA.** O `redirect_uri` sai da origem do request, então
> rodar o dev em outra porta manda um URI que ninguém cadastrou — e o Keycloak
> responde exatamente o mesmo `Parâmetro inválido: redirect_uri`, como se
> faltasse configuração. É a pegadinha mais fácil de cair aqui, porque o
> `next dev` **desliza de porta em silêncio** quando a 3000 está ocupada por
> outro projeto: ele avisa `using available port 3001 instead` numa linha do
> terminal e segue.
>
> Por isso o script é `next dev -p 3000`, e não `next dev`: com a porta
> explícita ele falha na hora com `EADDRINUSE`, que aponta para o problema de
> verdade. Se a 3000 estiver ocupada, libere-a — não suba em outra porta
> esperando que o login funcione.
>
> Vale para o `npm run preview` também: o workerd sobe em `8787`, que não está
> cadastrado. Login pelo preview exige cadastrar `http://localhost:8787/entrar/retorno`
> no client.

### 1.1. Como a pessoa ganha conta: sem autocadastro

Não existe "criar conta" neste produto. Quem entra é quem foi colocado no realm:
o admin cadastra o **e-mail** da pessoa em *Users*, e ela recebe um e-mail para
**definir a própria senha** (*Credentials* → *Reset actions* → `Update Password`,
ou o *Email* → `Update password`). O site nunca vê senha, e não tem tela de
cadastro — nenhum arquivo em `app/` ou `components/` linka para o registro do
Keycloak.

> ⚠️ **Isso depende de uma chave no realm, e hoje ela está do lado errado.** A
> tela de login do `aulas` está mostrando um link **"Criar conta"**
> (`id="kc-registration"` no HTML dela), o que significa *Realm settings* →
> *Login* → **User registration** ligado. Com ele ligado, qualquer pessoa com o
> endereço da tela de login cria conta sozinha.
>
> Não é buraco de acesso: conta nova vem sem role nenhuma, e `lib/auth/roles.ts`
> só libera curso restrito para quem tem a role — quem se cadastrar sozinho vê o
> painel com os cursos públicos, que já eram públicos. Mas contradiz o modelo
> acima e enche o realm de contas que ninguém convidou. **Desligar
> `User registration`** deixa a tela só com usuário, senha e "esqueci minha
> senha" — que é o que este produto precisa.

### 2. Roles: quem entra em quê

As permissões são **client roles** do client `aulas-web` (aba *Roles*) — as
mesmas que o `KEYCLOAK_CLIENT_ID` aponta, porque o app lê
`resource_access["aulas-web"].roles`. Role criada em outro client não chega aqui.

| Role | Quem recebe | O que abre |
| --- | --- | --- |
| `admin` | você | `/admin` |

**É só essa.** Curso pago não é liberado pessoa a pessoa: **quem tem sessão vê
todos**. A regra está em `canSee()`, em `lib/auth/roles.ts`, e a rota que entrega
o material aplica a mesma coisa do outro lado — ao receber 403 da API, ela
matricula a sessão e pede de novo, porque o endpoint de matrícula aceita
qualquer sessão válida.

Curso público aparece para todo mundo, logado ou não; curso pago aparece para
quem entrou. Não existe estado intermediário, e **não há nada para atribuir no
console** — se você atribuir `curso-nextjs-ia` a alguém, não muda nada, nem para
mais nem para menos. O campo `role` segue no catálogo como gancho para o dia em
que voltar a existir curso liberado por matrícula individual; hoje ninguém o lê.

> 🔒 **Isso move a tranca do curso pago para o cadastro.** Antes, conta nova sem
> role não abria material pago; agora **ter conta é ter acesso**. Enquanto
> *Realm settings → Login → **User registration*** estiver ligado no realm,
> qualquer pessoa cria conta e abre o curso pago de graça. Desligar o autocadastro
> não é arrumação de tela — é a única tranca que sobrou. Ver a seção 1.1.

Curso restrito novo é uma entrada em `lib/cursos.ts` com `access: "restricted"`.
Nada mais: ele sai da vitrine pública sozinho e aparece no painel de quem entrou.

### 3. Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `KEYCLOAK_ISSUER` | base do realm; dela sai o `.well-known/openid-configuration` |
| `KEYCLOAK_CLIENT_ID` | `client_id` e chave das roles em `resource_access` |
| `KEYCLOAK_CLIENT_SECRET` | **opcional** — só existe em client confidencial. Hoje o `aulas-web` é público e ela fica de fora |
| `SESSION_SECRET` | 32+ bytes aleatórios; deriva a chave que cifra o cookie |
| `APP_URL` | opcional; sem ela, a URL de retorno vem da origem do request |

**Local: dois arquivos, e não é redundância.** Quem lê cada um é um runtime
diferente, e os dois estão no `.gitignore`:

| arquivo | quem lê |
| --- | --- |
| `.env.local` | `npm run dev` — `next dev`, runtime Node, `process.env` nativo do Next |
| `.dev.vars` | `npm run preview` — `wrangler dev`, runtime workerd |

```bash
cp .dev.vars.example .dev.vars   # preencha
cp .dev.vars .env.local          # as mesmas variáveis, para o next dev
npm run dev
```

> ⚠️ **O `next dev` NÃO lê o `.dev.vars`.** Ele até anuncia
> `Using secrets defined in .dev.vars` no terminal — isso é o Miniflare, e
> aquelas variáveis ficam no `env` do Worker, não no `process.env` que os Route
> Handlers do dev server leem. Sem `.env.local`, o `KEYCLOAK_ISSUER` chega
> vazio, o atalho de login de mentira volta a valer e o `/entrar` nunca sai para
> o Keycloak — com o terminal dizendo que leu a configuração. Use o mesmo
> `SESSION_SECRET` nos dois arquivos, senão trocar de comando desloga você.

**Produção:** nada disso vai para o `wrangler.jsonc` — ele é versionado. Cada
valor vira um secret do Worker:

```bash
npx wrangler secret put KEYCLOAK_ISSUER
npx wrangler secret put KEYCLOAK_CLIENT_ID
npx wrangler secret put KEYCLOAK_CLIENT_SECRET   # só em client confidencial
npx wrangler secret put SESSION_SECRET
npx wrangler secret put APP_URL          # só se você quiser fixar a URL
```

Faltou alguma das obrigatórias? O app falha na hora, com o nome da variável no
erro. É de propósito: auth que falha calada é pior do que site que não sobe. A
exceção é o `KEYCLOAK_CLIENT_SECRET`, que é opcional — ausente, o site se
apresenta como client público.

> ⚠️ **Trocar o `SESSION_SECRET` desloga todo mundo.** A sessão vive inteira
> dentro do cookie cifrado; com chave nova, os cookies antigos não decifram
> mais e viram sessão nula. Isso é o botão de emergência quando algo vaza — e
> também a pegadinha de quem regenera o valor sem querer.

### 4. Atalho de login local (só em desenvolvimento)

Enquanto o client do Keycloak não existe, dá para abrir a área logada com uma
**sessão de mentira**, montada em `lib/auth/dev.ts`. Ela só liga quando as duas
coisas são verdade ao mesmo tempo:

1. `NODE_ENV` é `development` — o `next build` sempre produz `production`;
2. `KEYCLOAK_ISSUER` está ausente ou vazia.

Ou seja: `npm run dev` sem `.env.local` nenhum já entra. Nem o `SESSION_SECRET`
precisa existir — em `development` o cookie é cifrado com uma chave fixa de
desenvolvimento.

| URL | Quem você vira |
| --- | --- |
| `/entrar` | admin — enxerga o `/admin` e todos os cursos |
| `/entrar?dev=aluno` | aluno comum — os mesmos cursos, sem o `/admin` |

Trocar de papel é abrir o outro endereço; não precisa sair antes. A área logada
inteira ganha uma faixa amarela avisando que nada ali é dado real: nome, e-mail
e cursos liberados estão escritos no código.

> ⚠️ **O atalho se apaga sozinho.** No instante em que `KEYCLOAK_ISSUER` for
> definida, ele para de valer e o `/entrar` volta a ir para o Keycloak — sem
> ninguém precisar lembrar de remover código. Fora de `development` ele nem
> chega a existir, e o layout da área logada ainda recusa uma sessão de mentira
> que apareça por engano.

### 5. As rotas

| Rota | Método | O que faz |
| --- | --- | --- |
| `/entrar` | GET | gera PKCE, `state` e `nonce`, guarda em cookies de 10 min e manda para o Keycloak. Aceita `?de=/painel` para voltar ao ponto de origem |
| `/entrar/retorno` | GET | é o `redirect_uri`: confere o `state`, troca o `code` por tokens, valida o `id_token` e grava a sessão |
| `/entrar/erro` | GET | tela de falha de login, com botão de tentar de novo |
| `/sair` | **POST** | apaga os cookies e segue para o logout do Keycloak |
| `/painel` | GET | os cursos que a pessoa pode ver |
| `/perfil` | GET | conta, cursos liberados, quando a sessão expira, botão de sair |
| `/admin` | GET | só para quem tem a role `admin`; para o resto, **404** |
| `/api/me` | GET | `{ authenticated, name?, isAdmin? }` para o botão do cabeçalho — nunca token, e-mail ou lista de roles |

O `/admin` responde 404, e não 403, de propósito: um 403 confirma que a rota
existe para quem não devia nem saber disso.

> ⚠️ **`/sair` só aceita POST.** Logout por GET é disparável de fora — basta um
> `<img src="https://aulas.../sair">` num fórum para deslogar quem passar por
> lá. O botão de sair é um `<form method="post" action="/sair">`.

O `proxy.ts` na raiz (é o nome do middleware no Next 16) protege `/painel`,
`/perfil` e `/admin`, mas só olha se o cookie **existe**. Isso é atalho de
navegação, não autorização: um cookie inventado passa por ele e morre no Server
Component, que chama `readSession()` e decide de verdade.

### 6. Material privado não pode morar em `public/`

Tudo que está em `public/` é público, e nenhuma rota do app muda isso. No
Cloudflare o `wrangler.jsonc` aponta `assets.directory` para `.open-next/assets`
e o **Asset Worker responde antes do Worker**: se o arquivo existe lá, ele é
entregue direto. O `proxy.ts` nunca vê o pedido, `readSession()` nunca roda, e
quem tiver a URL baixa o material sem nunca ter feito login. Slides e guias de
hoje são abertos de propósito, então tudo bem — o problema começa no dia em que
entrar material pago.

> 🔒 **Material pago não entra em `public/`.** Ele fica fora da pasta (ou no
> R2) e é servido por um Route Handler que confere a sessão antes de devolver
> os bytes. URL difícil de adivinhar não é controle de acesso.

Existe uma alternativa: `assets.run_worker_first` no `wrangler.jsonc` inverte a
ordem para os caminhos que você listar, e aí o Worker atende antes do Asset
Worker. Resolve, mas paga uma execução de Worker por arquivo e deixa a proteção
dependendo de uma lista de caminhos que alguém precisa manter em dia. Tirar o
arquivo de `public/` erra menos.

## Por que slides e guias são HTML estático?

Os arquivos `slides.html` e `guia-html-css.html` são decks interativos
auto-contidos (CSS, JS de navegação e imagens embutidos em um único arquivo).
Ficam em `public/`, então o Next os serve direto pela URL — dá pra abri-los
soltos por aí sem depender do resto do site. As páginas React em `app/` linkam
pra eles.

## Convenções (travar desde o começo)

- **Pastas e arquivos de material:** minúsculo, sem acento, em `kebab-case`
  (`frontend-transicao`, não `Frontend Transição`). Evita `%20`/`%C3%A7` nas URLs.
- **Aulas numeradas com zero à esquerda:** `aula-01`, `aula-02`… (ordena certo).
- **Marca centralizada:** cores, fontes e o cenário animado vivem em
  `app/globals.css`. Muda num lugar, reflete no site todo.
- **Idioma do código novo:** identificador em inglês (`readSession`, `Course`,
  cookie `nd_session`); texto de tela e rota que a pessoa digita em português
  (`/entrar`, `/painel`). Caminho que ninguém digita fica em inglês (`/api/me`,
  `lib/auth/session.ts`).

## Projetos das aulas (repositórios separados)

A partir da **aula 04** o curso tem um projeto que cresce a cada aula. Ele vive
num repositório próprio da organização — não dentro deste repo — pra que a turma
possa clonar, forkar e publicar na Vercel sem levar junto o site das aulas:

| Projeto | Repositório | Entra na |
| --- | --- | --- |
| 🪭 Leque de Vagas | [Um-Leque-de-Tecnologia/leque-de-vagas](https://github.com/Um-Leque-de-Tecnologia/leque-de-vagas) | aula 04 |

Aqui ficam só os **materiais** (slides, guias, desafios) — que linkam pro
repositório do projeto.

## Adicionar uma aula nova

1. Coloque os materiais em
   `public/cursos/<curso>/aula-02-<slug>/` (`slides.html`, guias, recursos).
2. Adicione o card da aula na página React do curso
   (`app/cursos/<curso>/page.tsx`): troque o bloco `.lesson.soon` por um
   `.lesson` com os links `.mat` apontando pros arquivos em `public/`.

## Adicionar um curso novo

1. Crie `app/cursos/<curso>/page.tsx` (use `frontend-transicao` como base).
2. Adicione o card do curso em `app/page.tsx` (troque um `.card.soon` por um
   `<Link>` pra `/cursos/<curso>`).

## Publicar

**Vercel (recomendado):** importe o repositório em vercel.com — o Next.js é
detectado automaticamente. Adicione seu domínio e pronto; todo `git push` na
`main` republica sozinho. Para servir num subdomínio, adicione
`aulas.seudominio.com` nas configurações de domínio do projeto.
