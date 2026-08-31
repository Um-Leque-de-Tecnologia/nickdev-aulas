import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import GuiaScripts from "@/components/GuiaScripts";
import { carregaGuia } from "@/lib/guia-inline";
import { guiaBySlug, hrefDoGuia } from "@/lib/guias";
import { readSession } from "@/lib/auth/session";

/**
 * O guia visto de dentro da área logada.
 *
 * Gêmeo de `/painel/cursos/[slug]`, com uma diferença que manda no resto: o
 * conteúdo do curso é um componente React deste repositório, e o do guia não —
 * é um HTML inteiro, com CSS e script próprios, servido pelo CDN.
 *
 * Ele entra na página desmontado, e não num `<iframe>`. O iframe dava o
 * isolamento de CSS de graça, mas cobrava o preço que se vê na tela: o guia
 * ficava preso num retângulo com barra de rolagem própria dentro da rolagem da
 * página, e o índice dele rolava junto com o texto em vez de acompanhar a
 * leitura. `lib/guia-inline.ts` faz o isolamento na mão, reescrevendo o CSS do
 * guia para não sair de `.guia`.
 *
 * A tela fica em três faixas: a sidebar do app à esquerda, o texto do guia
 * correndo no meio e o índice do próprio guia preso à direita da tela inteira
 * — não da coluna de conteúdo. Ver `.guia__indice` em globals.css.
 *
 * E a faixa do meio é só o guia: esta rota não desenha título, resumo nem
 * "voltar", e a ausência é decisão. Os três eram repetição do que já está na
 * tela — o guia abre com o título e a linha de abertura DELE, e a sidebar já
 * mostra qual guia está aceso e leva ao painel em um clique. Somados, comiam a
 * primeira dobra de um documento que é para ser lido, e empurravam o começo do
 * texto para baixo do fim da tela.
 */

type Props = {
  /** No Next 16 `params` é Promise, e precisa de `await`. */
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guia = guiaBySlug(slug);

  // O `robots: noindex` do layout de (private) é herdado sem repetir aqui.
  return { title: guia ? `${guia.nome} · Guias · NickDev` : "Guia · NickDev" };
}

export default async function PrivateGuidePage({ params }: Props) {
  const { slug } = await params;

  // O layout já barrou quem não tem sessão. Repito pelo mesmo motivo do
  // /painel e do /painel/cursos: layout não entrega valor para a página, e uma
  // página que se protege sozinha continua protegida se mudar de pasta.
  const session = await readSession();
  if (!session) redirect("/entrar");

  const guia = guiaBySlug(slug);
  // Slug fora do catálogo é 404 do app, com a moldura do app.
  if (!guia) notFound();

  const conteudo = await carregaGuia(guia.slug);

  return (
    <>
      {conteudo === null ? (
        /*
          O CDN fora do ar não pode virar página quebrada: o guia continua
          existindo em página inteira, e o link para ele é a saída honesta.
        */
        <p className="guia__erro">
          O guia não respondeu agora.{" "}
          <a href={hrefDoGuia(guia.slug)} target="_blank" rel="noopener noreferrer">
            Abrir direto no CDN ↗
          </a>
        </p>
      ) : (
        <>
          {/*
            O CSS do guia, já reescrito para não escapar de `.guia`. Entra na
            página e não num `<link>` porque ele chegou embutido no documento
            do CDN — não existe arquivo separado para apontar.
          */}
          <style dangerouslySetInnerHTML={{ __html: conteudo.css }} />

          <div className="guia-doc">
            {/*
              `<aside>` com um `<nav>` dentro, e `<main>` para o texto: são os
              mesmos elementos do documento original, e isso não é capricho de
              semântica. O CSS do guia estiliza o índice por `aside nav a` e o
              texto por `main` — trocar por `<div>` deixaria os dois sem estilo
              nenhum, porque o escopador reescreve o seletor, não o elemento.

              O índice vem ANTES do texto no HTML, como no original: quem navega
              por teclado ou leitor de tela encontra o sumário antes de entrar
              num texto de 70 KB. Estar à direita é pintura, e quem pinta é o CSS.
            */}
            <aside className="guia__indice">
              <span className="guia__indice-titulo">Neste guia</span>
              <nav
                aria-label={`Índice do guia de ${guia.nome}`}
                dangerouslySetInnerHTML={{ __html: conteudo.indice }}
              />
            </aside>

            <main
              className="guia__texto"
              dangerouslySetInnerHTML={{ __html: conteudo.conteudo }}
            />

            {/*
              O "voltar ao topo" do proprio guia, e ele nao e enfeite: o script
              do documento faz `document.getElementById('totop')` e pendura um
              `scroll` que liga a classe `show`. Sem o elemento na pagina, aquele
              ouvinte estourava `Cannot read properties of null` A CADA EVENTO DE
              ROLAGEM — dezenas de excecoes por tela rolada, e o console
              inutilizado para achar qualquer outro erro.

              Renderizar era melhor que remendar: o elemento existe no documento
              original, o script dele espera exatamente este `id`, e num texto
              deste tamanho um atalho para o topo faz falta. A aparencia vem do
              CSS do app (`.guia-doc .totop`), porque o do guia so traz o estado
              `.show` e o `:hover` — a regra base nao veio no arquivo.
            */}
            <a className="totop" id="totop" href="#" aria-label="Voltar ao topo">
              ↑
            </a>
          </div>

          <GuiaScripts codigo={conteudo.script} />
        </>
      )}
    </>
  );
}
