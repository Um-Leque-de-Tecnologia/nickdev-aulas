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
