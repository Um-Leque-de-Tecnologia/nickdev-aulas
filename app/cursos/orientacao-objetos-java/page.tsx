import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import OrientacaoObjetosJava from "@/components/cursos/OrientacaoObjetosJava";

export const metadata: Metadata = {
  title: "Orientação a Objetos com Java · NickDev",
  description:
    "Curso de Orientação a Objetos com Java: do ecossistema Java e do primeiro programa aos quatro pilares de OO, coleções, exceções, generics, lambdas, persistência e arquitetura em camadas.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/OrientacaoObjetosJava` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/orientacao-objetos-java`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <OrientacaoObjetosJava />

      <Footer withHome />
    </>
  );
}
