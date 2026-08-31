/**
 * Os materiais de aula não são mais servidos de `public/`: moram na Leque de
 * Aulas API e chegam ao aluno pelo CDN.
 *
 * O caminho no CDN é `public/{curso}/{aula}/{arquivo}` — repare que **não há
 * o segmento `cursos/`**: o slug do curso já é o nível de cima. É por isso que
 * `/cursos/introducao-nextjs/aula-03-server-client/slides.html` do app vira
 * `.../public/introducao-nextjs/aula-03-server-client/slides.html` aqui.
 *
 * Os guias são um curso à parte, com uma aula por tecnologia, então o arquivo
 * aparece duas vezes no caminho: `public/guias/css/css.html`.
 */
export const CDN = "https://cdn.aulas.umlequedetecnologia.com.br/public";

/** Pasta de uma aula no CDN. Junte o nome do arquivo: `${...}/slides.html`. */
export function materialDaAula(curso: string, aula: string): string {
  return `${CDN}/${curso}/${aula}`;
}
