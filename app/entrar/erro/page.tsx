import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Não deu para entrar · NickDev",
  robots: { index: false, follow: false },
};

/**
 * O `motivo` vem de /entrar/retorno, que já traduziu o erro cru para um dos
 * seus quatro valores. Aqui cada um vira uma frase; qualquer outra coisa cai
 * na genérica — inclusive URL montada à mão por curiosidade.
 *
 * Nada de detalhe técnico na tela: state que não bateu, claim faltando e
 * corpo de resposta do Keycloak não ajudam quem só quer assistir aula, e
 * ajudam demais quem está fuçando. Esse detalhe fica no log do servidor.
 */
const REASONS: Record<string, string | undefined> = {
  acesso_negado: "O acesso foi negado, ou o login foi cancelado no meio.",
  login_falhou: "O serviço de contas não concluiu o login desta vez.",
  pedido_invalido: "O pedido de login expirou no caminho de volta.",
  token_invalido: "A resposta do login não passou na conferência.",
};

const FALLBACK = "O login começou, mas não chegou até o fim.";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = params.motivo;
  const reason = Array.isArray(raw) ? raw[0] : raw;
  const message = (reason && REASONS[reason]) || FALLBACK;

  return (
    <>
      <SiteHeader />

      <div className="eyebrow">Entrar</div>
      <h1>Não deu para entrar.</h1>
      <p className="lead">{message}</p>
      <div className="brand-rule" />

      <div className="card" style={{ marginTop: 32 }}>
        <h3>O que fazer agora</h3>
        <p style={{ marginTop: 10 }}>
          Tente de novo — na maioria das vezes é a segunda tentativa que
          resolve. Se acontecer outra vez, feche a aba, abra de novo e refaça o
          login. Continuou? Me chame e diga a que horas foi: com o horário eu
          acho o que aconteceu do lado do servidor.
        </p>
        <div className="mats" style={{ marginTop: 18 }}>
          {/*
            <a> comum, e não <Link>: /entrar é um Route Handler que gera
            state, nonce e verifier e redireciona para o Keycloak. O prefetch
            do <Link> dispararia esse trabalho antes do clique e trocaria os
            cookies temporários por baixo da pessoa.
          */}
          <a className="mat primary" href="/entrar">
            Tentar de novo
          </a>
        </div>
      </div>

      <Footer withHome />
    </>
  );
}
