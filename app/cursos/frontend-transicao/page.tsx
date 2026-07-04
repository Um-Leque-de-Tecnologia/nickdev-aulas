import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Frontend — Transição de Carreira · NickDev",
  description:
    "Curso de frontend para transição de carreira: HTML, CSS, responsividade e deploy.",
};

const AULA_01 = "/cursos/frontend-transicao/aula-01-abertura";

export default function FrontendTransicao() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <div className="eyebrow">Curso · pós-graduação</div>
      <h1>
        Frontend — <span className="grad-text">Transição de Carreira</span>
      </h1>
      <p className="lead">
        Do primeiro <span className="mono">&lt;h1&gt;</span> ao seu site
        publicado na internet. A gente aprende fazendo, com joguinhos, projetos e
        muita cor — pensado pra quem está entrando na tech agora.
      </p>
      <div className="brand-rule" />

      <div className="section-label">Aulas</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">01</div>
          <div className="body">
            <h3>Abertura: seu primeiro site</h3>
            <p>
              Como a web funciona, HTML e CSS na prática, responsividade e deploy
              na Vercel. A aula inaugural, do zero ao site no ar.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_01}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_01}/guia-html-css.html`}>
                📘 Guia HTML &amp; CSS
              </a>
            </div>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">02</div>
          <div className="body">
            <h3>JavaScript: a página ganha vida</h3>
            <p>
              Variáveis, eventos e interatividade — fazendo a página reagir a
              quem usa.
            </p>
            <div className="mats">
              <span className="soon-tag">em breve</span>
            </div>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">03</div>
          <div className="body">
            <h3>Do design ao código</h3>
            <p>Do Figma pra tela: transformando um layout em uma página de verdade.</p>
            <div className="mats">
              <span className="soon-tag">em breve</span>
            </div>
          </div>
        </div>
      </div>

      <Footer withHome />
    </>
  );
}
