/**
 * O catálogo de cursos. É a única lista de quem existe, e de quem aparece onde.
 *
 * A `app/page.tsx` continua com a própria cópia do TEXTO dos cards — lá ele tem
 * JSX rico (`<span className="mono">`, `<strong>`), e espremer isso numa string
 * aqui empobreceria a home. O que ela não tem mais é a própria lista: a vitrine
 * pública é este array filtrado por `access === "public"`, e o `slug` — igual ao
 * nome da pasta em `app/cursos/` — é o que amarra as duas pontas.
 *
 * Ou seja, `access` decide três coisas de uma vez, e é o único lugar de cada
 * uma: se o curso aparece na home, se ele aparece no painel como liberado ou
 * como bloqueado (`coursesFor()`, em lib/auth/roles.ts), e se o material exige
 * sessão. Curso pago novo é uma entrada aqui — nenhuma tela precisa ser tocada.
 *
 * Os campos `name` e `summary` são texto de tela: ficam em português.
 */

export type Course = {
  slug: string;
  name: string;
  summary: string;
  /** Landing pública; "" quando o curso só existe logado. */
  href: string;
  /**
   * Slugs de `lib/guias.ts`, na ordem em que aparecem no curso. Rótulo e emoji
   * saem de `guiasDe()`; aqui só mora a lista, para nome de tecnologia não
   * existir em dois lugares.
   *
   * Quem quiser saber o que um curso usa pergunta aqui — é esta a lista que o
   * catálogo responde. As páginas em `app/cursos/` continuam repetindo a sua
   * própria lista no `BadgesDeTecnologia`, e as duas precisam bater na mão até
   * alguém unificá-las.
   */
  technologies: string[];
  access: "public" | "restricted";
  /** Role exigida quando restrito. */
  role?: string;
};

export const COURSES: Course[] = [
  {
    slug: "frontend-transicao",
    name: "Frontend — Transição de Carreira",
    summary:
      "Do primeiro <h1> ao seu site no ar: HTML, CSS, responsividade e deploy, pra quem está migrando pra tech.",
    href: "/cursos/frontend-transicao",
    technologies: ["html", "css", "javascript", "nextjs"],
    access: "public",
  },
  {
    slug: "orientacao-objetos-java",
    name: "Orientação a Objetos com Java",
    summary:
      "Os quatro pilares de OO, coleções, exceções e lambdas, até um projeto em equipe com persistência e arquitetura em camadas.",
    href: "/cursos/orientacao-objetos-java",
    technologies: ["java"],
    access: "public",
  },
  {
    slug: "introducao-spring-boot",
    name: "Introdução ao Spring Boot",
    summary:
      "Do Java puro à API REST em produção: injeção de dependência, JPA, segurança com JWT, testes, Docker e deploy.",
    href: "/cursos/introducao-spring-boot",
    technologies: ["java", "spring-boot"],
    access: "public",
  },
  {
    slug: "introducao-nextjs",
    name: "Introdução ao Next.js",
    summary:
      "Do primeiro componente ao deploy: App Router, Server Components, Server Actions, autenticação e CI/CD. Começa do zero, sem saber React.",
    href: "/cursos/introducao-nextjs",
    technologies: ["javascript", "typescript", "nextjs"],
    access: "public",
  },
  {
    slug: "frontend-avancado",
    name: "Frontend Avançado",
    summary:
      "A mesma aplicação feita duas vezes: Angular 22 com signals e zoneless, depois Next.js com App Router.",
    href: "/cursos/frontend-avancado",
    technologies: ["html", "css", "javascript", "typescript", "nextjs"],
    access: "public",
  },
  {
    slug: "introducao-github",
    name: "Introdução ao GitHub",
    summary:
      "O ciclo de vida do desenvolvimento na prática: commits, branches, Pull Request, code review, GitHub Actions, branch protection e release.",
    href: "/cursos/introducao-github",
    /*
      Vazio de propósito, e não por esquecimento: não existe guia de Git nem de
      GitHub em `lib/guias.ts`, e inventar um slug aqui quebraria em dois
      lugares — `guiasDe()` erra alto no badge da landing, e o chip do filtro do
      painel apontaria para um guia que o CDN devolve como 404. O preço é que
      este curso só aparece no painel pelo chip "Todas" e pela busca. No dia em
      que o guia de Git existir, é uma linha em `lib/guias.ts` e `["git"]` aqui.
    */
    technologies: [],
    access: "public",
  },
  {
    // Fora da listagem pública: `access: "restricted"` tira o card da home.
    //
    // A LANDING (`/cursos/nextjs-ia`) continua pública e aberta por link direto
    // — é a página que vende o curso para quem chega de fora. Quem já está
    // logado vê o mesmo conteúdo por `/painel/cursos/nextjs-ia`, com a sidebar
    // em volta. O que a role libera é o material, dentro da área logada.
    //
    // O convite para comprar, portanto, deixou de existir na home e passou a
    // existir só no painel, para quem já tem conta. Quem chega de fora só
    // encontra este curso por link que alguém mandou.
    slug: "nextjs-ia",
    name: "Next.js + IA",
    summary:
      "Oito sprints simulando um emprego: você pega tickets, abre Pull Request e publica uma feature de IA em produção.",
    href: "/cursos/nextjs-ia",
    technologies: ["nextjs"],
    access: "restricted",
    role: "curso-nextjs-ia",
  },
];

export function courseBySlug(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

/**
 * O endereço do curso dentro da área logada.
 *
 * O mesmo curso tem dois endereços, e é de propósito: `href` é a landing
 * pública, indexada e aberta a quem chega de fora; este é a mesma página
 * servida dentro do shell da área logada, onde a sidebar continua na tela.
 * Quem está logado e clica num curso não pode cair na versão pública — perderia
 * a navegação inteira e teria que usar o botão de voltar do navegador para
 * achar o caminho de casa.
 *
 * O conteúdo não é duplicado: as duas rotas renderizam o mesmo componente de
 * `components/cursos`. O que se repete é só a moldura em volta.
 */
export function privateCourseHref(slug: string): string {
  return `/painel/cursos/${slug}`;
}

/**
 * Curso exclusivo primeiro, o resto depois.
 *
 * A ordem mora aqui, e não na página, porque é regra do catálogo: quem pagou
 * abre o painel para ver o que pagou, e não para procurar. Qualquer lista nova
 * que passe por aqui herda a mesma ordem sem ninguém lembrar de ordenar.
 *
 * `sort` mexe no array recebido, então copio antes — `COURSES` é constante
 * compartilhada, e reordenar ela em silêncio bagunçaria quem lê depois.
 * Dentro de cada grupo a ordem do catálogo é preservada, porque `sort` em JS é
 * estável desde o ES2019.
 */
export function exclusiveFirst(courses: Course[]): Course[] {
  const rank = (course: Course) => (course.access === "restricted" ? 0 : 1);
  return [...courses].sort((a, b) => rank(a) - rank(b));
}

/**
 * As tecnologias presentes numa lista de cursos, sem repetir.
 *
 * A ordem é a de quem lê os cursos de cima para baixo: a primeira aparição
 * manda. Assim o filtro sai estável entre um render e outro, em vez de dançar
 * conforme a ordem alfabética ou a contagem de cursos.
 *
 * Recebe a lista já filtrada, e não `COURSES`, de propósito: filtro só deve
 * oferecer tecnologia que existe entre os cursos visíveis — opção que devolve
 * lista vazia é uma promessa quebrada na cara de quem clicou.
 */
export function technologiesOf(courses: Course[]): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const course of courses) {
    for (const slug of course.technologies) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      slugs.push(slug);
    }
  }

  return slugs;
}
