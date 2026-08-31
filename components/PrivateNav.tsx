"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GUIAS, privateGuideHref } from "@/lib/guias";

/**
 * A navegação da sidebar da área logada.
 *
 * É Client Component por um motivo só: marcar o item da página atual precisa
 * saber a rota atual, e `usePathname()` só existe no cliente. O layout que a
 * monta continua sendo Server Component.
 *
 * A prop é um booleano, e não a sessão. `Session` carrega `email`, `sub` e
 * `roles`, e tudo que entra num Client Component vai no HTML como payload
 * serializado do React — legível por qualquer extensão ou "ver código-fonte".
 * Para decidir se o item Admin existe, `isAdmin` basta; o resto não tem por que
 * atravessar a fronteira.
 */

type PrivateNavProps = {
  /** Só decide se o item Admin aparece. Não é permissão — ver comentário abaixo. */
  isAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
};

const ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel" },
  { href: "/perfil", label: "Meu perfil" },
];

/*
  O item some para quem não é admin, mas esconder link não é proteção: /admin
  devolve 404 por conta própria, e é lá que a decisão vale. Aqui é só para a
  navegação não oferecer uma porta que não abre.
*/
const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin" };

/** Prefixo das rotas de guia dentro da área logada. Casa com privateGuideHref. */
const GUIAS_BASE = "/painel/guias";

export default function PrivateNav({ isAdmin }: PrivateNavProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;
  // Guia tem item próprio na lista de baixo, e dois trilhos magenta acesos na
  // mesma coluna leem como dois lugares abertos ao mesmo tempo. A exceção é
  // desta linha para baixo, e só dela: /painel/cursos/x continua acendendo
  // "Painel", porque curso não tem item na sidebar para acender no lugar.
  const lendoGuia = pathname.startsWith(`${GUIAS_BASE}/`);

  return (
    <>
    <nav className="app-nav" aria-label="Área logada">
      {items.map((item) => {
        // O prefixo com barra cobre as sub-rotas que ainda vão nascer
        // (/painel/algo mantém "Painel" aceso) sem que /painelzinho case por
        // acidente com um `startsWith` cru.
        const active =
          !lendoGuia &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            className={active ? "app-nav__link is-active" : "app-nav__link"}
            href={item.href}
            /*
              Quem enxerga a tela vê a barrinha e a cor; quem usa leitor de tela
              não vê nenhuma das duas. O `aria-current` é o que diz, em voz alta,
              qual item é a página aberta — e sai do DOM nos outros, porque
              `aria-current="false"` seria anunciado do mesmo jeito por parte
              dos leitores.
            */
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>

    {/*
      Os guias mudaram de lado, e o motivo é uma frase que deixou de ser
      verdade. Eles moravam no layout, Server Component, com este comentário:
      "guia nunca vai ser página aberta — são arquivos estáticos, sem rota,
      então não há item atual para acender". Desde que existe
      `/painel/guias/[slug]`, guia TEM rota e TEM item atual, e acender o item
      certo precisa da rota atual — que é `usePathname()`, que só existe aqui.

      O custo é o esperado: sete links a mais no bundle do cliente, todos texto
      curto. O ganho é a sidebar saber onde a pessoa está.
    */}
    <div className="app-guides">
      <span className="app-guides__label" id="rotulo-guias">
        Guias
      </span>
      <nav className="app-guides__list" aria-labelledby="rotulo-guias">
        {GUIAS.map((guia) => {
          const href = privateGuideHref(guia.slug);
          const active = pathname === href;

          return (
            <Link
              className={active ? "app-guides__link is-active" : "app-guides__link"}
              href={href}
              key={guia.slug}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{guia.emoji}</span>
              {guia.nome}
            </Link>
          );
        })}
      </nav>
    </div>
    </>
  );
}
