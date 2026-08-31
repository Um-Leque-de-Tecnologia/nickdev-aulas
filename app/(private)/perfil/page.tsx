import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { coursesFor, isAdmin } from "@/lib/auth/roles";
import { isKeycloakConfigured, readConfig } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Meu perfil · NickDev",
};

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) redirect("/entrar");

  const released = coursesFor(session);

  // O Worker roda em UTC. O fuso está fixo em São Paulo porque é o fuso de
  // quem assiste às aulas — sem isso a hora sai três horas adiantada para
  // todo mundo, e a pessoa não entende por que "expira" antes do combinado.
  const expiresAt = new Date(session.expiresAt * 1000).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });

  // A conta mora no Keycloak, não aqui. O link vai direto para o console de
  // conta dele — e só existe quando há um Keycloak para apontar. Sem ele,
  // `readConfig()` lançaria e derrubaria a página inteira, justamente no modo
  // que existe para olhar a área logada antes de configurar o login.
  const keycloakReady = isKeycloakConfigured();
  const accountUrl = keycloakReady ? `${readConfig().issuer}/account` : null;

  return (
    <>
      <div className="eyebrow">Sua conta</div>
      <h1>Meu perfil</h1>
      <p className="lead">
        O que a sua sessão sabe sobre você neste momento.
      </p>
      <div className="brand-rule" />

      <div className="section-label">Dados da sessão</div>
      <div className="card">
        <dl className="data-list">
          <div>
            <dt>Nome</dt>
            <dd>{session.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{session.email}</dd>
          </div>
          <div>
            <dt>Identificador da conta</dt>
            <dd className="mono">{session.sub}</dd>
          </div>
          <div>
            <dt>Tipo de conta</dt>
            <dd>{isAdmin(session) ? "Administrador" : "Aluno"}</dd>
          </div>
          <div>
            <dt>Cursos liberados</dt>
            <dd>
              {released.length > 0
                ? released.map((c) => c.name).join(" · ")
                : "Nenhum por enquanto."}
            </dd>
          </div>
          <div>
            <dt>Esta sessão vale até</dt>
            <dd>{expiresAt}</dd>
          </div>
        </dl>
      </div>

      <div className="section-label">Mudar seus dados</div>
      <div className="card">
        <p>
          Nome, e-mail e senha não se alteram por aqui. Quem guarda a sua conta
          é o Keycloak, e é lá que você troca essas informações — inclusive a
          senha e a verificação em duas etapas.
        </p>
        {accountUrl ? (
          <>
            <div className="mats" style={{ marginTop: 18 }}>
              <a
                className="mat"
                href={accountUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir a minha conta ↗
              </a>
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-3)" }}>
              Trocou alguma coisa lá? Saia e entre de novo para a sessão daqui
              pegar o dado novo.
            </p>
          </>
        ) : (
          <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-3)" }}>
            O Keycloak ainda não está ligado neste ambiente, então não há
            console de conta para abrir daqui.
          </p>
        )}
      </div>

      <div className="section-label">Sair</div>
      <div className="card">
        <p>
          {keycloakReady
            ? "Sair apaga a sessão deste navegador e encerra a sua sessão no Keycloak também."
            : "Sair apaga a sessão deste navegador. Enquanto o Keycloak não estiver ligado, não há sessão do lado dele para encerrar."}
        </p>
        {/*
          Formulário com POST, e não um link. /sair não aceita GET de
          propósito: logout por GET qualquer site consegue disparar com um
          <img src="/sair">, e a pessoa é deslogada sem ter clicado em nada.
        */}
        <form method="post" action="/sair" style={{ marginTop: 18 }}>
          <button className="glow-btn" type="submit">
            Sair da minha conta
          </button>
        </form>
      </div>
    </>
  );
}
