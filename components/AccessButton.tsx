"use client";

import { useEffect, useState } from "react";

/**
 * O acesso no canto direito do cabeçalho.
 *
 * Por que isto é Client Component, e não um `readSession()` no SiteHeader:
 * o cabeçalho aparece em todas as páginas do site. Ler o cookie no servidor
 * usa `cookies()`, e `cookies()` torna dinâmica qualquer página que o alcance.
 * O build hoje gera as 10 rotas como estáticas — todas elas sairiam do
 * prerender só para desenhar um link de duas palavras.
 *
 * O custo que eu escolhi pagar foi o outro: um `fetch` pequeno no cliente,
 * em `/api/me`, que não devolve token, e-mail nem roles. Se um dia a área
 * logada crescer a ponto de o estático não valer mais a pena, a troca é de
 * uma linha: o SiteHeader chama `readSession()` e renderiza o link direto.
 */

type AccessState = "loading" | "anonymous" | "authenticated";

export default function AccessButton() {
  const [state, setState] = useState<AccessState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    // Rede caindo, 500, JSON estranho: tudo termina em "deslogado". Este
    // botão não autoriza nada — quem autoriza é o Server Component da página
    // logada. Errar para o lado do "Entrar" não abre buraco, e o cabeçalho
    // continua de pé.
    fetch("/api/me", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<unknown>) : null))
      .then((data: unknown) => {
        const authenticated =
          typeof data === "object" &&
          data !== null &&
          "authenticated" in data &&
          data.authenticated === true;
        setState(authenticated ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("anonymous");
      });

    return () => controller.abort();
  }, []);

  // Enquanto a resposta não chega, nada. Mostrar "Entrar" e trocar por "Meu
  // perfil" meio segundo depois pisca na cara de quem já entrou.
  //
  // Nada visível, mas o espaço é reservado: devolver `null` fazia o pill
  // nascer do nada e empurrar o cabeçalho quando o fetch voltava. Um <span>
  // com as mesmas classes ocupa a mesma caixa desde o primeiro pixel — e é
  // <span>, não <a>, para não virar parada de teclado nem link sem destino.
  if (state === "loading") {
    return (
      <span className="mat primary access-link access-placeholder" aria-hidden="true">
        Entrar
      </span>
    );
  }

  // Âncora comum, não `<Link>`: `/entrar` é um Route Handler que gera PKCE,
  // grava cookies e redireciona para o Keycloak. O prefetch do Next dispararia
  // esse handler no hover, sem ninguém ter clicado.
  //
  // `mat primary` nos dois estados: é o pill com gradiente da marca, e é o
  // único item de peso do cabeçalho. Deixar "Meu perfil" mais discreto que
  // "Entrar" faria o cabeçalho mudar de aparência conforme quem está olhando.
  if (state === "authenticated") {
    return (
      <a className="mat primary access-link" href="/perfil">
        Meu perfil
      </a>
    );
  }

  return (
    <a className="mat primary access-link" href="/entrar">
      Entrar
    </a>
  );
}
