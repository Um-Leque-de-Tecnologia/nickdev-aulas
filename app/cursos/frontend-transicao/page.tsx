import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import { materialDaAula } from "@/lib/cdn";

export const metadata: Metadata = {
  title: "Frontend — Transição de Carreira · NickDev",
  description:
    "Curso de frontend para transição de carreira: HTML, CSS, JavaScript, design, React e Next.js — do primeiro site ao projeto publicado.",
};

const AULA_01 = materialDaAula("frontend-transicao", "aula-01-abertura");
const AULA_02 = materialDaAula("frontend-transicao", "aula-02-javascript");
const AULA_03 = materialDaAula("frontend-transicao", "aula-03-design-codigo");
const AULA_04 = materialDaAula("frontend-transicao", "aula-04-nextjs");
const REPO_PROJETO = "https://github.com/Um-Leque-de-Tecnologia/leque-de-vagas";

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
      <BadgesDeTecnologia tecnologias={["html", "css", "javascript", "nextjs"]} />
      <div className="brand-rule" />

      <div className="acoes">
        <a
          className="glow-btn"
          href="https://www.youtube.com/playlist?list=PLIHR33oCqAMs"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Aulas gravadas
        </a>
      </div>

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
              <a className="mat" href={`${AULA_01}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_01}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_01}/modelo-sobre-mim.html`}>
                🧑‍💻 Modelo (exemplo)
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">02</div>
          <div className="body">
            <h3>JavaScript: a página ganha vida</h3>
            <p>
              Variáveis, funções, arrays, condicionais, DOM e eventos — 8 horas
              fazendo a página reagir a quem usa, com editores ao vivo e joguinhos.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_02}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_02}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_02}/codigos-desafios.html`}>
                🧩 Códigos dos desafios
              </a>
              <a className="mat" href={`${AULA_02}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">03</div>
          <div className="body">
            <h3>Do design ao código</h3>
            <p>
              Do Figma pra tela: ler um design e reconstruí-lo com fidelidade —
              tokens, Flexbox, Grid e responsividade, num projeto de 8 horas.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_03}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_03}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_03}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_03}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">04</div>
          <div className="body">
            <h3>Introdução ao Next.js 16</h3>
            <p>
              Do site à aplicação: React, App Router, Componentes de Servidor e
              de Cliente, <span className="mono">useState</span> e formulários
              com validação — 8 horas de frontend construindo o{" "}
              <strong>Leque de Vagas</strong>, o projeto que acompanha todas as
              próximas aulas.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_04}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_04}/roteiro-projeto.html`}>
                🛠️ Roteiro do projeto
              </a>
              <a className="mat" href={`${AULA_04}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_04}/codigos-desafio.html`}>
                🧩 Código do projeto
              </a>
              <a
                className="mat"
                href={REPO_PROJETO}
                target="_blank"
                rel="noopener noreferrer"
              >
                💻 Repositório no GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer withHome />
    </>
  );
}
