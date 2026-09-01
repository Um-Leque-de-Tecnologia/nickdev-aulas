import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import ExclusiveBadge from "@/components/ExclusiveBadge";
import { materialProtegido } from "@/lib/cdn";

/**
 * O conteudo da landing do curso, sem moldura nenhuma.
 *
 * Nem cabecalho, nem rodape, nem "voltar": quem monta a moldura e a rota. A
 * publica (`app/cursos/nextjs-ia/page.tsx`) poe o SiteHeader e o Footer; a
 * logada (`app/(private)/painel/cursos/[slug]`) deixa a sidebar da area
 * logada fazer esse papel, que e o motivo de a moldura ter saido daqui.
 *
 * Duas molduras, um conteudo so. Enquanto o texto morava dentro da pagina
 * publica, mostrar o mesmo curso na area logada exigia manter duas copias
 * em dia na mao -- e a segunda ia ficar para tras no primeiro dia corrido.
 */

/* -------------------------------------------------------------------------
   Cada aula é a cerimônia de uma sprint; o ticket é o trabalho da semana.
   ------------------------------------------------------------------------- */
type Aula = {
  n: string;
  titulo: string;
  objetivo?: React.ReactNode;
  /** Pasta em `public/` quando a aula já tem material. Sem ela, o card fica "em breve". */
  base?: string;
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
        base: materialProtegido("nextjs-ia", "aula-01-onboarding"),
        objetivo: (
          <>
            Entrar no time, subir o front contra a API, fazer o primeiro merge e
            dominar o conceito que mais confunde:{" "}
            <strong>Server vs Client</strong>.
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
      },
      {
        n: "03",
        titulo: "Séries: rotas aninhadas, cache e revalidação",
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
      },
      {
        n: "05",
        titulo: "Interação: Server Actions, UI otimista e o modal",
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
      },
      {
        n: "07",
        titulo: "A feature-carro-chefe: streaming, custo e prompt versionado",
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
      },
    ],
  },
];

/* ------------------------------------------------------------------ */

function CardDeAula({ a }: { a: Aula }) {
  return (
    <div className={a.base ? "lesson" : "lesson soon"}>
      <div className="idx">{a.n}</div>
      <div className="body">
        <h3>{a.titulo}</h3>

        {a.objetivo && (
          <p style={{ marginBottom: 4 }}>
            <strong>Objetivo:</strong> {a.objetivo}
          </p>
        )}

        {/*
          Um botão só, de propósito. O card da aula guarda o que é daquele
          encontro — o deck; o resto tem dono em outro lugar e repetir aqui
          criaria duas fontes da mesma verdade: o ticket da semana vive no
          Trello, e o combinado do time e o repositório ficam no card do
          produto, onde continuam à mão depois que a turma passou desta aula.
        */}
        {a.base ? (
          <div className="mats" style={{ marginTop: 18 }}>
            {/*
              `?inteira=1` porque deck é tela cheia, sempre. Sem ele o proxy
              desviaria para a leitura no shell, que não conseguiria desmontar um
              deck (ele não tem `<main>`) e devolveria para cá — duas voltas de
              rede para chegar no mesmo lugar. Declarar no link resolve na
              primeira. Ver `INTEIRA` em proxy.ts.
            */}
            <a className="mat primary" href={`${a.base}/slides.html?inteira=1`}>
              ▶ Slides da aula
            </a>
          </div>
        ) : (
          <span className="soon-tag">em breve</span>
        )}
      </div>
    </div>
  );
}

export default function NextjsIA() {
  return (
    <>
      {/*
        Esta landing é pública, mas o material é pago — é o único curso do
        catálogo com `access: "restricted"`. O selo abre o olho-de-boi, antes
        da ficha técnica: quem chega aqui precisa saber que o acesso é comprado
        antes de ler quantas aulas são.
      */}
      <div className="eyebrow">
        <ExclusiveBadge />
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
            <p>
              A escolha não é decorativa. Um catálogo de mídia é visual e
              hierárquico, e é isso que obriga o curso a passar pelos recursos
              que quase ninguém ensina — o <strong>modal com URL própria</strong>{" "}
              sobre a grade de pôsteres, e a navegação{" "}
              <strong>série → temporada → episódio</strong> em rotas aninhadas.
            </p>
            {/*
              As referências permanentes do curso ficam aqui, no card do
              produto, e não em cada aula: são consultadas a semana inteira,
              não só no dia da cerimônia — e continuam à mão quando a turma já
              passou da aula 01.

              O quadro é o backlog vivo do time, por isso aponta pro Trello e
              não pra um HTML: material estático viraria cópia velha na
              primeira vez que um card mudasse. O combinado do time, pelo
              mesmo motivo, mora no repositório e muda por PR.
            */}
            <div className="mats">
              {/*
                O manual da IA e o unico material desta fileira, e por isso e o
                unico que passa por `/material`: os outros tres sao links
                externos (GitHub, Trello), enquanto este e um arquivo do curso
                no CDN, entregue por URL assinada como os slides. Fica aqui, e
                nao numa aula, pelo mesmo motivo dos vizinhos — e consultado a
                semana inteira, e nao no dia de uma cerimonia.
              */}
              <a
                className="mat"
                /*
                  Aponta para a leitura DENTRO da área logada, e não para
                  `/material` — o manual é documento de consulta, e ali ele abre
                  com a sidebar do app e o índice fixo à direita, como um guia.
                  Quem chegar sem sessão é mandado ao login pelo proxy, que é o
                  mesmo destino de antes: o material é de curso fechado.
                */
                href="/painel/material/nextjs-ia/projeto/manual-ia.html"
              >
                🤖 Manual da IA
              </a>
              <a
                className="mat primary"
                href="https://github.com/Um-Leque-de-Tecnologia/lequeplay-web/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                📋 Como a gente trabalha
              </a>
              <a
                className="mat"
                href="https://trello.com/b/Ceu4uGVp/lequeplay"
                target="_blank"
                rel="noopener noreferrer"
              >
                🎫 O quadro do time
              </a>
              <a
                className="mat"
                href="https://github.com/Um-Leque-de-Tecnologia/lequeplay-web"
                target="_blank"
                rel="noopener noreferrer"
              >
                💻 O repositório do produto
              </a>
            </div>
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
    </>
  );
}
