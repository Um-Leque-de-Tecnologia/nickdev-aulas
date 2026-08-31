/**
 * Quem vê o quê.
 *
 * As roles moram no Keycloak, como client roles — não há banco aqui.
 *
 * Curso pago NÃO é liberado pessoa a pessoa: quem está logado vê todos. A
 * role que sobrou com poder de decisão é a de admin. Ver `canSee`.
 */

import { COURSES, exclusiveFirst, type Course } from "@/lib/cursos";
import type { Session } from "@/lib/auth/session";

export const ADMIN_ROLE = "admin";

/**
 * Roles que o Keycloak dá de graça para todo mundo. Elas não dizem nada sobre
 * o que a pessoa comprou, e deixá-las passar só suja a tela de perfil.
 */
const KEYCLOAK_INTERNAL_ROLES = new Set(["offline_access", "uma_authorization"]);
const KEYCLOAK_DEFAULT_ROLE_PREFIX = "default-roles-";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Os claims chegam como `unknown`; nada aqui confia no formato antes de olhar. */
function rolesAt(container: unknown): string[] {
  if (!isRecord(container)) return [];
  const roles = container["roles"];
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is string => typeof role === "string");
}

export function rolesFromClaims(
  claims: Record<string, unknown>,
  clientId: string
): string[] {
  const resourceAccess = claims["resource_access"];
  const clientRoles = isRecord(resourceAccess)
    ? rolesAt(resourceAccess[clientId])
    : [];
  const realmRoles = rolesAt(claims["realm_access"]);

  const result: string[] = [];
  for (const role of [...clientRoles, ...realmRoles]) {
    if (KEYCLOAK_INTERNAL_ROLES.has(role)) continue;
    if (role.startsWith(KEYCLOAK_DEFAULT_ROLE_PREFIX)) continue;
    if (result.includes(role)) continue;
    result.push(role);
  }
  return result;
}

export function isAdmin(session: Session | null): boolean {
  return session !== null && session.roles.includes(ADMIN_ROLE);
}

export function canSee(session: Session | null, course: Course): boolean {
  if (course.access === "public") return true;

  /* Curso pago é visível para qualquer pessoa logada: entrou, vê tudo.
   *
   * Isso casa com a API, onde o endpoint de matrícula responde 201 para
   * qualquer sessão válida e não tem 403 — ou seja, ela também não trata
   * curso pago como algo a liberar por pessoa.
   *
   * A role `curso-<slug>` continua existindo no catálogo e no Keycloak, mas
   * deixou de decidir visibilidade. Se um dia voltar a existir curso que só
   * alguns veem, é este `return` que muda — e aí `course.role` volta a valer. */
  return session !== null;
}

export function coursesFor(session: Session | null): Course[] {
  // Exclusivo na frente: quem pagou abre o painel para ver o que pagou.
  return exclusiveFirst(COURSES.filter((course) => canSee(session, course)));
}
