import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { GUIAS, hrefDoGuia } from "@/lib/guias";

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

      <div className="section-label">Cursos</div>
      <div className="card-grid">
        <Link className="card" href="/cursos/frontend-transicao">
          <span className="num">01</span>
          <h3>Frontend — Transição de Carreira</h3>
          <p>
            Do primeiro <span className="mono">&lt;h1&gt;</span> ao seu site no
            ar. HTML, CSS, responsividade e deploy, pra quem está migrando pra
            tech.
          </p>
          <div className="meta">pós-graduação · em andamento</div>
        </Link>

        <Link className="card" href="/cursos/orientacao-objetos-java">
          <span className="num">02</span>
          <h3>Orientação a Objetos — Java</h3>
          <p>
            Do ecossistema Java aos pilares de OO, coleções, exceções e
            lambdas, até um projeto prático em equipe com persistência e
            arquitetura em camadas.
          </p>
          <div className="meta">18 aulas · em andamento</div>
        </Link>

        <Link className="card" href="/cursos/introducao-spring-boot">
          <span className="num">03</span>
          <h3>Introdução ao Spring Boot</h3>
          <p>
            Do Java puro à API REST em produção: injeção de dependência, JPA,
            segurança com JWT, testes, Docker e deploy.
          </p>
          <div className="meta">18 aulas · em andamento</div>
        </Link>

        <Link className="card" href="/cursos/introducao-nextjs">
          <span className="num">04</span>
          <h3>Introdução ao Next.js</h3>
          <p>
            Do primeiro componente ao deploy: App Router, Server Components,
            Server Actions, autenticação e CI/CD. Começa do zero, sem precisar
            saber React.
          </p>
          <div className="meta">19 aulas · em andamento</div>
        </Link>

        <Link className="card" href="/cursos/frontend-avancado">
          <span className="num">05</span>
          <h3>Frontend Avançado</h3>
          <p>
            A mesma aplicação, feita duas vezes: em Angular 22 com signals e
            zoneless, depois em Next.js com App Router. Precedidas de uma
            revisão firme de HTML, CSS, JavaScript e TypeScript.
          </p>
          <div className="meta">16 aulas de 4h · em breve</div>
        </Link>

        {/*
          Next.js + IA é um curso pago e não entra nesta listagem — ele vive em
          /cursos/nextjs-ia e passará para uma área logada. Ao criar a área,
          mova o link para lá em vez de reintroduzir o card aqui.
        */}
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
