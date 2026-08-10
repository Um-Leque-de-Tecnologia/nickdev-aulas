import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Orientação a Objetos com Java · NickDev",
  description:
    "Curso de graduação de Orientação a Objetos com Java: do ecossistema Java e primeiro programa até coleções, exceções, generics, lambdas, persistência, arquitetura em camadas e um projeto prático em equipe.",
};

const AULA_01 = "/cursos/orientacao-objetos-java/aula-01-primeiros-passos";

export default function OrientacaoObjetosJava() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <div className="eyebrow">Curso · graduação</div>
      <h1>
        Orientação a Objetos <span className="grad-text">com Java</span>
      </h1>
      <p className="lead">
        Disciplina de graduação na <strong>UNIESP</strong>, semestre{" "}
        <span className="mono">2026.2</span>, às terças-feiras das{" "}
        <span className="mono">19h às 21h30</span>. Do paradigma orientado a
        objetos aos pilares clássicos, passando por coleções, exceções,
        generics, lambdas/streams e persistência, até uma arquitetura em
        camadas com testes — tudo aplicado num projeto prático em equipe.
        Duas unidades: <strong>Unidade 1 — Fundamentos de OO</strong>{" "}
        (encerra com a <span className="mono">AV1</span>, prova escrita/prática)
        e <strong>Unidade 2 — OO aplicada</strong> (encerra com a{" "}
        <span className="mono">AV2</span>, projeto prático em equipe).
      </p>
      <div className="brand-rule" />

      <div className="section-label">Aulas</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">01</div>
          <div className="body">
            <h3>Primeiros passos: paradigma OO e ecossistema Java</h3>
            <p>
              Plano de ensino e critérios de avaliação. Paradigma estruturado
              × orientado a objetos. Ecossistema Java (JDK, JVM, JRE,
              bytecode). Setup do ambiente com JDK 21 + IntelliJ IDEA
              Community. Primeiro programa: Hello World, compilação e
              execução pelo terminal.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_01}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_01}/guia-ecossistema-java.html`}>
                📘 Guia do ecossistema Java
              </a>
              <a className="mat" href={`${AULA_01}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_01}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_01}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
            </div>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">02</div>
          <div className="body">
            <h3>Fundamentos da linguagem</h3>
            <p>
              Tipos primitivos, variáveis, operadores e casting. Estruturas
              de decisão e repetição. Arrays. Entrada de dados com{" "}
              <span className="mono">Scanner</span>. Entrega: Lista 1.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">03</div>
          <div className="body">
            <h3>Classes e objetos</h3>
            <p>
              Abstração: classe × objeto. Atributos e métodos. Instanciação
              com <span className="mono">new</span>, referências e{" "}
              <span className="mono">null</span>. Parâmetros e retorno.
              Modelagem de um domínio simples.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">04</div>
          <div className="body">
            <h3>Encapsulamento e construtores</h3>
            <p>
              Modificadores de acesso (public/private/protected), getters e
              setters, <span className="mono">this</span>, construtores e
              sobrecarga, membros <span className="mono">static</span> e{" "}
              <span className="mono">final</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">05</div>
          <div className="body">
            <h3>Relacionamentos entre objetos</h3>
            <p>
              Associação, agregação e composição. Coleção de objetos com{" "}
              <span className="mono">ArrayList</span>. Marco: apresentação do
              projeto da disciplina e formação das equipes.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">06</div>
          <div className="body">
            <h3>Herança</h3>
            <p>
              Herança (<span className="mono">extends</span>,{" "}
              <span className="mono">super</span>), classe{" "}
              <span className="mono">Object</span>, sobrescrita de{" "}
              <span className="mono">toString()</span>/
              <span className="mono">equals()</span>/
              <span className="mono">hashCode()</span>,{" "}
              <span className="mono">final</span> em classes e métodos.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">07</div>
          <div className="body">
            <h3>Polimorfismo</h3>
            <p>
              Sobrescrita × sobrecarga, upcasting/downcasting,{" "}
              <span className="mono">instanceof</span>, classes e métodos
              abstratos, vinculação dinâmica.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">08</div>
          <div className="body">
            <h3>Interfaces e revisão</h3>
            <p>
              Interfaces (contratos, implementação múltipla, default
              methods), interface × classe abstrata, revisão geral para a
              AV1.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">09</div>
          <div className="body">
            <h3>AV1 corrigida e tratamento de exceções</h3>
            <p>
              Correção comentada da AV1. Tratamento de exceções
              (try/catch/finally, throw/throws, checked × unchecked,
              exceções personalizadas, try-with-resources).
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">10</div>
          <div className="body">
            <h3>Collections Framework</h3>
            <p>
              List, Set, Map e Queue, for-each,{" "}
              <span className="mono">Comparable</span>/
              <span className="mono">Comparator</span>. Entrega: proposta do
              projeto.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">11</div>
          <div className="body">
            <h3>Generics, wrappers e enums</h3>
            <p>
              Generics (classes/métodos genéricos, wildcards), wrappers e
              autoboxing, <span className="mono">enum</span> e{" "}
              <span className="mono">record</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">12</div>
          <div className="body">
            <h3>Lambdas e Stream API</h3>
            <p>
              Interfaces funcionais, expressões lambda, method references,
              Stream API (filter/map/collect),{" "}
              <span className="mono">Optional</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">13</div>
          <div className="body">
            <h3>Persistência em arquivos</h3>
            <p>
              Persistência em arquivos (File, BufferedReader/
              BufferedWriter, serialização). Checkpoint 1: modelo de domínio
              funcionando.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">14</div>
          <div className="body">
            <h3>Arquitetura em camadas</h3>
            <p>
              Arquitetura em camadas (MVC, DAO), separação model/service/
              repository, introdução ao JDBC com banco embarcado (H2/
              SQLite).
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">15</div>
          <div className="body">
            <h3>Padrões de projeto e testes</h3>
            <p>
              Singleton, Factory, Strategy; SOLID na prática; testes
              unitários com JUnit 5. Checkpoint 2: mentoria por equipe.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">16</div>
          <div className="body">
            <h3>Apresentações dos projetos — 1ª rodada</h3>
            <p>Primeira rodada de apresentações dos projetos das equipes.</p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">17</div>
          <div className="body">
            <h3>Apresentações dos projetos — 2ª rodada</h3>
            <p>
              Segunda rodada de apresentações. Entrega final do código e da
              documentação.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">18</div>
          <div className="body">
            <h3>Encerramento do semestre</h3>
            <p>Notas, feedback individual e retrospectiva do semestre.</p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>
      </div>

      <Footer withHome />
    </>
  );
}
