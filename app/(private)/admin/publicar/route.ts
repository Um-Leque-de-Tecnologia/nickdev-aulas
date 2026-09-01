import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth/tokens";
import { readSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { idxDe, kindDe, tipoDe, SLUG_VALIDO } from "@/lib/materiais";

/**
 * Publica material na Leque de Aulas API, com o token de quem está pedindo.
 *
 * O que esta rota substitui: até aqui, publicar era rodar
 * `scripts/sincroniza-cdn.mjs` com uma credencial de client no terminal. Isso
 * funciona e continua existindo — é o caminho para um lote de 87 arquivos —, mas
 * exige ter o repositório clonado, o Node instalado e o segredo do client à mão.
 * Para subir UM material, é ferramenta grande demais.
 *
 * Por que a rota existe, e não um `fetch` direto do navegador: o access token
 * mora num cookie `httpOnly` e é isso que o mantém fora do alcance de qualquer
 * script da página. Quem tem o token é o servidor. Então o navegador manda o
 * arquivo para cá, e daqui ele sai para a API com o `Authorization` que a pessoa
 * já tem por estar logada — nenhum segredo novo entra no projeto.
 *
 * A permissão é a role `aulas-admin` do próprio Keycloak, a mesma que a API
 * exige nas rotas `/v1/admin/*`. Ou seja: esta rota não concede nada. Se a
 * pessoa não for admin lá, a API recusa aqui também — o que se ganha é o erro
 * chegar antes, com uma frase em português, em vez de um 403 cru no fim do
 * upload.
 */

const API = process.env.AULAS_API ?? "https://api.aulas.umlequedetecnologia.com.br";

type Resultado = {
  arquivo: string;
  kind: string;
  ok: boolean;
  detalhe?: string;
};

/** O erro da API em uma linha, sem derramar o corpo inteiro na tela. */
async function motivo(r: Response): Promise<string> {
  const texto = await r.text();
  try {
    const corpo: unknown = JSON.parse(texto);
    if (typeof corpo === "object" && corpo !== null && "error" in corpo) {
      const erro = (corpo as { error: unknown }).error;
      if (typeof erro === "object" && erro !== null && "message" in erro) {
        return String((erro as { message: unknown }).message);
      }
      return JSON.stringify(erro);
    }
  } catch {
    /* corpo que não é JSON cai no recorte abaixo */
  }
  return `HTTP ${r.status}: ${texto.slice(0, 160)}`;
}

export async function POST(req: Request) {
  /* 404 e não 403, igual à página: um 403 confirmaria que a rota existe e que
     alguém tem essa permissão. Para quem não é admin, ela não existe. */
  const session = await readSession();
  if (!isAdmin(session)) return new NextResponse("Não encontrado", { status: 404 });

  /* Sessão de pé e credencial de API morta é um estado possível — ver
     `descartaCredencial()` no proxy.ts. Aqui ele não pode virar "falhou sem
     dizer por quê": a pessoa acabou de escolher arquivos e clicar. */
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      {
        erro:
          "A sua sessão está sem credencial de API. Recarregue a página pelo " +
          "botão de revalidar e tente de novo — nenhum arquivo foi enviado.",
        revalidar: "/entrar?de=%2Fadmin&renovar=1",
      },
      { status: 409 },
    );
  }

  const form = await req.formData();
  const cursoSlug = String(form.get("curso") ?? "");
  const cursoId = String(form.get("cursoId") ?? "");
  const aulaModo = String(form.get("aulaModo") ?? "");
  const arquivos = form.getAll("arquivos").filter((f): f is File => f instanceof File);

  if (!cursoSlug || !cursoId) {
    return NextResponse.json({ erro: "Escolha o curso." }, { status: 400 });
  }
  if (arquivos.length === 0) {
    return NextResponse.json({ erro: "Escolha ao menos um arquivo." }, { status: 400 });
  }

  const cabecalhos = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  /* ---- a aula: existente, ou criada agora ---------------------------------
     A aula tem que existir antes do primeiro arquivo, e a API não tem PATCH de
     aula: slug e título entram uma vez e ficam. É por isso que o formulário
     pede o título em vez de derivá-lo do slug — "Beans E Injecao" foi o que as
     duas primeiras aulas ganharam quando alguém derivou, e não há como
     consertar. */
  let aulaId = "";
  let aulaCriada: string | null = null;

  if (aulaModo === "nova") {
    const slug = String(form.get("aulaSlug") ?? "").trim();
    const titulo = String(form.get("aulaTitulo") ?? "").trim();

    if (!SLUG_VALIDO.test(slug)) {
      return NextResponse.json(
        {
          erro:
            "Slug inválido. Use minúsculas, números e hífen — ele entra na URL " +
            "do material e não pode ser trocado depois.",
        },
        { status: 400 },
      );
    }
    if (titulo === "") {
      return NextResponse.json(
        { erro: "A aula nova precisa de título: a API não deixa renomear depois." },
        { status: 400 },
      );
    }

    const idx = idxDe(slug);
    const r = await fetch(`${API}/v1/admin/courses/${cursoId}/lessons`, {
      method: "POST",
      headers: { ...cabecalhos, "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title: titulo,
        idx,
        position: idx,
        /* O schema aceita qualquer string, mas as aulas que já existem só usam
           "em_andamento" e "em_breve". Um terceiro valor deixaria a aula fora de
           qualquer filtro escrito contra esse vocabulário. */
        status: "em_andamento",
        description: "",
      }),
    });

    if (!r.ok) {
      return NextResponse.json(
        { erro: `Não deu para criar a aula: ${await motivo(r)}` },
        { status: 502 },
      );
    }
    const nova = (await r.json()) as { id: string };
    aulaId = nova.id;
    aulaCriada = slug;
  } else {
    aulaId = String(form.get("aulaId") ?? "");
    if (!aulaId) {
      return NextResponse.json({ erro: "Escolha a aula." }, { status: 400 });
    }
  }

  /* ---- os arquivos, um por um -------------------------------------------
     Em série, e não em paralelo: são poucos arquivos e o que importa aqui é
     poder dizer QUAL falhou. Um `Promise.all` devolveria "algo deu errado" e
     ainda arriscaria estourar limite de requisição concorrente da API. */
  const resultados: Resultado[] = [];

  for (const arquivo of arquivos) {
    const nome = arquivo.name;
    const kind = kindDe(nome, cursoSlug);

    const dados = new FormData();
    /* Reembala com o tipo derivado da extensão. O `File` do navegador traz um
       `type` do sistema operacional, que para `.html` costuma vir sem charset —
       e é esse valor que a API grava e o CDN devolve depois. Ver `tipoDe`. */
    dados.append("file", new Blob([await arquivo.arrayBuffer()], { type: tipoDe(nome) }), nome);
    dados.append("kind", kind);

    const r = await fetch(`${API}/v1/admin/lessons/${aulaId}/assets`, {
      method: "POST",
      headers: cabecalhos,
      body: dados,
    });

    resultados.push(
      r.ok
        ? { arquivo: nome, kind, ok: true }
        : { arquivo: nome, kind, ok: false, detalhe: await motivo(r) },
    );
  }

  const enviados = resultados.filter((r) => r.ok).length;
  return NextResponse.json({
    aulaCriada,
    enviados,
    total: resultados.length,
    resultados,
  });
}
