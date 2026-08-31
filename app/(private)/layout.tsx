import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PrivateNav from "@/components/PrivateNav";
import Footer from "@/components/Footer";
import { readSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { isDevLoginEnabled } from "@/lib/auth/dev";

export const metadata: Metadata = {
  // Área logada não entra em buscador. As páginas filhas herdam isto e só
  // trocam o título.
  robots: { index: false, follow: false },
};

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();

  // Segunda barreira, e a única que vale. O proxy.ts já devolveu para o
  // /entrar quem chegou sem cookie, mas ele nem abre o cookie — quem traz um
  // `nd_session` inventado, expirado ou cifrado com outro segredo só é barrado
  // aqui, onde a sessão é de fato decifrada.
  if (!session) redirect("/entrar");

  // Cinto e suspensório. O atalho já se recusa a criar esta sessão com ele
  // desligado, e `readSession()` já devolve `null` para a marca `dev` no mesmo
  // caso — então esta linha é inalcançável hoje, de propósito. Ela é a que
  // sobra se um dia alguém afrouxar a de lá: um cookie forjado, copiado à mão
  // ou sobrevivente de um ambiente que herdou o mesmo SESSION_SECRET, não pode
  // abrir a área logada nem por acidente. A condição é a mesma dos outros dois
  // pontos — `isDevLoginEnabled()`, e não um `NODE_ENV` solto — para as três
  // barreiras não poderem discordar entre si.
  if (session.dev && !isDevLoginEnabled()) redirect("/entrar");

  const admin = isAdmin(session);

  return (
    <>
      {/*
        Aqui dentro NÃO entra o <SiteHeader />, e é decisão, não esquecimento.
        O cabeçalho traz marca, navegação e o pill de acesso — que, para quem
        já entrou, é um "Meu perfil". A sidebar traz marca, navegação e o bloco
        da pessoa. Os dois juntos põem duas marcas e duas navegações na mesma
        tela, com um "Meu perfil" no topo apontando para o mesmo lugar que o
        "Meu perfil" da lateral: a pessoa passa a ter que escolher entre dois
        caminhos idênticos, e o leitor de tela anuncia dois landmarks de
        navegação para um app com três telas. Na área logada quem manda é a
        sidebar; o cabeçalho continua inteiro nas páginas públicas.
      */}
      <div className="app-shell">
        <div className="app-sidebar">
          {/*
            A marca leva para o /painel — e não para o site institucional, como
            no SiteHeader, nem para a home pública. Quem está logado clicando na
            marca quer voltar para a casa deste app, não sair dele; e desde que
            o proxy.ts desvia o "/" de quem tem sessão, apontar para lá seria
            pedir um redirect para chegar no mesmo lugar.
          */}
          <Link
            className="app-sidebar__brand"
            href="/painel"
            aria-label="NickDev Aulas — painel"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/logo-nickdeve.svg" alt="" />
            <span className="word">NickDev</span>
          </Link>

          {/*
            Só o booleano atravessa para o cliente. A sessão inteira levaria
            e-mail, `sub` e roles no payload do React, à vista de qualquer um.
          */}
          <PrivateNav isAdmin={admin} />

          <div className="app-user">
            <div className="app-user__id">
              {/* O Keycloak nem sempre devolve `name`; sem ele, o rótulo do
                  tipo de conta ainda identifica quem está na tela. */}
              {session.name.trim() !== "" && (
                <span className="app-user__name">{session.name}</span>
              )}
              <span className="app-user__role">
                {admin ? "Administrador" : "Aluno"}
              </span>
            </div>

            {/*
              Formulário com POST, e não um link. /sair não aceita GET de
              propósito: logout por GET qualquer site consegue disparar com um
              <img src="/sair">, e a pessoa é deslogada sem ter clicado em nada.
            */}
            <form method="post" action="/sair">
              <button className="mat" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>

        <div className="app-main">
          {/*
            A faixa só aparece na sessão de mentira: login de verdade não grava
            a marca `dev`, então ela some sozinha no dia em que o Keycloak
            entrar. Ela mora na coluna do conteúdo, e não acima do shell, para
            avisar exatamente sobre o que está sendo mostrado ali.
            Os links são âncoras comuns, e não <Link> — /entrar é um Route
            Handler, e o prefetch do Next o dispararia no hover, trocando a
            sessão de quem só passou o mouse por cima.
          */}
          {session.dev && (
            <aside className="dev-banner">
              <strong>Sessão de mentira.</strong> Você entrou pelo atalho de
              desenvolvimento, sem passar pelo Keycloak. Nada nesta tela é dado
              real: nome, e-mail e cursos liberados são inventados em{" "}
              <code className="mono">lib/auth/dev.ts</code>.
              <span className="dev-banner__switch">
                Vendo como <strong>{admin ? "admin" : "aluno comum"}</strong>
                {" · "}
                <a href="/entrar?dev=aluno">ver como aluno</a>
                {" · "}
                <a href="/entrar">ver como admin</a>
              </span>
            </aside>
          )}

          {children}
        </div>
      </div>

      {/*
        O rodapé escapa do `.wrap` pelo mesmo caminho que o `.app-shell`, senão
        ele ficaria preso em 1100px sob um conteúdo que vai de ponta a ponta —
        e o filete de cima dele pararia no meio da tela.
      */}
      <div className="app-footer">
        <Footer withHome homeHref="/painel" />
      </div>
    </>
  );
}
