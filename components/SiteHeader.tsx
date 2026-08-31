import Link from "next/link";
import AccessButton from "@/components/AccessButton";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a
        className="brand-link"
        href="https://umlequedetecnologia.com.br"
        aria-label="Um leque de tecnologia — página inicial"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/logo-nickdeve.svg" alt="" />
        <span className="word">NickDev</span>
      </a>

      {/*
        Âncoras absolutas, com a barra. Este cabeçalho também é o das páginas
        de curso e o da área logada, e ali "#cursos" sozinho procuraria uma
        seção que não existe na página atual.
      */}
      <nav className="site-nav" aria-label="Navegação principal">
        <Link className="nav-link" href="/#cursos">
          Cursos
        </Link>
        <Link className="nav-link" href="/#guias">
          Guias
        </Link>
        {/* Só este pedaço do cabeçalho é cliente; o resto segue estático. */}
        <AccessButton />
      </nav>
    </header>
  );
}
