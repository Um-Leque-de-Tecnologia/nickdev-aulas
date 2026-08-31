import Link from "next/link";

type FooterProps = {
  /** Quando true, mostra o link "voltar ao início" (usado nas páginas internas). */
  withHome?: boolean;
  /**
   * Para onde o "voltar ao início" aponta. O padrão é a home pública; a área
   * logada manda o /painel, porque para quem tem sessão o proxy.ts desvia o "/"
   * e o link gastaria um redirect para terminar no mesmo lugar.
   */
  homeHref?: string;
};

export default function Footer({ withHome = false, homeHref = "/" }: FooterProps) {
  return (
    <footer className="footer">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/logo-nickdeve.svg" alt="" />
        <span className="word">NickDev</span>
        <span className="tag">um leque de tecnologia</span>
      </div>
      {withHome && (
        <Link className="home" href={homeHref}>
          ← voltar ao início
        </Link>
      )}
      <span className="copy">© 2026 NickDev — feito com código aberto.</span>
    </footer>
  );
}
