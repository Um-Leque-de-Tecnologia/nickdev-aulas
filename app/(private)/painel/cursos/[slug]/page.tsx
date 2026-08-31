import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { courseContentFor } from "@/components/cursos";
import { courseBySlug } from "@/lib/cursos";
import { readSession } from "@/lib/auth/session";
import { canSee } from "@/lib/auth/roles";

/**
 * O curso visto de dentro da área logada.
 *
 * É o mesmo conteúdo da landing pública — o componente é literalmente o mesmo
 * arquivo. O que muda é a moldura: aqui não entra SiteHeader nem Footer,
 * porque o layout de `(private)` já põe a sidebar de um lado e o rodapé
 * embaixo. Quem entrou não perde a navegação ao abrir um curso, que era o
 * buraco de mandar o painel para `/cursos/<slug>`.
 *
 * Uma rota dinâmica só, e não seis páginas: o conteúdo já está registrado em
 * `components/cursos`, e seis arquivos idênticos a menos de um import seriam
 * seis lugares para esquecer de mexer.
 */

type Props = {
  /** No Next 16 `params` é Promise, e precisa de `await`. */
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = courseBySlug(slug);

  // O `robots: noindex` do layout de (private) é herdado sem repetir aqui.
  return { title: course ? `${course.name} · NickDev` : "Curso · NickDev" };
}

export default async function PrivateCoursePage({ params }: Props) {
  const { slug } = await params;

  // O layout já barrou quem não tem sessão. Repito pelo mesmo motivo do
  // /painel: layout não entrega valor para a página, e uma página que se
  // protege sozinha continua protegida se um dia mudar de pasta.
  const session = await readSession();
  if (!session) redirect("/entrar");

  const course = courseBySlug(slug);
  const Content = course ? courseContentFor(course.slug) : undefined;

  // Duas checagens, duas causas diferentes: slug que não existe no catálogo, e
  // slug que existe mas ainda não tem conteúdo registrado. As duas dão 404
  // porque, para quem está na tela, não há diferença entre um curso que não
  // existe e um que não tem página.
  if (!course || !Content) notFound();

  // Hoje `canSee` libera todo curso para qualquer sessão, então esta linha não
  // barra ninguém. Ela existe para o dia em que voltar a existir curso que só
  // alguns veem: sem ela, bastaria digitar o slug na barra de endereços para
  // ler por dentro um curso que o painel nem lista.
  if (!canSee(session, course)) notFound();

  return (
    <>
      {/*
        Volta para o /painel, e não para a home pública como na landing aberta.
        Quem está aqui dentro chegou pela lista de cursos da área logada, e é
        para lá que "voltar" precisa levar.
      */}
      <Link className="backlink" href="/painel">
        ← meus cursos
      </Link>

      <Content />
    </>
  );
}
