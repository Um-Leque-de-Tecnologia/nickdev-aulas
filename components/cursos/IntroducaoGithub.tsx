import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import { materialDaAula } from "@/lib/cdn";

/**
 * O conteudo da landing do curso, sem moldura nenhuma.
 *
 * Nem cabecalho, nem rodape, nem "voltar": quem monta a moldura e a rota. A
 * publica (`app/cursos/introducao-github/page.tsx`) poe o SiteHeader e o Footer; a
 * logada (`app/(private)/painel/cursos/[slug]`) deixa a sidebar da area
 * logada fazer esse papel, que e o motivo de a moldura ter saido daqui.
 *
 * Duas molduras, um conteudo so. Enquanto o texto morava dentro da pagina
 * publica, mostrar o mesmo curso na area logada exigia manter duas copias
 * em dia na mao -- e a segunda ia ficar para tras no primeiro dia corrido.
 *
 * Toda aula tem os dois materiais, e por isso `materiaisDaAula` recebe so o
 * slug da pasta: um par fixo nao precisa ser escrito doze vezes. Aula que um
 * dia ganhe material extra passa a listar a mao; ate la, a funcao e a fonte
 * unica dos rotulos, e trocar "Slides" por outra coisa e uma linha.
 */

type Material = {
  href: string;
  label: string;
  primary?: boolean;
  externo?: boolean;
};

/**
 * Os dois arquivos de uma aula, no CDN.
 *
 * `externo` porque o destino e outro dominio (o CDN), e nao uma rota do app:
 * sem `target="_blank"` a pessoa perderia a pagina do curso ao abrir um deck.
 */
function materiaisDaAula(slug: string): Material[] {
  const base = materialDaAula("introducao-github", slug);
  return [
    { href: `${base}/slides.html`, label: "▶ Slides da aula", primary: true, externo: true },
    { href: `${base}/manual.html`, label: "📘 Manual passo a passo", externo: true },
  ];
}

type Aula = {
  n: string;
  titulo: string;
  desc: React.ReactNode;
  materiais?: Material[];
};

const GIT: Aula[] = [
  {
    n: "01",
    titulo: "Controle de versão e o primeiro repositório",
    desc: (
      <>
        Por que a pasta <span className="mono">projeto-final-v2-AGORA-VAI</span>{" "}
        não é controle de versão. O que o Git resolve, e a diferença entre{" "}
        <strong>Git</strong> — o programa que roda na sua máquina — e{" "}
        <strong>GitHub</strong> — o serviço onde o repositório mora junto com
        outras pessoas. Confundir os dois é o mal-entendido que atrapalha todo o
        resto do curso. Instalação, <span className="mono">git config</span> com
        nome e e-mail, e o ciclo que se repete pelo resto da vida:{" "}
        <span className="mono">status</span> → <span className="mono">add</span>{" "}
        → <span className="mono">commit</span>. A área de staging explicada como
        o que ela é: a bancada onde você monta o commit antes de fechá-lo.{" "}
        <span className="mono">log</span>, <span className="mono">diff</span> e{" "}
        <span className="mono">.gitignore</span> desde o primeiro dia, para
        segredo e <span className="mono">node_modules</span> nunca entrarem no
        histórico.
      </>
    ),
    materiais: materiaisDaAula("aula-01-controle-de-versao"),
  },
  {
    n: "02",
    titulo: "Branches, merge e o conflito que todo mundo teme",
    desc: (
      <>
        Branch como linha do tempo paralela, e não como cópia da pasta.{" "}
        <span className="mono">git switch -c</span>, trabalhar isolado e voltar
        com <span className="mono">merge</span>. Fast-forward × commit de merge,
        e como ler o histórico em grafo. Depois, o assunto que faz gente desistir
        do Git: <strong>o conflito</strong>. Provocamos um de propósito, lemos os
        marcadores <span className="mono">&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span> com
        calma e resolvemos. Conflito não é erro — é o Git dizendo que não tem
        como adivinhar qual das duas versões você quis.
      </>
    ),
    materiais: materiaisDaAula("aula-02-branches-e-merge"),
  },
  {
    n: "03",
    titulo: "O repositório remoto: clone, push, pull e fetch",
    desc: (
      <>
        Onde o GitHub entra. Autenticação primeiro, porque é onde a turma trava:{" "}
        <strong>chave SSH</strong> ou <strong>personal access token</strong> —
        senha de conta não funciona mais. <span className="mono">clone</span> ×{" "}
        <span className="mono">init</span> +{" "}
        <span className="mono">remote add</span>,{" "}
        <span className="mono">push -u</span> e o que é um <em>upstream</em>. A
        diferença entre <span className="mono">fetch</span> (buscar) e{" "}
        <span className="mono">pull</span> (buscar e integrar), e por que{" "}
        <span className="mono">pull --rebase</span> deixa o histórico legível.
        Encerra com o erro mais comum da vida real —{" "}
        <span className="mono">rejected: non-fast-forward</span> —, o que ele
        significa e por que <span className="mono">--force</span> não é a
        resposta.
      </>
    ),
    materiais: materiaisDaAula("aula-03-repositorio-remoto"),
  },
];

const PLATAFORMA: Aula[] = [
  {
    n: "04",
    titulo: "Anatomia do GitHub: repositório, perfil e organização",
    desc: (
      <>
        A volta guiada pela plataforma. Repositório público × privado, e o que{" "}
        <strong>README</strong>, <strong>LICENSE</strong> e{" "}
        <span className="mono">CONTRIBUTING.md</span> comunicam para quem chega
        de fora — inclusive como se escreve um README que faz alguém usar o seu
        projeto. O perfil como currículo: README de perfil, repositórios
        fixados, o que o gráfico de contribuições diz e o que ele não diz.
        Organizações, times e os níveis de permissão (read, triage, write,
        maintain, admin), porque cedo ou tarde você entra numa org e precisa
        saber o que consegue fazer lá dentro.
      </>
    ),
    materiais: materiaisDaAula("aula-04-anatomia-do-github"),
  },
  {
    n: "05",
    titulo: "Issues, labels, milestones e Projects",
    desc: (
      <>
        O trabalho antes do código. Como se escreve uma issue que outra pessoa
        consegue resolver: contexto, passo a passo para reproduzir, resultado
        esperado. Labels, milestones, responsáveis e referência cruzada entre
        issues. Templates para a equipe parar de receber{" "}
        <span className="mono">não funciona</span> como relato de bug.{" "}
        <strong>GitHub Projects</strong> como quadro do time, com as colunas
        ligadas ao estado real das issues — e o vocabulário de processo que vem
        junto: backlog, refinamento, trabalho em andamento, pronto.
      </>
    ),
    materiais: materiaisDaAula("aula-05-issues-e-projects"),
  },
  {
    n: "06",
    titulo: "Pull Request e code review",
    desc: (
      <>
        O coração do ciclo. <strong>Fork</strong> (contribuir de fora) ×{" "}
        <strong>branch no próprio repositório</strong> (contribuir de dentro), e
        quando cada um é o certo. Abrir um PR: descrição, rascunho, vincular a
        issue com <span className="mono">Closes #12</span>, template de PR.
        Depois o outro lado da mesa — <strong>revisar</strong>: comentário em
        linha, sugestão aplicável com um clique, aprovar × pedir alterações, e
        como escrever crítica técnica sem virar briga. Fecha com as três formas
        de integrar — <span className="mono">merge commit</span>,{" "}
        <span className="mono">squash</span> e{" "}
        <span className="mono">rebase</span> — e o efeito de cada uma no
        histórico, mais <span className="mono">CODEOWNERS</span> para o revisor
        certo ser chamado sozinho.
      </>
    ),
    materiais: materiaisDaAula("aula-06-pull-request-e-code-review"),
  },
  {
    n: "07",
    titulo: "Fluxos de trabalho e proteção da branch principal",
    desc: (
      <>
        <strong>GitHub Flow</strong>, trunk-based e Git Flow: os três modelos, o
        que cada um assume sobre o time e como escolher em vez de copiar.
        Nomenclatura de branch e <strong>Conventional Commits</strong> (
        <span className="mono">feat:</span>, <span className="mono">fix:</span>
        ), que é o que permite gerar changelog e versão automaticamente na aula
        10. E a trava que sustenta tudo isso:{" "}
        <strong>branch protection</strong> na <span className="mono">main</span>{" "}
        — sem push direto, com revisão obrigatória e checks verdes antes do
        merge.
      </>
    ),
    materiais: materiaisDaAula("aula-07-fluxos-e-branch-protection"),
  },
];

const CICLO: Aula[] = [
  {
    n: "08",
    titulo: "GitHub Actions: a primeira automação",
    desc: (
      <>
        Integração contínua sem mistério. O arquivo em{" "}
        <span className="mono">.github/workflows/</span> e o seu vocabulário:
        evento, job, step, runner, action. O primeiro workflow roda o build a
        cada push e a cada Pull Request. Depois: matriz de versões, cache de
        dependências, artefatos e logs — e por que pipeline lento é pipeline que
        o time aprende a ignorar. Fecha com o badge de status no README.
      </>
    ),
    materiais: materiaisDaAula("aula-08-github-actions"),
  },
  {
    n: "09",
    titulo: "Qualidade automática: testes, lint e segurança no PR",
    desc: (
      <>
        O robô revisando antes da pessoa. Lint, formatação e testes rodando no
        PR, com <strong>status checks obrigatórios</strong> ligados à branch
        protection: o merge só libera com tudo verde.{" "}
        <strong>Dependabot</strong> abrindo PR de atualização de dependência,{" "}
        <strong>secret scanning</strong> avisando quando alguém commitou uma
        chave e <strong>code scanning</strong> apontando vulnerabilidade no
        código. E o procedimento de emergência para quando o segredo <em>já</em>{" "}
        foi para o histórico: rotacionar primeiro, limpar depois.
      </>
    ),
    materiais: materiaisDaAula("aula-09-qualidade-automatica"),
  },
  {
    n: "10",
    titulo: "Release, versionamento e deploy contínuo",
    desc: (
      <>
        Do merge à produção. Tags anotadas,{" "}
        <strong>versionamento semântico</strong> e o que{" "}
        <span className="mono">MAJOR.MINOR.PATCH</span> promete a quem depende
        do seu projeto. Releases do GitHub com changelog gerado a partir dos
        commits da aula 07. <strong>Secrets</strong> e{" "}
        <strong>environments</strong>: variável sensível fora do repositório e
        ambiente de produção com aprovação manual. O workflow de deploy
        publicando no GitHub Pages, o que muda quando o destino é outro
        provedor, e como voltar a versão anterior sem apagar histórico.
      </>
    ),
    materiais: materiaisDaAula("aula-10-release-e-deploy"),
  },
  {
    n: "11",
    titulo: "Desfazendo: reflog, revert, reset e amigos",
    desc: (
      <>
        A aula que devolve a coragem de usar Git.{" "}
        <span className="mono">restore</span> e{" "}
        <span className="mono">commit --amend</span> para o erro recém-cometido.{" "}
        <span className="mono">revert</span> × <span className="mono">reset</span>
        : por que, em branch compartilhada, só um dos dois é aceitável.{" "}
        <span className="mono">stash</span> para o trabalho pela metade,{" "}
        <span className="mono">cherry-pick</span> para levar um commit
        específico e <span className="mono">rebase -i</span> para limpar a série
        antes da revisão. <span className="mono">git bisect</span> achando em
        minutos o commit que quebrou. E a rede de segurança que quase ninguém
        conhece: <span className="mono">git reflog</span> — commit feito
        dificilmente se perde de verdade.
      </>
    ),
    materiais: materiaisDaAula("aula-11-desfazendo"),
  },
  {
    n: "12",
    titulo: "Open source, ecossistema e o que levar daqui",
    desc: (
      <>
        Contribuir com um projeto que não é seu, do fork ao PR aceito: ler o{" "}
        <span className="mono">CONTRIBUTING</span>, escolher uma issue marcada
        como <span className="mono">good first issue</span> e manter o fork em
        dia com o original. O resto do ecossistema em visão de uso:{" "}
        <strong>GitHub CLI</strong> (<span className="mono">gh pr create</span>{" "}
        sem sair do terminal), Discussions, Gists, Codespaces e Copilot. Fecha
        com o ciclo inteiro desenhado numa página só — issue, branch, commit,
        PR, review, check, merge, release — e o mapa de para onde estudar
        depois.
      </>
    ),
    materiais: materiaisDaAula("aula-12-open-source"),
  },
];

function ListaDeAulas({ aulas }: { aulas: Aula[] }) {
  return (
    <div className="lessons">
      {aulas.map((a) => (
        <div className={a.materiais ? "lesson" : "lesson soon"} key={a.n}>
          <div className="idx">{a.n}</div>
          <div className="body">
            <h3>{a.titulo}</h3>
            <p>{a.desc}</p>

            {a.materiais && (
              <div className="mats">
                {a.materiais.map((m) => (
                  <a
                    className={m.primary ? "mat primary" : "mat"}
                    href={m.href}
                    key={m.href}
                    {...(m.externo
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {m.label}
                  </a>
                ))}
              </div>
            )}

            {!a.materiais && <span className="soon-tag">em breve</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IntroducaoGithub() {
  return (
    <>
      <div className="eyebrow">Curso · 12 aulas · material publicado</div>
      <h1>
        Introdução ao <span className="grad-text">GitHub</span>
      </h1>
      <p className="lead">
        O Git e o GitHub que um desenvolvedor usa todo dia, na ordem em que o
        trabalho acontece: <strong>issue → branch → commit → Pull Request →
        revisão → CI → merge → release</strong>. Começa do zero, sem pressupor
        nenhum comando, e termina com você abrindo, revisando e publicando
        mudança em repositório compartilhado, com teste rodando sozinho a cada
        PR. Serve para qualquer linguagem — aqui o assunto é o <em>processo</em>,
        não a stack.
      </p>
      <BadgesDeTecnologia tecnologias={["github"]} />
      <div className="brand-rule" />

      <div className="section-label">Projeto do curso</div>

      <div className="lessons">
        <div className="lesson soon">
          <div className="idx">🐙</div>
          <div className="body">
            <h3>Um repositório, a turma inteira</h3>
            <p>
              Não existe projeto individual: existe <strong>um</strong>{" "}
              repositório da turma, e cada pessoa entra nele como entraria numa
              equipe. Você pega uma issue do quadro, abre a branch, manda o Pull
              Request, <strong>revisa o PR de outra pessoa</strong> e só faz
              merge com os checks verdes. Da aula 08 em diante o repositório
              passa a ter CI, e da 10 em diante ele publica sozinho a cada
              release. A avaliação é o seu rastro lá dentro — commits, PRs
              abertos e revisões feitas —, e não uma prova.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>
      </div>

      <div className="section-label">Unidade 1 · Git, o fundamento · 3 aulas</div>
      <ListaDeAulas aulas={GIT} />

      <div className="section-label">
        Unidade 2 · GitHub, a plataforma · 4 aulas
      </div>
      <ListaDeAulas aulas={PLATAFORMA} />

      <div className="section-label">
        Unidade 3 · Ciclo de vida: automação, entrega e conserto · 5 aulas
      </div>
      <ListaDeAulas aulas={CICLO} />
    </>
  );
}
