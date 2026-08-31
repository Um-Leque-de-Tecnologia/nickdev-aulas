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

No seu realm (ex.: `nickdev`), crie um client e configure assim:

| Campo | Valor |
| --- | --- |
| Client ID | `nickdev-aulas` — o mesmo de `KEYCLOAK_CLIENT_ID` |
| Client authentication | **On** (client confidencial: tem `client_secret`) |
| Standard flow | **ligado** — é o Authorization Code que o site usa |
| Direct access grants | **desligado** |
| Valid redirect URIs | `http://localhost:3000/entrar/retorno` e `https://aulas.seudominio.com.br/entrar/retorno` |
| Valid post logout redirect URIs | `http://localhost:3000/` e `https://aulas.seudominio.com.br/` |
| Web origins | `http://localhost:3000` e `https://aulas.seudominio.com.br` |

O `client_secret` aparece depois de salvar, na aba **Credentials**.

**Por que `Direct access grants` fica desligado:** esse é o fluxo em que a
aplicação recebe usuário e senha e repassa para o Keycloak. Aqui a senha só é
digitada na tela do Keycloak, então esse fluxo nunca é chamado — e um fluxo
ligado que ninguém usa é só uma porta a mais para tentativa de força bruta
contra as contas do realm.

> ⚠️ **Redirect URI casa com o caminho inteiro.** Cadastrar só o domínio não
> basta: precisa terminar em `/entrar/retorno`. Se errar, a pessoa faz login,
> volta, e leva um `Invalid parameter: redirect_uri` na tela do Keycloak — não
> na sua, o que faz o erro parecer um bug do site.

### 2. Roles: quem entra em quê

As permissões são **client roles** do client `nickdev-aulas` (aba *Roles*):

| Role | Quem recebe | O que abre |
| --- | --- | --- |
| `admin` | você | `/admin`, e enxerga todos os cursos restritos |
| `curso-<slug>` | quem foi liberado | o curso daquele `slug` |

Hoje existe uma role de curso só: **`curso-nextjs-ia`**. Curso público não tem
role — aparece para todo mundo, logado ou não.

**Liberar acesso a alguém** é atribuir a role no console do Keycloak: *Users* →
a pessoa → *Role mapping* → *Assign role* → filtre por *clients* →
`curso-nextjs-ia`. Não tem tela no site para isso, e o `/admin` diz o mesmo.

A sessão carrega as roles do momento em que foi criada. Quem já estava logado
enxerga o curso novo no próximo login — ou depois de sair e entrar de novo.

Curso restrito novo segue a regra `curso-` + o `slug` da pasta em `app/cursos/`:
crie a role com esse nome e registre o curso em `lib/cursos.ts`.

### 3. Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `KEYCLOAK_ISSUER` | base do realm; dela sai o `.well-known/openid-configuration` |
| `KEYCLOAK_CLIENT_ID` | `client_id` e chave das roles em `resource_access` |
| `KEYCLOAK_CLIENT_SECRET` | autentica o site no token endpoint |
| `SESSION_SECRET` | 32+ bytes aleatórios; deriva a chave que cifra o cookie |
| `APP_URL` | opcional; sem ela, a URL de retorno vem da origem do request |

**Local:** copie o exemplo, preencha e rode. O `.dev.vars` está no `.gitignore`,
e serve tanto para o `dev` quanto para o `preview` (workerd local).

```bash
cp .dev.vars.example .dev.vars
npm run dev
```

**Produção:** nada disso vai para o `wrangler.jsonc` — ele é versionado. Cada
valor vira um secret do Worker:

```bash
npx wrangler secret put KEYCLOAK_ISSUER
npx wrangler secret put KEYCLOAK_CLIENT_ID
npx wrangler secret put KEYCLOAK_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put APP_URL          # só se você quiser fixar a URL
```

Faltou alguma? O app falha na hora, com o nome da variável no erro. É de
propósito: auth que falha calada é pior do que site que não sobe.

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

Ou seja: `npm run dev` sem `.dev.vars` nenhum já entra. Nem o `SESSION_SECRET`
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
