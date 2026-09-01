import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { GUIAS, hrefDoGuia } from "@/lib/guias";
import { COURSES } from "@/lib/cursos";

/* -------------------------------------------------------------------------
   O texto dos cards mora aqui, e não em `lib/cursos.ts`, pelo mesmo motivo de
   sempre: aqui ele é JSX rico (`<span className="mono">`, `<strong>`), e virar
   string no catálogo empobreceria a home.

   Quem APARECE, não mora aqui. Isso saiu para o `access` de `lib/cursos.ts`:
   a listagem é `COURSES` filtrada por `access === "public"`. Antes os seis
   cards estavam escritos à mão nesta página, e o curso restrito aparecia junto
   — não por decisão, mas porque a home não tinha como saber. Agora curso pago
   novo fica fora desta lista sozinho, e o dia em que um restrito virar público
   é uma palavra trocada no catálogo, não um card copiado para cá.

   O número do card é calculado pela posição na lista filtrada, senão remover um
   curso deixaria um buraco na contagem (…04, 05, 07).
   ------------------------------------------------------------------------- */
type Cartao = {
  titulo: string;
  texto: React.ReactNode;
  meta: string;
};

const CARTOES: Record<string, Cartao> = {
  "frontend-transicao": {
    titulo: "Frontend — Transição de Carreira",
    texto: (
      <>
        Do primeiro <span className="mono">&lt;h1&gt;</span> ao seu site no ar.
        HTML, CSS, responsividade e deploy, pra quem está migrando pra tech.
      </>
    ),
    meta: "pós-graduação · em andamento",
  },
  "orientacao-objetos-java": {
    titulo: "Orientação a Objetos — Java",
    texto: (
      <>
        Do ecossistema Java aos pilares de OO, coleções, exceções e lambdas, até
        um projeto prático em equipe com persistência e arquitetura em camadas.
      </>
    ),
    meta: "18 aulas · em andamento",
  },
  "introducao-spring-boot": {
    titulo: "Introdução ao Spring Boot",
    texto: (
      <>
        Do Java puro à API REST em produção: injeção de dependência, JPA,
        segurança com JWT, testes, Docker e deploy.
      </>
    ),
    meta: "18 aulas · em andamento",
  },
  "introducao-nextjs": {
    titulo: "Introdução ao Next.js",
    texto: (
      <>
        Do primeiro componente ao deploy: App Router, Server Components, Server
        Actions, autenticação e CI/CD. Começa do zero, sem precisar saber React.
      </>
    ),
    meta: "19 aulas · em andamento",
  },
  "frontend-avancado": {
    titulo: "Frontend Avançado",
    texto: (
      <>
        A mesma aplicação, feita duas vezes: em Angular 22 com signals e
        zoneless, depois em Next.js com App Router. Precedidas de uma revisão
        firme de HTML, CSS, JavaScript e TypeScript.
      </>
    ),
    meta: "16 aulas de 4h · em breve",
  },
  "introducao-github": {
    titulo: "Introdução ao GitHub",
    texto: (
      <>
        O ciclo de vida do desenvolvimento na ordem em que ele acontece: issue,
        branch, <span className="mono">commit</span>, Pull Request, code review,
        CI com Actions e release. Serve para qualquer linguagem.
      </>
    ),
    meta: "12 aulas · material publicado",
  },
  /*
    Fica no mapa mesmo sem aparecer hoje: este objeto é a CÓPIA de cada curso,
    e a cópia não deixa de existir porque o curso saiu da vitrine. Se um dia o
    `nextjs-ia` voltar a ser público, é `access: "public"` no catálogo e o card
    reaparece pronto — sem ninguém reescrever o texto.
  */
  "nextjs-ia": {
    titulo: "Next.js + IA",
    texto: (
      <>
        Oito sprints simulando um emprego: você pega tickets, abre Pull Request
        e publica uma feature de IA em produção, sobre uma API real.
      </>
    ),
    meta: "8 aulas de 2h30 · pago",
  },
};

const CURSOS_NA_VITRINE = COURSES.filter((curso) => curso.access === "public");

export default function Home() {
  return (
    <>
      <SiteHeader />

      <div className="eyebrow">Materiais &amp; slides de aula</div>
      <h1>
        Tecnologia aberta em <span className="grad-text">leque</span>.<br />
        <span className="serif">Para aprender, ensinar e criar.</span>
      </h1>
      <p className="lead">
        Aqui ficam os slides, guias e recursos das aulas que eu ministro.
        Escolha um curso pra começar.
      </p>
      <div className="brand-rule" />

      <div className="section-label" id="cursos">
        Cursos
      </div>
      <div className="card-grid">
        {CURSOS_NA_VITRINE.map((curso, i) => {
          const cartao = CARTOES[curso.slug];
          return (
            <Link className="card" href={curso.href} key={curso.slug}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              {/*
                Sem cópia escrita, o card cai para o nome e o resumo do
                catálogo. É de propósito: curso público novo em lib/cursos.ts
                aparece na home com o texto que já existe, em vez de sumir em
                silêncio até alguém lembrar de vir escrever o JSX aqui.
              */}
              <h3>{cartao?.titulo ?? curso.name}</h3>
              <p>{cartao?.texto ?? curso.summary}</p>
              {cartao && <div className="meta">{cartao.meta}</div>}
            </Link>
          );
        })}
      </div>

      {/*
        Os guias não pertencem a curso nenhum — são a documentação das
        tecnologias, e vários cursos apontam para o mesmo guia. Por isso vivem
        aqui e não dentro da pasta de uma aula, como era antes.
      */}
      <div className="section-label" id="guias">
        Guias de tecnologia
      </div>
      <p style={{ color: "var(--text-2)", fontSize: 15, marginBottom: 18 }}>
        Documentação de consulta, independente de curso. Cada uma reúne o que
        antes estava espalhado em várias aulas.
      </p>

      <div className="guia-grid">
        {GUIAS.map((g) => (
          <a className="guia" href={hrefDoGuia(g.slug)} key={g.slug}>
            <span className="nome">
              <span className="e" aria-hidden="true">
                {g.emoji}
              </span>
              {g.nome}
            </span>
            <p>{g.resumo}</p>
          </a>
        ))}
      </div>

      <Footer />
    </>
  );
}
