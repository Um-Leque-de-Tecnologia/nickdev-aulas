import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Introdução ao Next.js · NickDev",
  description:
    "Curso de Next.js do zero, sem pré-requisito de React: componentes, App Router, Server Components, data fetching, Server Actions, autenticação, performance, testes e deploy com CI/CD.",
};

const AULA_01 = "/cursos/introducao-nextjs/aula-01-abertura-fundamentos";

type Aula = {
  n: string;
  data: string;
  titulo: string;
  desc: React.ReactNode;
  marco?: string;
};

const AULAS: Aula[] = [
  {
    n: "02",
    data: "19/08",
    titulo: "Roteamento com App Router",
    desc: (
      <>
        <span className="mono">layout</span> / <span className="mono">page</span> /{" "}
        <span className="mono">template</span>; rotas dinâmicas e catch-all;
        route groups; rotas paralelas e interceptadas;{" "}
        <span className="mono">loading</span>, <span className="mono">error</span> e{" "}
        <span className="mono">not-found</span>; navegação com{" "}
        <span className="mono">Link</span> e <span className="mono">useRouter</span>.
      </>
    ),
    marco: "Briefing do Leque de Vagas + entrega da rubrica",
  },
  {
    n: "03",
    data: "26/08",
    titulo: "Server vs Client Components",
    desc: (
      <>
        RSC na prática; a fronteira <span className="mono">&quot;use client&quot;</span>;
        padrões de composição; props serializáveis; Suspense e streaming.
      </>
    ),
    marco: "Escopo mínimo do projeto definido",
  },
  {
    n: "04",
    data: "02/09",
    titulo: "Data fetching e renderização",
    desc: (
      <>
        <span className="mono">fetch</span> com cache; revalidação (ISR);{" "}
        <span className="mono">generateStaticParams</span>; static vs dynamic;
        Partial Prerendering; Metadata API.
      </>
    ),
  },
  {
    n: "05",
    data: "09/09",
    titulo: "Mutações com Server Actions",
    desc: (
      <>
        Formulários sem API; <span className="mono">useActionState</span> e{" "}
        <span className="mono">useFormStatus</span>; validação com Zod;{" "}
        <span className="mono">revalidatePath</span> e{" "}
        <span className="mono">revalidateTag</span>; tratamento de erros.
      </>
    ),
  },
  {
    n: "06",
    data: "16/09",
    titulo: "Backend no Next.js",
    desc: (
      <>
        Route Handlers; proxy e middleware; cookies e headers; banco com Prisma
        ou Drizzle; camada de serviços.
      </>
    ),
  },
  {
    n: "07",
    data: "23/09",
    titulo: "Autenticação e autorização",
    desc: <>Auth.js; sessões e JWT; proteção de rotas; controle por papéis.</>,
  },
  {
    n: "08",
    data: "30/09",
    titulo: "Tailwind, design system e acessibilidade",
    desc: (
      <>
        <strong>Entrada do Tailwind no curso</strong> — o que ele resolve, por
        que classes utilitárias, e migrando o CSS que o projeto já tem. Depois:
        shadcn/ui; dark mode; responsividade; WCAG na prática. Revisão para a 1ª
        verificação.
      </>
    ),
    marco: "Checkpoint 1 — protótipo navegável",
  },
  {
    n: "09",
    data: "07/10",
    titulo: "1ª Verificação de Aprendizagem",
    desc: <>Prova e apresentação do projeto parcial.</>,
  },
  {
    n: "10",
    data: "14/10",
    titulo: "Formulários avançados",
    desc: (
      <>
        Devolutiva da verificação. React Hook Form + Zod; máscaras; campos
        dinâmicos; upload de arquivos.
      </>
    ),
  },
  {
    n: "11",
    data: "21/10",
    titulo: "Estado e cache no cliente",
    desc: (
      <>
        Context API; Zustand; TanStack Query; router cache; UI otimista.
      </>
    ),
  },
  {
    n: "12",
    data: "28/10",
    titulo: "Performance",
    desc: (
      <>
        <span className="mono">next/image</span>;{" "}
        <span className="mono">next/font</span>; dynamic import; bundle
        analyzer; Core Web Vitals; Lighthouse; re-renders.
      </>
    ),
    marco: "Checkpoint 2 — CRUD + autenticação, com code review em sala",
  },
  {
    n: "13",
    data: "04/11",
    titulo: "SEO técnico e i18n",
    desc: (
      <>
        Metadata dinâmica; sitemap e robots; Open Graph gerado por imagem; dados
        estruturados; internacionalização.
      </>
    ),
  },
  {
    n: "14",
    data: "11/11",
    titulo: "Testes",
    desc: (
      <>
        Vitest + Testing Library; testar Server Actions; E2E com Playwright;
        mocks de API.
      </>
    ),
  },
  {
    n: "15",
    data: "18/11",
    titulo: "Arquitetura e segurança",
    desc: (
      <>
        Organização por features; monorepo; error boundaries; logging e
        observabilidade; variáveis de ambiente; CSP e OWASP no frontend.
      </>
    ),
    marco: "Checkpoint 3 — deploy em produção com CI",
  },
  {
    n: "16",
    data: "25/11",
    titulo: "Deploy e CI/CD",
    desc: (
      <>
        Vercel e self-host com Docker; GitHub Actions; preview deployments;
        analytics e monitoramento.
      </>
    ),
  },
  {
    n: "17",
    data: "02/12",
    titulo: "Congelamento e ensaio",
    desc: (
      <>
        Congelamento do código, ensaio cronometrado, code review coletivo e
        revisão geral.
      </>
    ),
    marco: "Congelamento + ensaio",
  },
  {
    n: "18",
    data: "09/12",
    titulo: "2ª Verificação de Aprendizagem",
    desc: <>Apresentação final e defesa do projeto.</>,
    marco: "Apresentação final e defesa",
  },
  {
    n: "19",
    data: "16/12",
    titulo: "Reposição e fechamento",
    desc: <>Reapresentação, fechamento de notas e devolutiva final.</>,
  },
];

export default function FrontendAvancadoNextjs() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <div className="eyebrow">Curso · 19 aulas · 2026.2</div>
      <h1>
        Introdução ao <span className="grad-text">Next.js</span>
      </h1>
      <p className="lead">
        Do primeiro componente a uma aplicação em produção. Começa do zero — não
        é preciso saber React — e vai até Server Components, data fetching,
        Server Actions, autenticação, acessibilidade, performance, testes e
        CI/CD. Tudo aplicado no <strong>Leque de Vagas</strong>, um projeto em equipe
        que evolui por checkpoints ao longo do semestre.
      </p>
      <div className="brand-rule" />

      <div className="section-label">Projeto do curso</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">💼</div>
          <div className="body">
            <h3>Leque de Vagas — vagas de tech pra quem está migrando</h3>
            <p>
              O projeto em equipe que cresce junto com as aulas: começa como uma
              página estática no ar e termina como uma aplicação completa, com
              listagem, busca, autenticação, banco de dados e deploy contínuo.{" "}
              <strong>O tema é o mesmo para a turma inteira</strong> — assim o
              semestre é gasto aprendendo Next.js, não decidindo o que construir.
              Briefing completo na aula 02.
            </p>
            <div className="mats">
              <a
                className="mat"
                href="https://github.com/Um-Leque-de-Tecnologia/leque-de-vagas"
                target="_blank"
                rel="noopener noreferrer"
              >
                💻 Projeto de referência
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="section-label">Aulas</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">01</div>
          <div className="body">
            <h3>
              Abertura e fundamentos{" "}
              <span className="mono" style={{ fontSize: 13, color: "var(--text-3)" }}>
                · 12/08
              </span>
            </h3>
            <p>
              Plano de ensino, critérios e formação das equipes. Por que HTML
              puro trava quando o site cresce, e a ideia que organiza o curso
              inteiro: <strong>o componente</strong>. JSX, quem é React e quem é
              Next, setup do ambiente (Node, npm,{" "}
              <span className="mono">create-next-app</span>), rota por pasta e o
              primeiro deploy na Vercel. Estilo em CSS comum — Tailwind entra na
              aula 08.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_01}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_01}/guia-fundamentos.html`}>
                📘 Guia de conteúdo
              </a>
              <a className="mat" href={`${AULA_01}/desafio.html`}>
                🎯 Desafio técnico
              </a>
              <a className="mat" href={`${AULA_01}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_01}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
              <a className="mat" href={`${AULA_01}/roteiro-aula.html`}>
                🛠️ Roteiro da aula
              </a>
            </div>
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
              <span className="mono" style={{ color: "var(--pink-light)" }}>
                marco do projeto
              </span>{" "}
              · teaser do escopo e formação das equipes
            </p>
          </div>
        </div>

        {AULAS.map((a) => (
          <div className="lesson soon" key={a.n}>
            <div className="idx">{a.n}</div>
            <div className="body">
              <h3>
                {a.titulo}{" "}
                <span
                  className="mono"
                  style={{ fontSize: 13, color: "var(--text-3)" }}
                >
                  · {a.data}
                </span>
              </h3>
              <p>{a.desc}</p>
              {a.marco && (
                <p style={{ marginTop: -6, fontSize: 14 }}>
                  <span className="mono" style={{ color: "var(--pink-light)" }}>
                    marco do projeto
                  </span>{" "}
                  · {a.marco}
                </p>
              )}
              <span className="soon-tag">em breve</span>
            </div>
          </div>
        ))}
      </div>

      <Footer withHome />
    </>
  );
}
