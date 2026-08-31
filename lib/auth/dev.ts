/**
 * O atalho de login que só existe em desenvolvimento.
 *
 * Enquanto o client do Keycloak não foi criado não há como abrir a área
 * logada — nem para conferir se ela desenha. Este arquivo monta uma sessão de
 * mentira para isso, e só para isso.
 *
 * As duas condições de `isDevLoginEnabled()` são o coração da coisa. O
 * `NODE_ENV` sozinho já fecharia a porta no deploy, porque `next build` sempre
 * produz "production". A segunda condição é a que vale no dia a dia: no
 * instante em que `KEYCLOAK_ISSUER` for definida, o atalho se desliga sozinho,
 * sem ninguém precisar lembrar de vir aqui apagar código. O login de verdade
 * passa a valer porque ele existe, não porque alguém removeu isto.
 */

import { COURSES } from "@/lib/cursos";
import { ADMIN_ROLE } from "@/lib/auth/roles";
import type { Session } from "@/lib/auth/session";

/** O `sub` da sessão de mentira. Não parece um UUID do Keycloak de propósito. */
export const DEV_SUB = "dev-user";

/**
 * Oito horas fixas, e aqui isso continua certo.
 *
 * A sessão de verdade deixou de durar oito horas: ela agora acompanha o
 * refresh token do Keycloak (ver app/entrar/retorno/route.ts). Esta não tem
 * refresh token nenhum para acompanhar — não tem Keycloak nenhum —, então o
 * número segue sendo o que sempre foi: um dia de trabalho olhando a tela.
 */
const DEV_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function isDevLoginEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const issuer = process.env.KEYCLOAK_ISSUER;
  return issuer === undefined || issuer.trim() === "";
}

/**
 * As roles de curso restrito saem do catálogo, e não de uma lista escrita à
 * mão aqui: curso restrito novo em lib/cursos.ts já aparece no atalho, que é
 * exatamente quando alguém precisa olhar como ele ficou na tela.
 */
function restrictedCourseRoles(): string[] {
  const roles: string[] = [];
  for (const course of COURSES) {
    if (course.access !== "restricted") continue;
    if (course.role === undefined) continue;
    roles.push(course.role);
  }
  return roles;
}

/**
 * O nome e o e-mail são de brincadeira por escrito: eles aparecem no /painel e
 * no /perfil, e ninguém deve confundir esta tela com dado de gente de verdade.
 * A faixa de aviso do layout diz o resto.
 */
export function devSession(kind: "admin" | "student"): Session {
  const courseRoles = restrictedCourseRoles();

  return {
    sub: DEV_SUB,
    name: kind === "admin" ? "Admin de Mentira" : "Aluna de Mentira",
    email:
      kind === "admin"
        ? "dev-admin@exemplo.invalido"
        : "dev-aluna@exemplo.invalido",
    // Admin ganha a role de admin e a dos cursos restritos; aluno só a dos
    // cursos. São as duas telas que a área logada tem, e trocar de papel é
    // trocar de link — /entrar e /entrar?dev=aluno.
    roles: kind === "admin" ? [ADMIN_ROLE, ...courseRoles] : courseRoles,
    expiresAt: Math.floor(Date.now() / 1000) + DEV_SESSION_MAX_AGE_SECONDS,
    dev: true,
  };
}
