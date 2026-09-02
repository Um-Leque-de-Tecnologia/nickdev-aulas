import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import FrontendTransicao from "@/components/cursos/FrontendTransicao";

export const metadata: Metadata = {
  title: "Introdução ao Frontend · NickDev",
  description:
    "Curso de frontend para transição de carreira: HTML, CSS, JavaScript, design, React e Next.js — do primeiro site ao projeto publicado.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/FrontendTransicao` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/frontend-transicao`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <FrontendTransicao />

      <Footer withHome />
    </>
  );
}
