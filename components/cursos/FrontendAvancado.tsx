import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import { materialDaAula } from "@/lib/cdn";

/**
 * O conteudo da landing do curso, sem moldura nenhuma.
 *
 * Nem cabecalho, nem rodape, nem "voltar": quem monta a moldura e a rota. A
 * publica (`app/cursos/frontend-avancado/page.tsx`) poe o SiteHeader e o Footer; a
 * logada (`app/(private)/painel/cursos/[slug]`) deixa a sidebar da area
 * logada fazer esse papel, que e o motivo de a moldura ter saido daqui.
 *
 * Duas molduras, um conteudo so. Enquanto o texto morava dentro da pagina
 * publica, mostrar o mesmo curso na area logada exigia manter duas copias
 * em dia na mao -- e a segunda ia ficar para tras no primeiro dia corrido.
 */

const AULA_01 = materialDaAula("frontend-avancado", "aula-01-html-css");
const AULA_02 = materialDaAula("frontend-avancado", "aula-02-javascript-typescript");
const PROJETO = materialDaAula("frontend-avancado", "projeto");

type Material = {
  href: string;
  label: string;
  primary?: boolean;
  externo?: boolean;
};

type Aula = {
  n: string;
  titulo: string;
  desc: React.ReactNode;
  materiais?: Material[];
};

/**
 * Monta a fileira de materiais de uma aula — só o que é voltado para a turma.
 * O roteiro de condução e o briefing do projeto ficam de fora: o primeiro é
 * material de quem ensina, e o segundo tem lugar próprio no card do projeto.
 */
function materiaisDaAula({
  base,
  previa,
  repo,
}: {
  base: string;
  previa?: string;
  repo?: string;
}): Material[] {
  return [
    { href: `${base}/slides.html`, label: "▶ Slides da aula", primary: true },
    { href: `${base}/desafio.html`, label: "🎯 Desafio técnico" },
    { href: `${base}/codigos-desafio.html`, label: "🧩 Código do desafio" },
    ...(previa ? [{ href: previa, label: "👁️ Prévia da resposta" }] : []),
    ...(repo
      ? [{ href: repo, label: "💻 Código no GitHub", externo: true }]
      : []),
  ];
}

const FUNDAMENTOS: Aula[] = [
  {
    n: "01",
    titulo: "HTML e CSS: a base que o framework não substitui",
    desc: (
      <>
        Abertura do curso, critérios e formação das equipes. Depois, os dois
        numa tacada só, do jeito que vivem na prática: <strong>HTML</strong>{" "}
        semântico de verdade — landmarks, hierarquia de títulos, formulários
        acessíveis — e <strong>CSS</strong> moderno: Grid e Flexbox sem decoreba,
        custom properties como tokens, <span className="mono">@layer</span>,
        container queries, <span className="mono">:has()</span>, responsividade
        e tema escuro. Fecha com o problema do{" "}
        <strong>escopo de estilo</strong>, que Angular e Next resolvem de formas
        bem diferentes — e que volta nas aulas 03 e 10.
      </>
    ),
    materiais: materiaisDaAula({
      base: AULA_01,
      previa: `${AULA_01}/previa/index.html`,
      repo: "https://github.com/Nicoly-Almeida/leque-de-eventos-html-css",
    }),
  },
  {
    n: "02",
    titulo: "JavaScript e TypeScript: a linguagem dos dois frameworks",
    desc: (
      <>
        <strong>JavaScript:</strong> módulos ES, desestruturação, spread e os
        métodos de array do dia a dia. Escopo, closures e o{" "}
        <span className="mono">this</span>. Imutabilidade — inegociável em
        interface reativa. <span className="mono">Promise</span>,{" "}
        <span className="mono">async/await</span>,{" "}
        <span className="mono">fetch</span> e erro de rede.
        <br />
        <strong>TypeScript:</strong> tipos, uniões e narrowing, genéricos e
        utility types, com <span className="mono">strict</span> ligado — na
        versão <span className="mono">6.0</span>, que é a que o Angular 22 exige.
      </>
    ),
    materiais: materiaisDaAula({
      base: AULA_02,
    }),
  },
];

const ANGULAR: Aula[] = [
  {
    n: "03",
    titulo: "Angular 22: o primeiro app",
    desc: (
      <>
        CLI, estrutura do projeto e componentes standalone —{" "}
        <strong>sem NgModules</strong>.{" "}
        <span className="mono">bootstrapApplication</span> e providers.{" "}
        <strong>Zoneless é o padrão</strong> a partir da v21: o que mudou, por
        que o <span className="mono">zone.js</span> saiu de cena e o que isso
        exige de você.
      </>
    ),
  },
  {
    n: "04",
    titulo: "Templates, composição e comunicação",
    desc: (
      <>
        O control flow nativo: <span className="mono">@if</span>,{" "}
        <span className="mono">@for</span>, <span className="mono">@switch</span>{" "}
        e <span className="mono">@defer</span>. Comunicação entre componentes com{" "}
        <span className="mono">input()</span>,{" "}
        <span className="mono">output()</span> e{" "}
        <span className="mono">model()</span> — a forma recomendada hoje, no
        lugar dos decorators. Projeção de conteúdo e estilos com escopo.
      </>
    ),
  },
  {
    n: "05",
    titulo: "Signals: o modelo reativo do Angular",
    desc: (
      <>
        <span className="mono">signal</span>,{" "}
        <span className="mono">computed</span>,{" "}
        <span className="mono">effect</span> e{" "}
        <span className="mono">linkedSignal</span>. Estado local, derivado e
        compartilhado entre componentes. Onde o RxJS ainda faz sentido, e como os
        dois conversam.
      </>
    ),
  },
  {
    n: "06",
    titulo: "Roteamento e navegação",
    desc: (
      <>
        Definição de rotas, parâmetros, rotas filhas e layouts aninhados. Lazy
        loading por rota, guards funcionais e resolvers. Estados de carregamento
        e de erro por rota.
      </>
    ),
  },
  {
    n: "07",
    titulo: "Dados: injeção de dependência e HTTP",
    desc: (
      <>
        <span className="mono">inject()</span>, services e escopos de providers.{" "}
        <span className="mono">provideHttpClient</span> com interceptors
        funcionais. <span className="mono">resource()</span> e{" "}
        <span className="mono">httpResource()</span> para dados assíncronos
        integrados a signals.
      </>
    ),
  },
  {
    n: "08",
    titulo: "Formulários e validação",
    desc: (
      <>
        <strong>Signal Forms</strong>, a API nova do Angular, ao lado de Reactive
        Forms — o que cada uma resolve e quando escolher. Validação síncrona e
        assíncrona, campos dinâmicos e mensagens de erro acessíveis.
      </>
    ),
  },
  {
    n: "09",
    titulo: "Angular avançado, testes e deploy",
    desc: (
      <>
        Performance e detecção de mudanças num app zoneless.{" "}
        <span className="mono">@defer</span> com gatilhos, otimização de imagens
        e análise de build. Testes de componente e de service. Publicação.
      </>
    ),
  },
];

const NEXT: Aula[] = [
  {
    n: "10",
    titulo: "Next.js: o outro paradigma",
    desc: (
      <>
        App Router e rota por pasta. Server e Client Components — o contraste
        direto com o Angular: <strong>onde o código roda</strong> e quem monta o
        HTML. Layouts aninhados, <span className="mono">loading</span> e{" "}
        <span className="mono">error</span>. Começa a reescrita do projeto.
      </>
    ),
  },
  {
    n: "11",
    titulo: "Data fetching, cache e renderização",
    desc: (
      <>
        <span className="mono">fetch</span> com cache e revalidação, rotas
        estáticas e dinâmicas, <span className="mono">generateStaticParams</span>{" "}
        e streaming com Suspense. O que o Angular fazia com service e{" "}
        <span className="mono">resource()</span>, aqui é outro desenho.
      </>
    ),
  },
  {
    n: "12",
    titulo: "Mutações com Server Actions",
    desc: (
      <>
        Formulários sem API: Server Actions, estados de envio, validação com Zod
        e revalidação de cache. Tratamento de erro e UI otimista. O contraponto
        direto ao Signal Forms da aula 08.
      </>
    ),
  },
  {
    n: "13",
    titulo: "Backend e autenticação",
    desc: (
      <>
        Route Handlers, banco de dados com Prisma ou Drizzle, e autenticação com
        Auth.js. Proteção de rotas, sessões e controle por papéis.
      </>
    ),
  },
  {
    n: "14",
    titulo: "Performance, SEO e acessibilidade",
    desc: (
      <>
        <span className="mono">next/image</span>,{" "}
        <span className="mono">next/font</span>, dynamic import e bundle
        analyzer. Core Web Vitals medidos, não adivinhados. Metadata dinâmica,
        sitemap e Open Graph. WCAG aplicado nas telas que já existem.
      </>
    ),
  },
  {
    n: "15",
    titulo: "Testes e qualidade",
    desc: (
      <>
        Vitest e Testing Library, testes de Server Actions, e ponta a ponta com
        Playwright. Mocks de API, cobertura que importa e o que não vale testar.
      </>
    ),
  },
];

const FECHAMENTO: Aula[] = [
  {
    n: "16",
    titulo: "Deploy, CI/CD e defesa comparativa",
    desc: (
      <>
        Publicação na Vercel e self-host com Docker. GitHub Actions com build,
        lint e testes a cada push. E o fecho do curso: a mesma aplicação, dois
        frameworks — <strong>o que cada um tornou fácil, e o que tornou
        difícil</strong>.
      </>
    ),
  },
];

function ListaDeAulas({ aulas }: { aulas: Aula[] }) {
  return (
    <div className="lessons">
      {aulas.map((a) => (
        <div className={a.materiais ? "lesson" : "lesson soon"} key={a.n}>
          <div className="idx">{a.n}</div>
          <div className="body">
            <h3>
              {a.titulo}{" "}
              <span
                className="mono"
                style={{ fontSize: 13, color: "var(--text-3)" }}
              >
                · 4h
              </span>
            </h3>
            <p>{a.desc}</p>

            {a.materiais && (
              <div className="mats">
                {a.materiais.map((m) => (
                  <a
                    className={m.primary ? "mat primary" : "mat"}
                    href={m.href}
                    key={m.href}
                    {...(m.externo
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {m.label}
                  </a>
                ))}
              </div>
            )}

            {!a.materiais && <span className="soon-tag">em breve</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FrontendAvancado() {
  return (
    <>
      <div className="eyebrow">Curso · 16 aulas de 4h · 64 horas</div>
      <h1>
        Frontend <span className="grad-text">Avançado</span>
      </h1>
      <p className="lead">
        Um curso construído sobre uma comparação: <strong>a mesma aplicação,
        feita duas vezes</strong>. Primeiro em <strong>Angular 22</strong>, com
        signals e zoneless; depois em <strong>Next.js</strong>, com App Router e
        Server Components. Antes disso, duas aulas de base — HTML, CSS,
        JavaScript e TypeScript — porque framework nenhum salva quem não tem
        fundamento.
      </p>
      <BadgesDeTecnologia tecnologias={["html", "css", "javascript", "typescript", "nextjs"]} />
      <div className="brand-rule" />

      <div className="acoes">
        <a
          className="glow-btn"
          href="https://www.youtube.com/playlist?list=PLcHfvbd8oBOI"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Aulas gravadas
        </a>
        <a
          className="glow-btn"
          href="https://chat.whatsapp.com/CsSUEhPBuWwFp6UGWHALR6"
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Entrar no grupo da turma
        </a>
      </div>

      <div className="section-label">Projeto do curso</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">🎟️</div>
          <div className="body">
            <h3>Leque de Eventos — construído duas vezes</h3>
            <p>
              Uma plataforma de eventos de tecnologia: listagem com busca e
              filtros, página de detalhe, cadastro de evento com formulário
              validado, autenticação e um painel de quem organiza.{" "}
              <strong>O mesmo escopo é entregue em Angular (aula 09) e depois
              em Next.js (aula 16)</strong> — e é essa repetição que dá o valor
              do curso: com o problema já resolvido uma vez, o que sobra pra
              estudar na segunda volta é exatamente a diferença entre os dois
              frameworks.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${PROJETO}/brief.html`}>
                🎟️ Briefing e rubrica
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="section-label">Unidade 1 · Fundamentos · 2 aulas</div>
      <ListaDeAulas aulas={FUNDAMENTOS} />

      <div className="section-label">Unidade 2 · Angular 22 · 7 aulas</div>
      <ListaDeAulas aulas={ANGULAR} />

      <div className="section-label">Unidade 3 · Next.js · 6 aulas</div>
      <ListaDeAulas aulas={NEXT} />

      <div className="section-label">Unidade 4 · Fechamento · 1 aula</div>
      <ListaDeAulas aulas={FECHAMENTO} />
    </>
  );
}
