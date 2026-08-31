import type { ComponentType } from "react";
import FrontendAvancado from "./FrontendAvancado";
import FrontendTransicao from "./FrontendTransicao";
import IntroducaoNextjs from "./IntroducaoNextjs";
import IntroducaoSpringBoot from "./IntroducaoSpringBoot";
import NextjsIA from "./NextjsIA";
import OrientacaoObjetosJava from "./OrientacaoObjetosJava";

/**
 * De slug para o conteúdo daquele curso.
 *
 * A rota pública de cada curso é uma pasta em `app/cursos/`, e ali o Next
 * encontra o componente sozinho — não precisa deste mapa. Quem precisa é a
 * rota da área logada, que é uma só (`/painel/cursos/[slug]`) e recebe o slug
 * como texto em tempo de execução: sem um lugar que ligue "introducao-nextjs"
 * ao componente, ela não teria o que renderizar.
 *
 * É um `Map` e não um objeto literal de propósito. `slug` vem da URL, ou seja,
 * de fora: num objeto, procurar por uma chave que não existe pode devolver
 * algo herdado do prototype — `"constructor"` na URL devolveria uma função em
 * vez de `undefined`, e o `if` que protege a rota passaria batido. `Map.get()`
 * só enxerga o que foi posto aqui dentro.
 *
 * ATENÇÃO: curso novo entra em três lugares — a pasta em `app/cursos/`, a
 * entrada em `lib/cursos.ts` e esta linha. Faltando esta, o curso aparece no
 * painel e o card cai em 404.
 */
const CONTENT = new Map<string, ComponentType>([
  ["frontend-avancado", FrontendAvancado],
  ["frontend-transicao", FrontendTransicao],
  ["introducao-nextjs", IntroducaoNextjs],
  ["introducao-spring-boot", IntroducaoSpringBoot],
  ["nextjs-ia", NextjsIA],
  ["orientacao-objetos-java", OrientacaoObjetosJava],
]);

export function courseContentFor(slug: string): ComponentType | undefined {
  return CONTENT.get(slug);
}
