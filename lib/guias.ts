/**
 * Os guias de tecnologia.
 *
 * Antes eles moravam dentro da pasta de cada aula, um por aula, com o mesmo
 * assunto escrito em três lugares diferentes. Agora existe um guia canônico
 * por tecnologia, e os cursos apontam para eles.
 *
 * O arquivo não é mais servido de `public/`: os guias são um curso da Leque de
 * Aulas API, com uma aula por tecnologia, entregues pelo CDN — ver `lib/cdn`.
 *
 * Esta é a única lista — a home e os badges das páginas de curso leem daqui.
 */

import { CDN } from "@/lib/cdn";

export type Guia = {
  slug: string;
  nome: string;
  emoji: string;
  /** Uma linha, para o card da home. */
  resumo: string;
};

export const GUIAS: Guia[] = [
  {
    slug: "html",
    nome: "HTML",
    emoji: "🧱",
    resumo: "As tags, e depois o que separa HTML que funciona de HTML que qualquer pessoa consegue usar.",
  },
  {
    slug: "css",
    nome: "CSS",
    emoji: "🎨",
    resumo: "Do seletor ao sistema: box model, Flexbox, Grid, tokens, tema escuro e container queries.",
  },
  {
    slug: "javascript",
    nome: "JavaScript",
    emoji: "⚡",
    resumo: "Do primeiro console.log ao assíncrono — DOM, eventos, módulos, Promise e async/await.",
  },
  {
    slug: "typescript",
    nome: "TypeScript",
    emoji: "🛡️",
    resumo: "Tipar é mover o erro do usuário para o seu editor. Inferência, narrowing, genéricos e strict.",
  },
  {
    slug: "nextjs",
    nome: "Next.js",
    emoji: "▲",
    resumo: "React essencial e o App Router inteiro, da rota por pasta ao deploy em produção.",
  },
  {
    slug: "java",
    nome: "Java",
    emoji: "☕",
    resumo: "JDK, JRE e JVM sem enrolação, orientação a objetos e o primeiro programa rodando.",
  },
  {
    slug: "spring-boot",
    nome: "Spring Boot",
    emoji: "🌱",
    resumo: "Injeção de dependência, autoconfiguração e o caminho até uma API REST no ar.",
  },
];

/** Onde o guia é servido. São arquivos estáticos, não rotas do app. */
export function hrefDoGuia(slug: string): string {
  return `${CDN}/guias/${slug}/${slug}.html`;
}

/**
 * Os guias das tecnologias que um curso usa, na ordem em que foram pedidos.
 * Erra alto se o slug não existe — badge apontando para o vazio é pior do
 * que build quebrado.
 */
export function guiasDe(...slugs: string[]): Guia[] {
  return slugs.map((slug) => {
    const guia = GUIAS.find((g) => g.slug === slug);
    if (!guia) throw new Error(`Guia inexistente: "${slug}"`);
    return guia;
  });
}
