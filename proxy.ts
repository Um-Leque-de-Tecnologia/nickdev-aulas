import { NextResponse, type NextRequest } from "next/server";
import { refreshAccessToken } from "@/lib/auth/keycloak";
import { isExpiring } from "@/lib/auth/tokens";
import { privateCourseHref } from "@/lib/cursos";
import {
  clearTokensCookies,
  cookieOptions,
  decryptSession,
  decryptTokens,
  encryptSession,
  encryptTokens,
  ID_TOKEN_COOKIE,
  joinTokensCookie,
  SESSION_COOKIE,
  splitTokensCookie,
  TOKENS_COOKIE_NAMES,
  writeTokensCookies,
  type Session,
  type Tokens,
} from "@/lib/auth/session";

/**
 * Atalho de navegação e renovação de token — isto NÃO é autorização.
 *
 * Duas coisas acontecem aqui, e nenhuma das duas decide quem você é:
 *
 * 1. sem cookie de sessão, a pessoa vai para o /entrar em vez de bater numa
 *    tela que não vai carregar;
 * 2. com o access token do Keycloak vencendo, ele é trocado por um novo e o
 *    cookie de tokens é regravado na resposta — porque Server Component não
 *    grava cookie no Next, e o proxy é o único lugar que roda ANTES da página e
 *    ainda escreve na resposta dela.
 *
 * O passo 2 deixou este arquivo esperto, e é exatamente aí que mora o risco de
 * alguém achar que ele virou o guardião da área logada. Não virou, e a
 * diferença é a coisa mais importante escrita aqui: renovar token é manter uma
 * credencial em dia; autorizar é decidir se a pessoa entra.
 *
 * Nas três rotas privadas o proxy não abre o cookie de SESSÃO, não confere
 * assinatura e não sabe quem você é — um `nd_session` falsificado, com qualquer
 * lixo dentro, passa por estas linhas sem tropeçar, e quem o barra é o
 * `readSession()` do Server Component. O que ele abre ali é o cookie de TOKENS,
 * que não diz quem a pessoa é nem o que ela pode ver: diz só quando a
 * credencial vence e com o que trocá-la.
 *
 * A exceção são as páginas públicas que têm gêmeo logado — a home e as landings
 * de curso, ver `gemeoLogado()`. Nelas o cookie de sessão é decifrado, mas para
 * responder "esta pessoa já entrou?" e escolher entre duas telas que qualquer um
 * pode ver: a versão aberta e a mesma tela dentro do shell, que se protege
 * sozinha ao chegar. Nenhuma permissão é decidida ali, e o erro cai para o lado
 * seguro: sessão que não abre vira página pública.
 *
 * Quem autoriza de verdade segue sendo o Server Component, chamando
 * `readSession()`: é lá que a sessão é decifrada e validada, é lá que o lixo
 * vira `null` e volta para o /entrar, e é `lib/auth/roles.ts` que decide o
 * resto. Se um dia as duas barreiras discordarem, a que vale é a de lá. Nunca
 * ponha regra de permissão neste arquivo.
 */

/*
 * Importar de lib/auth/session.ts deixou de ser problema — e antes era.
 *
 * A versão anterior deste arquivo repetia `"nd_session"` à mão para não
 * arrastar `jose` para dentro de um middleware que roda em toda navegação. Não
 * há mais o que evitar: para abrir o cookie de tokens o proxy PRECISA da mesma
 * cifra da sessão, então o módulo entra no bundle de qualquer jeito, e manter
 * uma segunda cópia dos nomes só criaria a chance de eles divergirem.
 *
 * O que continua fora de alcance são as funções que leem a jarra de cookies:
 * `readSession()` e `readTokens()` chamam `cookies()`, do `next/headers`, que
 * só existe dentro de uma requisição de página ou de Route Handler. O proxy não
 * é nenhum dos dois — ele lê do próprio request. Por isso a leitura aqui é
 * `decryptTokens(valor)`, que faz o mesmo trabalho a partir da string crua.
 */

/**
 * O teto de vida do cookie quando o Keycloak não diz até quando dá para
 * renovar. É o mesmo número e o mesmo motivo de
 * SESSION_FALLBACK_MAX_AGE_SECONDS, em app/entrar/retorno/route.ts: um arquivo
 * `route.ts` só pode exportar verbos HTTP, então a constante não tem como ser
 * compartilhada. Mudou lá, muda aqui.
 */
const REFRESH_FALLBACK_MAX_AGE_SECONDS = 8 * 60 * 60;

function tokensMaxAge(refreshExpiresIn: number | undefined): number {
  if (refreshExpiresIn === undefined || refreshExpiresIn <= 0) {
    return REFRESH_FALLBACK_MAX_AGE_SECONDS;
  }
  return refreshExpiresIn;
}

/**
 * Quanto vale o access token quando a resposta vem sem `expires_in`.
 *
 * O Keycloak sempre manda esse campo, então isto é rede de segurança, não
 * caminho normal. Mas o valor precisa ser MAIOR que a folga de `isExpiring()`:
 * gravar um vencimento colado no agora faria a próxima requisição achar que o
 * token acabou de nascer vencido, e cada navegação viraria uma renovação. Cinco
 * minutos é o tempo padrão de access token de um realm novo.
 */
const FALLBACK_ACCESS_LIFETIME_SECONDS = 5 * 60;

/**
 * Só o motivo da falha vai para o log, nunca o token.
 *
 * `refreshAccessToken()` já derruba o corpo da resposta do Keycloak antes de
 * montar a exceção, e a mensagem termina no código do OAuth 2 —
 * `...(HTTP 400): invalid_grant`. Este é o segundo portão, e ele é cego ao que
 * veio antes: pega o trecho depois do último dois-pontos e só o deixa passar se
 * couber no formato de um código do OAuth, que é minúscula e sublinhado.
 * Nenhum token tem essa forma; eles são longos e têm ponto, hífen e maiúscula.
 */
const OAUTH_ERROR_CODE = /^[a-z_]{1,40}$/;

function failureReason(cause: unknown): string {
  if (!(cause instanceof Error)) return "erro_desconhecido";
  const tail = cause.message.slice(cause.message.lastIndexOf(":") + 1).trim();
  return OAUTH_ERROR_CODE.test(tail) ? tail : cause.name;
}

function redirectToLogin(request: NextRequest): NextResponse {
  // O caminho original vai no `de=` para a pessoa cair onde queria depois de
  // entrar. Quem valida esse valor é o /entrar — redirect aberto se resolve
  // na leitura, não na escrita.
  const url = new URL("/entrar", request.url);
  url.searchParams.set("de", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

/**
 * Os caminhos públicos que têm uma versão logada do outro lado.
 *
 * Quem tem sessão não fica na versão aberta: a home devolve para o /painel, e a
 * landing de um curso devolve para o mesmo curso dentro do shell. A regra
 * destes caminhos é o espelho da dos outros itens do matcher — lá, sem sessão
 * sai; aqui, COM sessão sai.
 */
const HOME_PUBLICA = "/";
const HOME_LOGADA = "/painel";
const CURSOS_PUBLICO = "/cursos/";
const MATERIAL_PUBLICO = "/material/";

/**
 * O escape do desvio de material.
 *
 * `/painel/material/...` desiste e manda para a tela cheia em dois casos: o
 * documento não desmonta (deck de slides não tem `<main>`) e a credencial de API
 * morreu. Sem uma marca, o desvio daqui pegaria esse redirect e mandaria de
 * volta para o shell — que desistiria de novo, em laço, até o navegador parar.
 *
 * A página do shell põe esta marca no redirect, e o link "abrir em página
 * inteira" também: é o jeito de dizer "esta ida à tela cheia é deliberada".
 */
const INTEIRA = "inteira";

/**
 * O gêmeo logado de uma página pública — ou `null` quando ela não tem um.
 *
 * Nem toda tela pública precisa disto: só as que existem duas vezes, uma aberta
 * e uma dentro do shell da área logada. Hoje são três:
 *
 *   /                       → /painel
 *   /cursos/<slug>          → /painel/cursos/<slug>
 *   /material/<c>/<a>/<f>   → /painel/material/<c>/<a>/<f>
 *
 * As duas primeiras são o par que `privateCourseHref` documenta em
 * lib/cursos.ts. A terceira é a leitura de material: em tela cheia para quem
 * chega de fora, e dentro do shell — com sidebar e índice — para quem entrou.
 *
 * Por que a lista virou função, e não ficou só na home: o link "← voltar ao
 * curso" que o material desenha aponta para a landing PÚBLICA, e o material é
 * um HTML no CDN — publicado por `scripts/sincroniza-cdn.mjs`, fora deste repo.
 * Consertar link por link exigiria republicar o CDN a cada tela nova, e ainda
 * deixaria de fora bookmark, histórico e link que alguém mandou no grupo. A
 * regra que resolve todos de uma vez é esta: quem tem sessão nunca fica na
 * versão pública de uma tela que existe logada.
 *
 * `null` para `/cursos/` sozinho e para caminhos mais fundos (`/cursos/a/b`):
 * o primeiro não é curso nenhum, e o segundo não tem gêmeo — mandar para um
 * `/painel/cursos/a/b` inexistente trocaria uma tela certa por um 404.
 */
function gemeoLogado(url: URL): string | null {
  const pathname = url.pathname;

  if (pathname === HOME_PUBLICA) return HOME_LOGADA;

  if (pathname.startsWith(CURSOS_PUBLICO)) {
    const slug = pathname.slice(CURSOS_PUBLICO.length).replace(/\/+$/, "");
    if (slug === "" || slug.includes("/")) return null;
    return privateCourseHref(slug);
  }

  /* Material: quem está logado lê no shell do app, com a sidebar e o índice do
     documento — não em tela cheia. Vale para QUALQUER caminho até o arquivo, e é
     por isso que mora aqui e não no href de um botão: bookmark, link dentro de
     um slide e link que alguém mandou no grupo também passam por aqui.

     Exige os três segmentos exatos (curso/aula/arquivo) porque é o que a rota do
     shell atende; qualquer outra profundidade não tem gêmeo. */
  if (pathname.startsWith(MATERIAL_PUBLICO)) {
    if (url.searchParams.get(INTEIRA) === "1") return null;
    const partes = pathname.slice(MATERIAL_PUBLICO.length).split("/");
    if (partes.length !== 3 || partes.some((p) => p === "")) return null;
    return `/painel/material/${partes.join("/")}`;
  }

  return null;
}

/**
 * Por que esta regra mora aqui, e não num `readSession()` no app/page.tsx.
 *
 * A home e as seis landings de curso são prerenderizadas no build, e isso não é
 * acidente: é o motivo de o AccessButton ser Client Component com um `fetch` em
 * /api/me em vez de ler o cookie no servidor — está escrito lá.
 * `readSession()` chama `cookies()`, e `cookies()` tira do prerender qualquer
 * página que o alcance. Fazer o desvio nas páginas trocaria sete telas estáticas
 * por sete renderizações por requisição, só para atender quem já entrou. Aqui o
 * desvio acontece ANTES da página, e para quem não tem cookie elas continuam
 * saindo do prerender, intactas.
 *
 * E isto continua não sendo autorização — é o desvio de navegação que o topo
 * deste arquivo descreve, agora nas duas direções. Quem chega sem sessão vê a
 * landing; quem chega com sessão VÁLIDA vai para o /painel, que se protege
 * sozinho ao ser aberto. Errar aqui nunca mostra tela indevida: o pior caso é
 * uma volta de rede a mais, ou a landing pública, que não esconde nada.
 *
 * Por que a decisão decifra o cookie em vez de só ver se ele existe: a primeira
 * versão olhava a presença, e isso quebrou a home. Cookie que não abre mais —
 * segredo trocado, prazo vencido, ou a sessão de mentira do atalho de
 * desenvolvimento sobrevivendo ao dia em que o Keycloak foi configurado —
 * mandava a pessoa para o /painel, o /painel devolvia para o /entrar e o
 * /entrar ia para a tela do Keycloak. Resultado: quem só queria ver os cursos
 * gratuitos caía de cara no login, sem ter clicado em nada, e sem saída a não
 * ser limpar cookie na mão. A home é a porta de entrada do site — nela, "não
 * sei se esta sessão vale" tem que virar landing, não login.
 */
function redirectToApp(request: NextRequest, destino: string): NextResponse {
  // A query segue junto: uma landing aberta com "?de=email" que virasse a
  // versao logada sem ela perderia a unica informacao que aquele link
  // carregava.
  return NextResponse.redirect(
    new URL(destino + request.nextUrl.search, request.url),
  );
}

/**
 * Credencial de API morta NÃO é sessão morta. Cai só a credencial.
 *
 * Esta função já foi o contrário — apagava os três cookies e mandava para o
 * /entrar — e o comentário dela dizia por quê: "deixar a pessoa navegando com o
 * `nd_session` de pé e sem token é o pior dos mundos, porque toda chamada à API
 * responde 401 SEM EXPLICAR NADA".
 *
 * Essa premissa deixou de valer. A rota que fala com a API
 * (`app/material/…/route.ts`) hoje distingue "sem sessão" de "com sessão e sem
 * credencial" e devolve uma página que diz o que aconteceu e o que fazer. O
 * silêncio que justificava o logout duro não existe mais.
 *
 * E o logout duro custava caro: o access token vale 5 minutos, então a PRIMEIRA
 * navegação depois desse prazo derrubava a sessão inteira de quem só estava
 * lendo. Quem passa vinte minutos num slide e clica em "voltar ao curso" era
 * deslogado no clique — sem ter feito nada de errado, e sem entender por quê.
 *
 * Agora: as fatias do cookie de tokens saem (a credencial está morta mesmo, e
 * um refresh token que o Keycloak recusa não pode ficar no navegador), e a
 * requisição SEGUE. O `nd_session` fica — ele é autocontido, tem prazo próprio e
 * prova identidade sem depender da API; o `nd_id` fica porque é o
 * `id_token_hint` de que o /sair precisa.
 *
 * O que se ganha: painel, perfil, guias e as landings continuam funcionando, a
 * pessoa continua logada, e só o material fechado pede uma volta ao login — com
 * um link de um clique.
 *
 * O que se paga, dito claro: se o refresh foi recusado porque a sessão foi
 * encerrada NO KEYCLOAK (logout em outro lugar, admin revogando), este app
 * segue mostrando a área logada até o `nd_session` vencer por conta própria —
 * no máximo o prazo que ele já tinha. Nesse intervalo não há acesso a API
 * nenhuma, porque a credencial se foi; o que sobra é a pessoa ver o próprio
 * painel com uma lista de roles possivelmente velha. Foi a troca escolhida:
 * limitada, sem acesso a dado novo, e sem deslogar quem só virou uma página.
 */
function descartaCredencial(): NextResponse {
  const res = NextResponse.next();
  clearTokensCookies(res.cookies);
  return res;
}

/**
 * Os três cookies nascem juntos em app/entrar/retorno/route.ts e morrem juntos.
 * A regra mora aqui porque agora são dois os caminhos que matam sessão: o
 * refresh recusado, que devolve para o /entrar, e o cookie morto encontrado na
 * home, que não redireciona nada.
 */
function clearSessionCookies(res: NextResponse): NextResponse {
  const expired = cookieOptions(0);
  for (const name of [SESSION_COOKIE, ID_TOKEN_COOKIE]) {
    res.cookies.set(name, "", expired);
  }
  // As fatias do cookie de tokens saem todas — deixar uma para trás é deixar
  // um refresh token vivo no navegador de quem acabou de ser deslogado.
  clearTokensCookies(res.cookies);
  return res;
}

/**
 * Reescreve o header `cookie` da REQUISIÇÃO — não o da resposta.
 *
 * `res.cookies.set()` manda o valor novo para o navegador, mas a página que vai
 * renderizar agora, nesta mesma volta, ainda leria o valor velho: o access
 * token vencido que acabamos de trocar. Sem isto, a navegação que DISPARA a
 * renovação é justamente a que chama a API com o token ruim — o bug que esta
 * mudança existe para consertar, uma vez a cada cinco minutos.
 * `NextResponse.next({ request: { headers } })` é o que faz o valor novo já
 * valer para esta requisição.
 *
 * Concatenar sem escapar nada é seguro aqui: o valor é um JWE compacto, feito
 * só de base64url e ponto, e nenhum desses caracteres precisa de codificação
 * dentro de um header `cookie`.
 */
function withTokensCookie(header: string, value: string): string {
  const others = header
    .split(";")
    .map((pair) => pair.trim())
    .filter(
      (pair) =>
        pair !== "" &&
        !TOKENS_COOKIE_NAMES.some((name) => pair.startsWith(`${name}=`)),
    );
  // Todas as fatias antigas saíram no filtro acima, e só as novas entram. Uma
  // fatia velha sobrevivente seria concatenada às novas na leitura desta mesma
  // requisição e produziria um JWE que não decifra.
  splitTokensCookie(value)
    .slice(0, TOKENS_COOKIE_NAMES.length)
    .forEach((part, index) => {
      others.push(`${TOKENS_COOKIE_NAMES[index]}=${part}`);
    });
  return others.join("; ");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const temSessao = request.cookies.has(SESSION_COOKIE);

  // A home é o único caminho público do matcher, e sai antes de tudo: quem não
  // tem cookie recebe o prerender e vai embora, sem pagar nada do que vem
  // abaixo. Renovar token na volta também não faz falta — a resposta é um
  // redirect, e o /painel do outro lado passa por este mesmo arquivo.
  const gemeo = gemeoLogado(request.nextUrl);
  if (gemeo !== null) {
    if (!temSessao) return NextResponse.next();

    // Aqui, e SÓ aqui, o cookie de sessão é aberto — ver o porquê no comentário
    // de `redirectToApp()`. Presença de cookie não basta nesta decisão: a home
    // é a porta de entrada do site, e mandar para a área logada quem tem um
    // cookie que não abre mais custa a landing inteira, não uma volta de rede.
    const session = await decryptSession(
      request.cookies.get(SESSION_COOKIE)?.value ?? "",
    );

    // Cookie morto — vencido, cifrado com outro segredo, ou a sessão de mentira
    // sobrevivendo ao dia em que o Keycloak entrou. A home aparece, que é o que
    // a pessoa pediu, e o cookie sai do navegador na mesma resposta: sem isso
    // ela voltaria a bater aqui em toda visita, e a única saída seria limpar
    // cookie na mão.
    if (!session) return clearSessionCookies(NextResponse.next());

    return redirectToApp(request, gemeo);
  }

  /* `/material` é público como a home: material de curso aberto abre sem
   * sessão nenhuma, e quem decide se ESTE arquivo pede login é a própria rota,
   * perguntando à API — não dá para saber aqui.
   *
   * Ele entra no matcher só pela RENOVAÇÃO. O access token vale 5 minutos e é
   * este arquivo que o renova; sem passar por aqui, clicar num material depois
   * de qualquer pausa entregava um token vencido, `getAccessToken()` devolvia
   * null e a rota mandava para o login sem que nada estivesse errado com a
   * sessão. */
  /* E o resto da árvore de /cursos é público também, mesmo sem gêmeo.
   *
   * `/cursos/:path*` no matcher pega mais do que as seis landings: pega
   * `/cursos` sozinho e `/cursos/a/b`, que não são curso nenhum. Sem esta
   * linha eles caíam na regra das rotas privadas, e um visitante anônimo que
   * digitasse /cursos era mandado para a tela de login em vez de receber o 404
   * que a rota devolve. Página que não existe tem que dizer que não existe. */
  const publico =
    request.nextUrl.pathname.startsWith("/material/") ||
    request.nextUrl.pathname === "/cursos" ||
    request.nextUrl.pathname.startsWith(CURSOS_PUBLICO);

  if (!temSessao) return publico ? NextResponse.next() : redirectToLogin(request);

  // As fatias voltam a ser um JWE só antes de qualquer tentativa de decifrar.
  // Ler só `nd_tok` traria o primeiro pedaço de um JWE cortado em quatro, e
  // decifrar um pedaço falha exatamente como um cookie adulterado falharia —
  // deslogando, a cada navegação, quem tem access token grande demais.
  const value = joinTokensCookie((name) => request.cookies.get(name)?.value);

  // Sessão sem cookie de tokens é normal, e não é erro. É o caso da sessão de
  // mentira do atalho de desenvolvimento (lib/auth/dev.ts), que nunca falou com
  // o Keycloak e não tem token de verdade para renovar — e é também o de um
  // client sem refresh token, que app/entrar/retorno/route.ts já registrou no
  // log ao entrar. Nos dois a pessoa segue navegando, sem erro e sem redirect:
  // quebrar o atalho local seria regressão, e a área logada desenha bem sem
  // API. Quem for chamar a API recebe `null` de `getAccessToken()` e decide o
  // que fazer — a decisão é de lá, não daqui.
  if (!value) return NextResponse.next();

  const tokens = await decryptTokens(value);

  // Cookie presente e ilegível é outra história: SESSION_SECRET trocado, valor
  // adulterado, truncado pelo teto de 4 KB do navegador. Não dá para renovar
  // nem para chamar a API, e o `nd_session` do lado continua abrindo a tela: é
  // exatamente a sessão zumbi. Sessão zumbi sai.
  if (!tokens) return descartaCredencial();

  // A folga mora dentro de `isExpiring()`, junto com o motivo dela, para o
  // proxy não ter um segundo número para manter em dia. O caso comum é este
  // `return`: o token ainda serve e a requisição segue sem falar com ninguém.
  if (!isExpiring(tokens)) return NextResponse.next();

  // Duas requisições da mesma pessoa podem chegar juntas — a navegação e um
  // `fetch` do cliente, por exemplo — e as duas vão tentar renovar. Não há lock
  // possível aqui: este Worker não tem KV nem Durable Object, e cada requisição
  // pode cair num isolate diferente. A corrida é TOLERADA porque o Keycloak vem
  // com "Revoke Refresh Token" DESLIGADO por padrão: o refresh token antigo
  // continua valendo, as duas renovações dão certo, e a última resposta a
  // chegar é a que fica no navegador — as outras só gastaram uma volta de rede.
  //
  // Se alguém ligar a rotação de refresh no realm, isto deixa de valer: a
  // primeira renovação invalida o refresh token no ato, a segunda recebe
  // `invalid_grant`, e este arquivo vai deslogar quem só estava navegando
  // rápido. Nesse dia é preciso serializar a renovação de verdade — um Durable
  // Object por `sub`, ou uma janela de poucos segundos em KV na qual a resposta
  // da primeira renovação é reaproveitada em vez de pedir outra.
  try {
    const fresh = await refreshAccessToken(tokens.refreshToken);

    const now = Math.floor(Date.now() / 1000);
    const renewed: Tokens = {
      accessToken: fresh.access_token,
      // Com a rotação ligada o Keycloak devolve um refresh token novo e mata o
      // antigo na hora; sem rotação ele não devolve nada e o antigo segue
      // valendo. Gravar o novo quando vier e repetir o antigo quando não vier
      // é o que acerta nos dois realms.
      refreshToken: fresh.refresh_token ?? tokens.refreshToken,
      accessExpiresAt:
        now +
        (fresh.expires_in > 0
          ? fresh.expires_in
          : FALLBACK_ACCESS_LIFETIME_SECONDS),
    };

    const encrypted = await encryptTokens(renewed);

    const headers = new Headers(request.headers);
    headers.set("cookie", withTokensCookie(headers.get("cookie") ?? "", encrypted));

    const res = NextResponse.next({ request: { headers } });

    // Fatiado, e não num cookie só: o JWE renovado carrega o access token novo
    // inteiro, e o teto de ~4 KB é POR COOKIE. Num cookie único o navegador
    // descartaria o `Set-Cookie` calado, a próxima requisição não acharia token
    // nenhum, e a renovação recomeçaria do zero em toda navegação até o refresh
    // token vencer. `writeTokensCookies()` ainda apaga as fatias que sobraram.
    const maxAge = tokensMaxAge(fresh.refresh_expires_in);
    writeTokensCookies(res.cookies, encrypted, maxAge);

    // A sessão anda junto com o refresh, e isso não é enfeite.
    //
    // O `nd_session` nasce no /entrar com o `Max-Age` do `refresh_expires_in`
    // daquele momento — que no Keycloak, com as configurações padrão, é o SSO
    // Session Idle: trinta minutos. Sem reemitir aqui, meia hora depois do
    // login o cookie some do navegador e a pessoa é mandada para o /entrar no
    // meio do uso, com o refresh funcionando perfeitamente ao lado. O bug não
    // aparece em teste rápido: só quem fica mais de trinta minutos na tela
    // tropeça nele.
    //
    // Reemitir aqui não é decidir de novo quem a pessoa é. As claims são as
    // mesmas, vindas do cookie que já estava lá; o que muda é só o prazo, e o
    // prazo novo é o que o próprio Keycloak acabou de conceder ao renovar. Cada
    // renovação reinicia o relógio de ocioso dele — a sessão do site espelha
    // isso, em vez de contradizer.
    //
    // Se a sessão não abrir (chave trocada, cookie adulterado), não reemite: o
    // caminho de baixo já derruba tudo na próxima requisição.
    const current = await decryptSession(
      request.cookies.get(SESSION_COOKIE)?.value ?? "",
    );
    if (current) {
      const renewedSession: Session = {
        ...current,
        expiresAt: now + maxAge,
      };
      res.cookies.set(
        SESSION_COOKIE,
        await encryptSession(renewedSession),
        cookieOptions(maxAge),
      );
    }

    return res;
  } catch (cause) {
    console.warn("[proxy] renovação recusada:", failureReason(cause));
    return descartaCredencial();
  }
}

export const config = {
  // O "/" entrou, e é o único aqui que não é área logada. O preço é uma volta
  // no Worker em toda visita à landing — que não renderiza nada: sem cookie a
  // resposta é o `NextResponse.next()`, e o Cloudflare entrega o HTML
  // prerenderizado. As três rotas privadas seguem com `:path*` para cobrir as
  // sub-rotas; a home é exata, senão o matcher pegaria o site inteiro.
  matcher: [
    "/",
    "/cursos/:path*",
    "/painel/:path*",
    "/perfil/:path*",
    "/admin/:path*",
    "/material/:path*",
  ],
};
