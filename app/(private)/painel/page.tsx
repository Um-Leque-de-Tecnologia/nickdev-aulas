import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CourseBrowser from "@/components/CourseBrowser";
import { readSession } from "@/lib/auth/session";
import { coursesFor } from "@/lib/auth/roles";

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
        fronteira. A sessão fica aqui — `released` já é o resultado de
        `canSee()`, e mandar a sessão junto colocaria e-mail e permissões no
        HTML para qualquer pessoa ler no código-fonte.
      */}
      <CourseBrowser courses={released} />

      {/*
        Aqui existia um bloco "nenhum curso pago liberado nesta conta", com
        instruções para sair e entrar de novo até a role aparecer. Ele saiu junto
        com a regra que o justificava: hoje quem tem sessão vê todo curso pago
        (ver `canSee` em lib/auth/roles.ts), então `released` nunca volta sem os
        restritos e a condição era inalcançável. Ficou só o texto, ensinando uma
        liberação por pessoa que não existe mais.
      */}
    </>
  );
}
