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
    </header>
  );
}
