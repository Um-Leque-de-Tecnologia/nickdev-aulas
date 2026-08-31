/**
 * O selo de curso pago.
 *
 * Quem decide se ele aparece é o `access: "restricted"` de `lib/cursos.ts`;
 * aqui só se desenha o pill. Curso pago novo entra no catálogo já marcado e
 * nasce com o selo, sem ninguém lembrar de acrescentar nada nas páginas.
 *
 * Sem props e sem estado, de propósito: um tamanho só atende os dois lugares
 * onde ele aparece hoje — o card do painel e o cabeçalho da landing —, e
 * variante que ninguém pediu é peso morto. O espaço em volta é de quem usa,
 * em `.eyebrow .exclusive-tag` e `.card h3 .exclusive-tag`, para o selo não
 * carregar margem de um contexto para o outro.
 */
export default function ExclusiveBadge() {
  return <span className="exclusive-tag">Exclusivo</span>;
}
