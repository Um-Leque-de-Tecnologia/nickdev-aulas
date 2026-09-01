import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import IntroducaoGithub from "@/components/cursos/IntroducaoGithub";

export const metadata: Metadata = {
  title: "Introdução ao GitHub · NickDev",
  description:
    "Curso de Git e GitHub do zero: commits, branches, conflitos, remoto, issues, Pull Request, code review, GitHub Actions, branch protection, releases e deploy contínuo.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/IntroducaoGithub` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/introducao-github`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <IntroducaoGithub />

      <Footer withHome />
    </>
  );
}
