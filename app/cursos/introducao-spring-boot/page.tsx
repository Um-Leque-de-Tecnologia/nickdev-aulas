import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import IntroducaoSpringBoot from "@/components/cursos/IntroducaoSpringBoot";

export const metadata: Metadata = {
  title: "Introdução ao Spring Boot · NickDev",
  description:
    "Curso de introdução ao Spring Boot: injeção de dependência, API REST, Spring Data JPA, validação, segurança com JWT, testes, observabilidade, Docker e deploy.",
};

/**
 * A landing publica do curso -- so a moldura.
 *
 * O conteudo mora em `components/cursos/IntroducaoSpringBoot` porque esta mesma pagina
 * existe duas vezes: aqui, aberta a qualquer um, com o cabecalho e o rodape
 * do site; e dentro da area logada, em `/painel/cursos/introducao-spring-boot`, onde quem
 * da a navegacao e a sidebar. So a moldura muda entre as duas.
 */
export default function Page() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <IntroducaoSpringBoot />

      <Footer withHome />
    </>
  );
}
