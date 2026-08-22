import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Next.js + IA · NickDev",
  description:
    "Curso de Next.js com IA em 8 aulas, no formato de simulação de trabalho: sprints, tickets, pull requests e code review. Da correção de bugs à feature de IA publicada em produção.",
};

/* -------------------------------------------------------------------------
   Cada aula é um "ticket" de sprint. Os campos abaixo seguem o vocabulário
   de time de produto — é isso que diferencia este curso dos outros.
   ------------------------------------------------------------------------- */
type Aula = {
  n: string;
  titulo: string;
  objetivo?: React.ReactNode;
  conceitos: React.ReactNode;
  ticket: React.ReactNode;
  copiloto: React.ReactNode;
  noProduto?: React.ReactNode;
  entrega: React.ReactNode;
};

type Sprint = {
  n: string;
  nome: string;
  subtitulo: string;
  resumo: React.ReactNode;
  aulas: Aula[];
};

const SPRINTS: Sprint[] = [
  {
    n: "0",
    nome: "Onboarding",
    subtitulo: "Seu primeiro dia na empresa",
    resumo: (
      <>
        Conhecer o produto, o fluxo de trabalho e o mental model do Next — e
        fechar o dia com código em produção.
      </>
    ),
    aulas: [
      {
        n: "01",
        titulo: "Onboarding, primeiro deploy e o mental model do Next",
        objetivo: (
          <>
            Entrar no time, rodar o projeto, fazer o primeiro merge e dominar o
            conceito que mais confunde: <strong>Server vs Client</strong>.
          </>
        ),
        conceitos: (
          <>
            Como o Next.js funciona por baixo, App Router e estrutura de pastas,
            rotas por arquivo, variáveis de ambiente e o fluxo Git — branch, PR,
            merge e deploy na Vercel. Server e Client Components, e a diretiva{" "}
            <span className="mono">&quot;use client&quot;</span>.
          </>
        ),
        ticket: (
          <>
            Bug de aquecimento (ajuste simples) <strong>+</strong> um bug de
            interatividade num componente que precisa ser client.
          </>
        ),
        copiloto: (
          <>
            Setup do <strong>GitHub Copilot</strong> e das{" "}
            <em>custom instructions</em> do repositório. Usar o Copilot Chat
            para entender um codebase recém-clonado e traduzir erros —{" "}
            <strong>validando cada resposta</strong>.
          </>
        ),
        entrega: (
          <>
            Primeiro Pull Request mergeado e publicado, com a decisão
            server/client justificada na descrição do PR.
          </>
        ),
      },
    ],
  },
  {
    n: "1",
    nome: "Estabilizando o produto",
    subtitulo: "Corrigindo bugs, dominando o básico",
    resumo: <>Robustez, rotas e formulários — o feijão com arroz bem feito.</>,
    aulas: [
      {
        n: "02",
        titulo: "Buscando dados, rotas e páginas de detalhe",
        conceitos: (
          <>
            Data fetching no servidor e componentes assíncronos. Arquivos
            especiais — <span className="mono">loading.tsx</span>,{" "}
            <span className="mono">error.tsx</span>,{" "}
            <span className="mono">not-found.tsx</span>. Rotas dinâmicas com{" "}
            <span className="mono">[id]</span>, parâmetros e metadados dinâmicos
            para SEO.
          </>
        ),
        ticket: (
          <>
            Uma listagem quebra sem tratamento e a página de detalhe está
            incompleta — corrigir os dois.
          </>
        ),
        copiloto: (
          <>
            Ler o stack trace junto com o Copilot Chat, e gerar o boilerplate da
            página de detalhe pelo autocomplete — revisando criticamente o que
            veio.
          </>
        ),
        entrega: (
          <>
            Listagem robusta, com estados de carregamento e erro, e página de
            detalhe com SEO.
          </>
        ),
      },
      {
        n: "03",
        titulo: "Formulários e Server Actions",
        conceitos: (
          <>
            Formulários no App Router, Server Actions, validação de dados e
            feedback de UX — carregando, erro e sucesso.
          </>
        ),
        ticket: (
          <>
            O formulário de inscrição está bugado e não valida — corrigir,
            validar e dar retorno ao usuário.
          </>
        ),
        copiloto: (
          <>
            O Copilot rascunha as regras de validação; você <strong>audita</strong> e
            ajusta ao caso real do produto.
          </>
        ),
        entrega: <>Formulário funcional, validado e com boa UX.</>,
      },
    ],
  },
  {
    n: "2",
    nome: "Construindo o novo",
    subtitulo: "Novas features, arquitetura e IA no produto",
    resumo: <>Onde você deixa de consertar e vira protagonista.</>,
    aulas: [
      {
        n: "04",
        titulo: "Arquitetura, débito técnico e a primeira feature inteligente",
        conceitos: (
          <>
            Organização por features, separação de responsabilidades,
            componentes reutilizáveis e design tokens. Estado no client e{" "}
            <span className="mono">searchParams</span>. Busca e filtros.
          </>
        ),
        ticket: (
          <>
            Refatorar uma feature bagunçada (débito técnico) e entregar a busca
            da listagem, evoluindo para busca inteligente.
          </>
        ),
        copiloto: (
          <>
            Copilot como assistente de refatoração, e o <strong>Copilot Code
            Review</strong> como primeiro revisor do PR — você decide o que
            aceitar.
          </>
        ),
        noProduto: (
          <>
            <strong>Busca semântica</strong> — encontrar por significado, não só
            por palavra exata.
          </>
        ),
        entrega: <>Feature reorganizada e busca inteligente funcionando.</>,
      },
      {
        n: "05",
        titulo: "Área logada: route handlers e autenticação",
        conceitos: (
          <>
            Route handlers — a API dentro do Next. Autenticação básica, rotas
            protegidas e sessão do usuário.
          </>
        ),
        ticket: (
          <>
            Nova feature: criar a área do participante, protegida por login.
          </>
        ),
        copiloto: (
          <>
            Copiloto no fluxo de autenticação, com atenção redobrada à{" "}
            <strong>segurança da chave e da sessão</strong>.
          </>
        ),
        entrega: <>Fluxo de login e área logada funcionando.</>,
      },
      {
        n: "06",
        titulo: "A feature-carro-chefe de IA",
        conceitos: (
          <>
            Integrar uma LLM a uma feature real — assistente ou geração de
            descrição de evento. Streaming da resposta, tratamento de erro e de
            custo, e <strong>prompt versionado como código</strong>.
          </>
        ),
        ticket: (
          <>
            Feature de IA priorizada no backlog — implementar de ponta a ponta.
          </>
        ),
        copiloto: (
          <>
            Aqui a IA muda de papel: deixa de ser só ferramenta de quem
            desenvolve e passa a ser <strong>o produto</strong>.
          </>
        ),
        noProduto: (
          <>
            A feature de IA principal, construída e publicada por você — com
            streaming, custo medido e falha tratada.
          </>
        ),
        entrega: <>Feature com IA publicada e funcional.</>,
      },
    ],
  },
  {
    n: "3",
    nome: "Qualidade e entrega",
    subtitulo: "Deixando pronto para produção",
    resumo: <>O que separa um projeto de curso de um projeto de portfólio.</>,
    aulas: [
      {
        n: "07",
        titulo: "Pronto para produção: performance, acessibilidade e testes",
        conceitos: (
          <>
            <span className="mono">next/image</span>, otimização de fontes, code
            splitting, Core Web Vitals e cache/ISR — <strong>medindo antes e
            depois</strong>. Fundamentos de acessibilidade. Testes que pegam bug,
            com Testing Library e Playwright. Code review entre pares.
          </>
        ),
        ticket: (
          <>
            &ldquo;O app está lento e sem testes&rdquo; — otimizar com métrica,
            cobrir o fluxo crítico e revisar o PR de um colega.
          </>
        ),
        copiloto: (
          <>
            O Copilot sugere otimizações e gera o 1º rascunho dos testes; você{" "}
            <strong>mede, valida e faz o review humano</strong>. E você faz o
            review humano do PR de um colega — depois do Copilot Code Review.
          </>
        ),
        entrega: (
          <>
            Relatório de performance antes/depois, teste passando e um code
            review feito.
          </>
        ),
      },
      {
        n: "08",
        titulo: "Demo Day (Sprint Review)",
        objetivo: <>Apresentar, defender e celebrar o que foi construído.</>,
        conceitos: (
          <>
            Cada pessoa apresenta suas entregas — bugs, features e as features
            de IA —, defende as decisões técnicas e recebe review ao vivo.
            Retrospectiva, organização do portfólio e próximos passos de
            carreira.
          </>
        ),
        ticket: <>Fechar todos os cards e preparar a apresentação final.</>,
        copiloto: (
          <>
            O Copilot ajuda a preparar a narrativa da demo — mas quem defende as
            decisões é você.
          </>
        ),
        entrega: (
          <>
            Apresentação, repositório final e portfólio pronto para entrevistas.
          </>
        ),
      },
    ],
  },
];

/* ------------------------------------------------------------------ */

function Campo({
  rotulo,
  cor,
  children,
}: {
  rotulo: string;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <p style={{ margin: "10px 0 0", fontSize: 14.5, maxWidth: "70ch" }}>
      <span
        className="mono"
        style={{
          color: cor,
          fontSize: 11.5,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginRight: 8,
        }}
      >
        {rotulo}
      </span>
      <span style={{ color: "var(--text-2)" }}>{children}</span>
    </p>
  );
}

function CardDeAula({ a }: { a: Aula }) {
  return (
    <div className="lesson soon">
      <div className="idx">{a.n}</div>
      <div className="body">
        <h3>{a.titulo}</h3>

        {a.objetivo && (
          <p style={{ marginBottom: 4 }}>
            <strong>Objetivo:</strong> {a.objetivo}
          </p>
        )}

        <Campo rotulo="conceitos" cor="var(--text-3)">
          {a.conceitos}
        </Campo>
        <Campo rotulo="🎫 ticket" cor="var(--pink-light)">
          {a.ticket}
        </Campo>
        <Campo rotulo="🤖 ia copiloto" cor="var(--purple-light)">
          {a.copiloto}
        </Campo>
        {a.noProduto && (
          <Campo rotulo="✨ ia no produto" cor="var(--magenta)">
            {a.noProduto}
          </Campo>
        )}
        <Campo rotulo="✅ entrega" cor="var(--text-3)">
          {a.entrega}
        </Campo>

        <span className="soon-tag">em breve</span>
      </div>
    </div>
  );
}

export default function NextjsIA() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <div className="eyebrow">Curso · 8 aulas · 4 sprints</div>
      <h1>
        Next.js <span className="grad-text">+ IA</span>
      </h1>
      <p className="lead">
        Este curso não simula uma sala de aula — simula <strong>um
        emprego</strong>. Você entra num time, recebe um codebase que já existe,
        pega tickets do backlog e entrega por Pull Request. Em oito aulas, sai
        de &ldquo;primeiro dia na empresa&rdquo; até uma{" "}
        <strong>feature de IA publicada em produção</strong> e defendida num
        Demo Day.
      </p>
      <div className="brand-rule" />

      <div className="section-label">Como funciona</div>

      <div className="card-grid">
        <div className="card">
          <span className="num">🎫</span>
          <h3>Você trabalha por ticket</h3>
          <p>
            Nada de exercício solto. Cada aula abre um card do backlog — um bug,
            um débito técnico, uma feature priorizada — e fecha com o PR
            mergeado e publicado.
          </p>
        </div>

        <div className="card">
          <span className="num">🔀</span>
          <h3>O fluxo é o de um time</h3>
          <p>
            Branch, Pull Request, descrição que justifica a decisão técnica,
            code review entre pares e deploy. O mesmo ritual que você vai
            encontrar no primeiro emprego.
          </p>
        </div>

        <div className="card">
          <span className="num">🤖</span>
          <h3>A IA aparece em dois papéis</h3>
          <p>
            Como <strong>copiloto</strong> — o GitHub Copilot integrado ao seu
            editor e aos PRs, sempre auditado. E como <strong>produto</strong>,
            virando a feature que o usuário final usa. São duas coisas
            diferentes, e o curso trata cada uma no seu lugar.
          </p>
        </div>
      </div>

      <div className="section-label">Os dois papéis da IA</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">🤖</div>
          <div className="body">
            <h3>IA copiloto — o GitHub Copilot no seu fluxo</h3>
            <p>
              Entender um codebase que você acabou de clonar, traduzir um stack
              trace, rascunhar regras de validação, sugerir uma refatoração e
              gerar o primeiro esboço de um teste. No PR, o{" "}
              <strong>Copilot Code Review</strong> passa antes do humano — e as{" "}
              <em>custom instructions</em> e os <em>prompt files</em> ficam{" "}
              <strong>versionados no repositório</strong>, como qualquer outro
              código do time.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>A regra do curso é uma só:</strong> tudo que o Copilot
              produz passa por auditoria sua. Código que você não sabe explicar
              não é entregue — nem aqui, nem numa entrevista.
            </p>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">✨</div>
          <div className="body">
            <h3>IA no produto — a feature que o usuário usa</h3>
            <p>
              Aqui a IA deixa de ser ferramenta e vira funcionalidade:{" "}
              <strong>busca semântica</strong> na aula 4 e a{" "}
              <strong>feature-carro-chefe</strong> na aula 6, com streaming da
              resposta, tratamento de erro e custo medido.
            </p>
            <p style={{ marginBottom: 0 }}>
              É a parte que quase nenhum curso de front-end cobre — e a que mais
              chama atenção num portfólio hoje.
            </p>
          </div>
        </div>
      </div>

      {SPRINTS.map((s) => (
        <section key={s.n}>
          <div className="section-label">
            Sprint {s.n} · {s.nome}
          </div>

          <p
            className="lead"
            style={{ marginTop: -6, marginBottom: 18, fontSize: 16 }}
          >
            <strong>{s.subtitulo}.</strong> {s.resumo}
          </p>

          <div className="lessons">
            {s.aulas.map((a) => (
              <CardDeAula a={a} key={a.n} />
            ))}
          </div>
        </section>
      ))}

      <Footer withHome />
    </>
  );
}
