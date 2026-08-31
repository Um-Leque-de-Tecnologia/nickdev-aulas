/**
 * Quem vê o quê.
 *
 * A permissão de curso mora no Keycloak, como client role — não há banco aqui.
 * Liberar um curso é atribuir a role `curso-<slug>` à pessoa no console.
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
  if (session === null) return false;
  // Admin vê tudo — quem cadastra o curso precisa conseguir abrir o curso.
  if (isAdmin(session)) return true;
  return course.role !== undefined && session.roles.includes(course.role);
}

export function coursesFor(session: Session | null): Course[] {
  // Exclusivo na frente: quem pagou abre o painel para ver o que pagou.
  return exclusiveFirst(COURSES.filter((course) => canSee(session, course)));
}
