"use client";

import { useEffect } from "react";

/**
 * Executa o script que veio junto com o guia.
 *
 * Existe por uma regra do navegador: marcação inserida por `innerHTML` — que é
 * o que o `dangerouslySetInnerHTML` da página faz — nunca executa `<script>`.
 * Sem isto, o guia apareceria inteiro e morto: os botões "copiar" não copiam e
 * as prévias ao vivo, que o próprio script monta a partir dos atributos
 * `data-src`, ficariam em branco.
 *
 * Criar um `<script>` de verdade e pendurá-lo no documento é o caminho que o
 * navegador aceita. Roda depois da montagem, quando o conteúdo do guia já está
 * no DOM — o script procura os elementos dele por `querySelectorAll`, e correr
 * antes não acharia nada.
 *
 * O código não é entrada de usuário: vem do nosso CDN, escrito por nós, no
 * mesmo arquivo de onde saiu o texto que está sendo mostrado ao lado.
 */

type GuiaScriptsProps = {
  /** O conteúdo dos `<script>` do guia, já concatenado. */
  codigo: string;
};

export default function GuiaScripts({ codigo }: GuiaScriptsProps) {
  useEffect(() => {
    if (codigo.trim() === "") return;

    const elemento = document.createElement("script");

    /* Embrulhado numa IIFE, e isto conserta um erro que matava o script todo.
     *
     * O script do guia declara no topo dele `const baseDaPrevia`, `const frame`,
     * `const tt`. Executado como está, isso vai para o escopo global — e escopo
     * global não se desfaz: `elemento.remove()`, no cleanup abaixo, tira a TAG do
     * documento e não as declarações que ela já fez.
     *
     * Então a segunda execução redeclarava e estourava
     * `Identifier 'baseDaPrevia' has already been declared`, que é SyntaxError:
     * não falha só aquela linha, falha o arquivo inteiro. Resultado visível —
     * botão "copiar" que não copia e prévia ao vivo em branco. E a segunda
     * execução acontece sempre: o StrictMode monta, desmonta e remonta todo
     * efeito em desenvolvimento, e em produção basta navegar de um guia para
     * outro.
     *
     * Dentro da IIFE, cada execução tem escopo próprio e as anteriores não
     * atrapalham. É seguro porque nada no HTML do guia chama função do script
     * por atributo (`onclick="..."`): se chamasse, a função precisaria ficar
     * global e o embrulho a esconderia. */
    elemento.textContent = `(() => {\n${codigo}\n})();`;
    document.body.appendChild(elemento);

    // Na saída o script sai junto. Os ouvintes que ele pendurou morrem com os
    // elementos do guia, que deixam o DOM na mesma navegação.
    return () => elemento.remove();
  }, [codigo]);

  return null;
}
