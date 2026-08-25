import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";

export const metadata: Metadata = {
  title: "Next.js + IA · NickDev",
  description:
    "Curso de Next.js com IA em 8 aulas, no formato de simulação de trabalho: sprints, tickets, pull requests e code review. Construindo o LequePlay sobre uma API real, da correção de bugs à feature de IA em produção.",
};

/* -------------------------------------------------------------------------
   Cada aula é a cerimônia de uma sprint; o ticket é o trabalho da semana.
   Os campos seguem o vocabulário de time de produto — é isso que separa
   este curso dos outros.
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

const COMO_FUNCIONA = [
  {
    emoji: "🎫",
    titulo: "Trabalho por ticket",
    desc: "Card do backlog entra, PR mergeado sai.",
  },
  {
    emoji: "🗓️",
    titulo: "A aula é a cerimônia",
    desc: "O código acontece na semana, com acompanhamento.",
  },
  {
    emoji: "🔌",
    titulo: "O backend já existe",
    desc: "Você é o front: consome, protege, desconfia.",
  },
  {
    emoji: "🤖",
    titulo: "IA em dois papéis",
    desc: "Copiloto de quem desenvolve, e feature do produto.",
  },
];

const SPRINTS: Sprint[] = [
  {
    n: "0",
    nome: "Onboarding",
    subtitulo: "Seu primeiro dia na empresa",
    resumo: (
      <>
        Conhecer o produto, a API que o time já mantém e o mental model do Next
        — e fechar a semana com código em produção.
      </>
    ),
    aulas: [
      {
        n: "01",
        titulo: "Onboarding, primeiro deploy e o mental model do Next",
        objetivo: (
          <>
            Entrar no time, subir o front contra a API, fazer o primeiro merge e
            dominar o conceito que mais confunde:{" "}
            <strong>Server vs Client</strong>.
          </>
        ),
        conceitos: (
          <>
            App Router e estrutura de pastas, rota por arquivo, variáveis de
            ambiente e o fluxo Git — branch, PR, merge e deploy. Leitura da
            documentação da API. Server e Client Components, e a diretiva{" "}
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
            <em>custom instructions</em> do repositório. Copilot Chat para
            entender um codebase recém-clonado e a documentação da API —{" "}
            <strong>validando cada resposta</strong>.
          </>
        ),
        entrega: (
          <>
            Primeiro Pull Request mergeado e publicado, com a decisão
            server/client justificada na descrição.
          </>
        ),
      },
    ],
  },
  {
    n: "1",
    nome: "O catálogo",
    subtitulo: "Consumindo a API e estabilizando o produto",
    resumo: (
      <>
        O front deixa de quebrar quando a API responde diferente do esperado.
      </>
    ),
    aulas: [
      {
        n: "02",
        titulo: "Consumindo a API: catálogo, detalhe e o BFF",
        conceitos: (
          <>
            Data fetching no servidor e componentes assíncronos.{" "}
            <span className="mono">loading.tsx</span>,{" "}
            <span className="mono">error.tsx</span>,{" "}
            <span className="mono">not-found.tsx</span>. Rota dinâmica{" "}
            <span className="mono">[slug]</span> e metadata dinâmica.{" "}
            <strong>Route Handler como BFF</strong> — escondendo a URL e a chave
            da API do navegador.
          </>
        ),
        ticket: (
          <>
            A listagem quebra quando a API devolve um campo nulo, e a página da
            mídia está incompleta — corrigir os dois.
          </>
        ),
        copiloto: (
          <>
            Ler o stack trace com o Copilot Chat e gerar o cliente da API a
            partir da documentação — <strong>auditando os tipos</strong>, que é
            onde ele mais erra.
          </>
        ),
        entrega: (
          <>
            Catálogo robusto, com carregamento e erro tratados, e página de
            mídia com SEO.
          </>
        ),
      },
      {
        n: "03",
        titulo: "Séries: rotas aninhadas, cache e revalidação",
        conceitos: (
          <>
            Layouts aninhados e rotas dinâmicas em profundidade — série →
            temporada → episódio.{" "}
            <span className="mono">generateStaticParams</span>, cache e ISR com
            dado que vem de fora, e{" "}
            <span className="mono">revalidateTag</span>.
          </>
        ),
        ticket: (
          <>
            A navegação de temporada e episódio não existe, e o catálogo fica
            desatualizado quando entra título novo.
          </>
        ),
        copiloto: (
          <>
            Copilot para o boilerplate repetitivo das rotas — a hierarquia quem
            decide é você.
          </>
        ),
        entrega: <>Navegação completa da série e catálogo revalidando.</>,
      },
    ],
  },
  {
    n: "2",
    nome: "A conta",
    subtitulo: "Autenticação e interação",
    resumo: <>O produto deixa de ser só leitura e passa a ter dono.</>,
    aulas: [
      {
        n: "04",
        titulo: "Autenticação: cookie httpOnly, proxy e rota protegida",
        conceitos: (
          <>
            Login contra a API e o token guardado num{" "}
            <strong>cookie <span className="mono">httpOnly</span></strong> por um
            Route Handler — o token nunca chega ao JavaScript do navegador.{" "}
            <span className="mono">proxy.ts</span> protegendo rotas, sessão em
            Server Components, e a armadilha de{" "}
            <strong>cachear dado por usuário</strong>.
          </>
        ),
        ticket: <>Criar o fluxo de login e a área do perfil, protegida.</>,
        copiloto: (
          <>
            Copiloto no fluxo, com atenção redobrada à segurança —{" "}
            <strong>e auditoria do que ele sugerir sobre onde guardar
            token</strong>. É onde a resposta fácil costuma ser a errada.
          </>
        ),
        entrega: <>Login funcionando e área do perfil protegida.</>,
      },
      {
        n: "05",
        titulo: "Interação: Server Actions, UI otimista e o modal",
        conceitos: (
          <>
            Server Actions chamando a API, validação e{" "}
            <span className="mono">revalidateTag</span>. UI otimista. E{" "}
            <strong>rotas paralelas e interceptadas</strong>: abrir a mídia por
            cima da grade, com URL própria — e página cheia ao recarregar.
          </>
        ),
        ticket: (
          <>
            Avaliar, marcar como assistido e adicionar à minha lista, sem
            recarregar a página. Mais o modal do pôster.
          </>
        ),
        copiloto: (
          <>
            <strong>Copilot Code Review</strong> como primeiro revisor do PR —
            você decide o que aceitar.
          </>
        ),
        entrega: <>Interações funcionando e o modal com URL compartilhável.</>,
      },
    ],
  },
  {
    n: "3",
    nome: "Inteligência",
    subtitulo: "Onde a IA entra no produto",
    resumo: (
      <>
        Deixa de ser ferramenta de quem desenvolve e vira o que o usuário usa.
      </>
    ),
    aulas: [
      {
        n: "06",
        titulo: "Busca: filtros, searchParams e busca semântica",
        conceitos: (
          <>
            <span className="mono">searchParams</span> como estado da URL,
            filtros combináveis, link compartilhável e paginação. Depois, o
            salto: busca por <strong>significado</strong>, não por palavra.
          </>
        ),
        ticket: (
          <>
            A busca só acha título exato — fazer ela entender o que a pessoa
            quis dizer.
          </>
        ),
        copiloto: (
          <>
            Copilot rascunha a normalização e o cliente de embeddings; você
            audita e mede se a busca melhorou de verdade.
          </>
        ),
        noProduto: (
          <>
            <strong>Busca semântica</strong> — <em>&ldquo;algo leve pra
            assistir cansada&rdquo;</em>, <em>&ldquo;filme sobre superação que
            não seja triste&rdquo;</em>. Nenhum <span className="mono">LIKE</span>{" "}
            resolve isso.
          </>
        ),
        entrega: <>Busca por significado, com os filtros combinando.</>,
      },
      {
        n: "07",
        titulo: "A feature-carro-chefe: streaming, custo e prompt versionado",
        conceitos: (
          <>
            Integrar uma LLM a uma feature real. <strong>Streaming</strong> da
            resposta, tratamento de erro e de <strong>custo</strong>, e{" "}
            <strong>prompt versionado como código</strong> — no repositório,
            revisado em PR como qualquer outra coisa.
          </>
        ),
        ticket: (
          <>
            A feature de IA priorizada no backlog — implementar de ponta a
            ponta.
          </>
        ),
        copiloto: (
          <>
            Aqui a IA troca de papel: deixa de ser só ferramenta de quem
            desenvolve e passa a ser <strong>o produto</strong>.
          </>
        ),
        noProduto: (
          <>
            Recomendação explicada a partir do que a pessoa já assistiu, ou{" "}
            <em>&ldquo;monta uma maratona pra um domingo chuvoso&rdquo;</em> —
            com a curadoria aparecendo em tempo real.
          </>
        ),
        entrega: <>Feature com IA publicada e funcional.</>,
      },
    ],
  },
  {
    n: "4",
    nome: "Entrega",
    subtitulo: "Pronto para produção e para entrevista",
    resumo: <>Apresentar, defender e sair com portfólio.</>,
    aulas: [
      {
        n: "08",
        titulo: "Demo Day (Sprint Review)",
        objetivo: <>Apresentar, defender e celebrar o que foi construído.</>,
        conceitos: (
          <>
            Cada pessoa apresenta suas entregas — bugs, features e as de IA —,
            defende as decisões técnicas e recebe review ao vivo.
            Retrospectiva, organização do portfólio e próximos passos de
            carreira.
          </>
        ),
        ticket: (
          <>
            Na semana anterior: <strong>performance, acessibilidade e
            testes</strong> — medir antes/depois, cobrir o fluxo crítico e
            revisar o PR de um colega. Depois, fechar os cards e preparar a
            demo.
          </>
        ),
        copiloto: (
          <>
            Copilot sugere otimizações e o 1º rascunho dos testes; você{" "}
            <strong>mede, valida e faz o review humano</strong>.
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

        <Campo rotulo="conceitos · ao vivo" cor="var(--text-3)">
          {a.conceitos}
        </Campo>
        <Campo rotulo="🎫 ticket · a semana" cor="var(--pink-light)">
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

      <div className="eyebrow">
        Curso · 8 aulas de 2h30 · 4 sprints · trabalho assíncrono na semana
      </div>
      <h1>
        Next.js <span className="grad-text">+ IA</span>
      </h1>
      <p className="lead">
        Este curso não simula uma sala de aula — simula <strong>um
        emprego</strong>. Você entra num time, recebe um produto que já existe e
        uma API que já roda, pega tickets do backlog e entrega por Pull Request.
        Em oito sprints, sai de &ldquo;primeiro dia na empresa&rdquo; até uma{" "}
        <strong>feature de IA publicada em produção</strong> e defendida num
        Demo Day.
      </p>
      <BadgesDeTecnologia tecnologias={["nextjs"]} />
      <div className="brand-rule" />

      <div className="section-label">Como funciona</div>

      <ul className="faixa">
        {COMO_FUNCIONA.map((c) => (
          <li key={c.titulo}>
            <p className="faixa__titulo">
              <span className="e" aria-hidden="true">
                {c.emoji}
              </span>
              {c.titulo}
            </p>
            <p className="faixa__desc">{c.desc}</p>
          </li>
        ))}
      </ul>

      <div className="section-label">O produto</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">🎬</div>
          <div className="body">
            <h3>LequePlay — o catálogo que vira produto</h3>
            <p>
              Um catálogo de <strong>filmes, séries e podcasts</strong>: você
              navega, filtra, abre a ficha, avalia, marca o que já viu e monta
              sua lista. Tudo sobre uma API real, que o time já mantém.
            </p>
            <p style={{ marginBottom: 0 }}>
              A escolha não é decorativa. Um catálogo de mídia é visual e
              hierárquico, e é isso que obriga o curso a passar pelos recursos
              que quase ninguém ensina — o <strong>modal com URL própria</strong>{" "}
              sobre a grade de pôsteres, e a navegação{" "}
              <strong>série → temporada → episódio</strong> em rotas aninhadas.
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
