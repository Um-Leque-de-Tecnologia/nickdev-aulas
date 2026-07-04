import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

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

        <div className="card soon">
          <span className="num">02</span>
          <h3>React Native</h3>
          <p>
            Apps mobile do zero com React Native — componentes, navegação e
            publicação.
          </p>
          <div className="meta">em breve</div>
        </div>

        <div className="card soon">
          <span className="num">03</span>
          <h3>Projeto de Extensão</h3>
          <p>Levar tecnologia pra comunidade — da ideia à entrega, na prática.</p>
          <div className="meta">em breve</div>
        </div>
      </div>

      <Footer />
    </>
  );
}
