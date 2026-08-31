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

/**
 * Pasta de uma aula de curso FECHADO (`visibility=authenticated`).
 *
 * Esses arquivos não existem no caminho público do CDN — ele devolve 404 para
 * eles. A API os entrega por URL assinada, emitida por pessoa e por pedido,
 * então o link precisa passar pela rota do app que faz essa troca.
 *
 * Use `materialDaAula` para curso aberto: linkar o CDN direto evita uma volta
 * pelo Worker e não exige sessão para ver o que é público.
 */
export function materialProtegido(curso: string, aula: string): string {
  return `/material/${curso}/${aula}`;
}
