import Link from "next/link";

type FooterProps = {
  /** Quando true, mostra o link "voltar ao início" (usado nas páginas internas). */
  withHome?: boolean;
};

export default function Footer({ withHome = false }: FooterProps) {
  return (
    <footer className="footer">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/logo-nickdeve.svg" alt="" />
        <span className="word">NickDev</span>
        <span className="tag">um leque de tecnologia</span>
      </div>
      {withHome && (
        <Link className="home" href="/">
          ← voltar ao início
        </Link>
      )}
      <span className="copy">© 2026 NickDev — feito com código aberto.</span>
    </footer>
  );
}
