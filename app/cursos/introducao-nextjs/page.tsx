import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import IntroducaoNextjs from "@/components/cursos/IntroducaoNextjs";

export const metadata: Metadata = {
  title: "Introdução ao Next.js · NickDev",
  description:
    "Curso de Next.js do zero, sem pré-requisito de React: componentes, App Router, Server Components, data fetching, Server Actions, autenticação, performance, testes e deploy com CI/CD.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/IntroducaoNextjs` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/introducao-nextjs`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <IntroducaoNextjs />

      <Footer withHome />
    </>
  );
}
