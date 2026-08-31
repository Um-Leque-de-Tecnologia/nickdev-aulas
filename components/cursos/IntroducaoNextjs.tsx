import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import { materialDaAula } from "@/lib/cdn";

/**
 * O conteudo da landing do curso, sem moldura nenhuma.
 *
 * Nem cabecalho, nem rodape, nem "voltar": quem monta a moldura e a rota. A
 * publica (`app/cursos/introducao-nextjs/page.tsx`) poe o SiteHeader e o Footer; a
 * logada (`app/(private)/painel/cursos/[slug]`) deixa a sidebar da area
 * logada fazer esse papel, que e o motivo de a moldura ter saido daqui.
 *
 * Duas molduras, um conteudo so. Enquanto o texto morava dentro da pagina
 * publica, mostrar o mesmo curso na area logada exigia manter duas copias
 * em dia na mao -- e a segunda ia ficar para tras no primeiro dia corrido.
 */

const AULA_01 = materialDaAula("introducao-nextjs", "aula-01-abertura-fundamentos");
const AULA_02 = materialDaAula("introducao-nextjs", "aula-02-roteamento-app-router");
const AULA_03 = materialDaAula("introducao-nextjs", "aula-03-server-client");
const PROJETO = materialDaAula("introducao-nextjs", "projeto");

type Aula = {
  n: string;
  data: string;
  titulo: string;
  desc: React.ReactNode;
};

const AULAS: Aula[] = [
  {
    n: "04",
    data: "02/09",
    titulo: "Data fetching e renderização",
    desc: (
      <>
        <span className="mono">fetch</span> com cache; revalidação (ISR);{" "}
        <span className="mono">generateStaticParams</span>; static vs dynamic;
        streaming com <span className="mono">Suspense</span>, agora que a espera
        é de verdade; Partial Prerendering; Metadata API.
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
        O estado que a aula 03 deixou preso dentro de um componente, agora
        compartilhado: Context API; Zustand; TanStack Query; router cache; UI
        otimista.
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
  },
  {
    n: "18",
    data: "09/12",
    titulo: "2ª Verificação de Aprendizagem",
    desc: <>Apresentação final e defesa do projeto.</>,
  },
  {
    n: "19",
    data: "16/12",
    titulo: "Reposição e fechamento",
    desc: <>Reapresentação, fechamento de notas e devolutiva final.</>,
  },
];

export default function IntroducaoNextjs() {
  return (
    <>
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
      <BadgesDeTecnologia tecnologias={["javascript", "typescript", "nextjs"]} />
      <div className="brand-rule" />

      <div className="acoes">
        <a
          className="glow-btn"
          href="https://www.youtube.com/playlist?list=PLcNjRvNK5MXU"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Aulas gravadas
        </a>
      </div>

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
              A partir da aula 03 ele se divide em{" "}
              <strong>quatro frentes, uma por integrante</strong>, e todo desafio
              semanal passa a ter uma parte para cada uma.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${PROJETO}/brief.html`}>
                💼 Briefing e rubrica
              </a>
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
          </div>
        </div>

        <div className="lesson">
          <div className="idx">02</div>
          <div className="body">
            <h3>
              Roteamento com App Router{" "}
              <span className="mono" style={{ fontSize: 13, color: "var(--text-3)" }}>
                · 19/08
              </span>
            </h3>
            <p>
              Uma pasta que atende infinitas páginas: rotas dinâmicas{" "}
              <span className="mono">[id]</span> e <span className="mono">params</span>{" "}
              com <span className="mono">await</span>. Os arquivos cujo nome já é a
              instrução — <span className="mono">layout</span> aninhado,{" "}
              <span className="mono">loading</span>, <span className="mono">error</span>{" "}
              e <span className="mono">not-found</span>. Route groups, catch-all, e
              navegação com <span className="mono">Link</span>,{" "}
              <span className="mono">usePathname</span> e{" "}
              <span className="mono">useRouter</span>.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_02}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_02}/desafio.html`}>
                🎯 Desafio técnico
              </a>
              <a className="mat" href={`${AULA_02}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_02}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
              <a className="mat" href={`${AULA_02}/roteiro-aula.html`}>
                🛠️ Roteiro da aula
              </a>
              <a className="mat" href={`${PROJETO}/brief.html`}>
                💼 Briefing do projeto
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">03</div>
          <div className="body">
            <h3>
              A página que responde{" "}
              <span
                className="mono"
                style={{ fontSize: 13, color: "var(--text-3)" }}
              >
                · 26/08
              </span>
            </h3>
            <p>
              Primeiro a dívida da aula 02: por que alguns arquivos levam{" "}
              <span className="mono">&quot;use client&quot;</span> na primeira
              linha e outros não — e por que a fronteira fica na folha, não na
              raiz. Depois o assunto do dia:{" "}
              <span className="mono">useState</span>, a memória do componente.
              Por que mudar uma variável não muda a tela; o campo controlado;{" "}
              <strong>estado derivado</strong> — a regra que evita metade dos
              bugs; estado que é lista, e onde o estado mora. Fecha com o
              projeto se dividindo em <strong>quatro frentes</strong>, uma por
              integrante da equipe.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_03}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_03}/exercicios.html`}>
                🧪 Exercícios em aula
              </a>
              <a className="mat" href={`${AULA_03}/desafio.html`}>
                🎯 Desafio técnico
              </a>
              <a className="mat" href={`${AULA_03}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_03}/modelo-resposta.html`}>
                👁️ Prévia da resposta
              </a>
              <a className="mat" href={`${PROJETO}/brief.html`}>
                💼 Briefing do projeto
              </a>
            </div>
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
              <span className="soon-tag">em breve</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
