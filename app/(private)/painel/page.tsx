import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CourseBrowser from "@/components/CourseBrowser";
import { readSession } from "@/lib/auth/session";
import { coursesFor } from "@/lib/auth/roles";
import { COURSES } from "@/lib/cursos";

export const metadata: Metadata = {
  title: "Painel · NickDev",
};

export default async function DashboardPage() {
  const session = await readSession();

  // O layout já barrou quem não tem sessão. Repito porque layout não entrega
  // valor para a página, e porque uma página que se protege sozinha continua
  // protegida se um dia mudar de pasta.
  if (!session) redirect("/entrar");

  const released = coursesFor(session);
  // O Keycloak nem sempre devolve `name` preenchido; sem nome a saudação fica
  // só "Oi.", em vez de abrir um buraco no meio da frase.
  const firstName = session.name.trim().split(/\s+/)[0];
  const unlocked = released.filter((c) => c.access === "restricted");
  const locked = COURSES.filter(
    (c) =>
      c.access === "restricted" && !released.some((r) => r.slug === c.slug),
  );

  return (
    <>
      <h1>
        {firstName ? (
          <>
            Oi, <span className="grad-text">{firstName}</span>
          </>
        ) : (
          "Oi"
        )}
      </h1>

      {/*
        A página continua Server Component: só a lista de cursos atravessa a
        fronteira. A sessão fica aqui — `released` já é o resultado de aplicar
        as roles, e mandar a sessão junto colocaria e-mail e permissões no HTML
        para qualquer pessoa ler no código-fonte.
      */}
      <CourseBrowser courses={released} />

      {unlocked.length === 0 && (
        <>
          <div className="section-label">Cursos pagos</div>
          <div className="card">
            <h3>
              {locked.length === 1
                ? `${locked[0].name} ainda não está liberado nesta conta`
                : "Nenhum curso pago está liberado nesta conta"}
            </h3>
            <p style={{ marginTop: 10 }}>
              <strong>Se você já comprou:</strong> a sua sessão guarda as
              permissões do momento em que você entrou. Saia e entre de novo
              que a liberação aparece — o botão de sair fica no seu perfil.
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>Se ainda não comprou:</strong> a página do curso conta
              como ele funciona e como participar.
            </p>
            <div className="mats" style={{ marginTop: 18 }}>
              <Link className="mat" href="/perfil">
                Ir para o meu perfil
              </Link>
              {locked.map((course) =>
                course.href ? (
                  <Link className="mat primary" href={course.href} key={course.slug}>
                    Ver {course.name}
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
