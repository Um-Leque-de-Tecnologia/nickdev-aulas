import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Admin · NickDev",
};

type PlannedItem = {
  n: string;
  title: string;
  description: string;
};

const PLANNED: PlannedItem[] = [
  {
    n: "01",
    title: "Cadastrar cursos",
    description: "Hoje a lista de cursos mora em lib/cursos.ts e muda com um commit. Vai virar cadastro quando houver onde guardar.",
  },
  {
    n: "02",
    title: "Publicar artigos",
    description: "Escrever, revisar e publicar sem passar pelo editor de código.",
  },
  {
    n: "03",
    title: "Ver usuários",
    description: "Quem entrou, quando, e o que cada conta abre.",
  },
  {
    n: "04",
    title: "Liberar acesso a curso",
    description: "Marcar o acesso da pessoa por aqui, em vez de abrir o console do Keycloak.",
  },
];

export default async function AdminPage() {
  const session = await readSession();

  // 404, e não 403. Um 403 confirma que /admin existe e que alguém tem essa
  // permissão — informação de graça para quem está fuçando. Para quem não é
  // admin, esta rota não existe.
  if (!isAdmin(session)) notFound();

  return (
    <>
      <div className="eyebrow">Administração</div>
      <h1>Admin</h1>
      <p className="lead">
        O esqueleto do que vem. Nada aqui funciona ainda — está escrito para
        você saber o que está no plano e o que ainda é trabalho manual.
      </p>
      <div className="brand-rule" />

      <div className="section-label">No plano</div>
      <div className="lessons">
        {PLANNED.map((item) => (
          <div className="lesson soon" key={item.n}>
            <div className="idx">{item.n}</div>
            <div className="body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="soon-tag">em breve</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-label">Como se libera acesso hoje</div>
      <div className="card">
        <p>
          Pelo console do Keycloak. Abra a pessoa em <em>Users</em>, vá em{" "}
          <em>Role mapping</em> e atribua a role do client{" "}
          <span className="mono">curso-&lt;slug&gt;</span> — o slug é o mesmo da
          pasta do curso, então o Next.js + IA é{" "}
          <span className="mono">curso-nextjs-ia</span>. A role{" "}
          <span className="mono">admin</span> é a que abre esta tela.
        </p>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-3)" }}>
          A liberação entra na próxima vez que a pessoa entrar: as permissões
          são copiadas para o cookie de sessão no login, e o cookie não se
          atualiza sozinho.
        </p>
      </div>
    </>
  );
}
