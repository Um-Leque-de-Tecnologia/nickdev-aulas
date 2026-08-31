import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import NextjsIA from "@/components/cursos/NextjsIA";

export const metadata: Metadata = {
  title: "Next.js + IA · NickDev",
  description:
    "Curso de Next.js com IA em 8 aulas, no formato de simulação de trabalho: sprints, tickets, pull requests e code review. Construindo o LequePlay sobre uma API real, da correção de bugs à feature de IA em produção.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/NextjsIA` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/nextjs-ia`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <NextjsIA />

      <Footer withHome />
    </>
  );
}
