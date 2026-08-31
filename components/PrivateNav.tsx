"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function PrivateNav({ isAdmin }: PrivateNavProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;

  return (
    <nav className="app-nav" aria-label="Área logada">
      {items.map((item) => {
        // O prefixo com barra cobre as sub-rotas que ainda vão nascer
        // (/painel/algo mantém "Painel" aceso) sem que /painelzinho case por
        // acidente com um `startsWith` cru.
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

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
  );
}
