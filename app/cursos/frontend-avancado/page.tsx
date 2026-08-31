import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import FrontendAvancado from "@/components/cursos/FrontendAvancado";

export const metadata: Metadata = {
  title: "Frontend Avançado · NickDev",
  description:
    "Curso de frontend avançado em 16 aulas de 4 horas: revisão de HTML, CSS, JavaScript e TypeScript, Angular 22 com signals e zoneless, e Next.js com App Router — construindo o mesmo projeto duas vezes.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/FrontendAvancado` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/frontend-avancado`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <FrontendAvancado />

      <Footer withHome />
    </>
  );
}
