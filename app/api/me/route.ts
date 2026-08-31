import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";
import { readSession } from "@/lib/auth/session";

/**
 * O mínimo que o cabeçalho precisa para decidir entre "Entrar" e "Meu perfil".
 *
 * Token, e-mail e lista de roles não entram — esta resposta atravessa o
 * JavaScript da página, e o que chega no cliente é público na prática. O nome
 * aparece na tela de qualquer jeito; `isAdmin` é um booleano que o admin já
 * conhece sobre si mesmo.
 */
type MeResponse = {
  authenticated: boolean;
  name?: string;
  isAdmin?: boolean;
};

export async function GET() {
  const session = await readSession();

  const body: MeResponse = session
    ? { authenticated: true, name: session.name, isAdmin: isAdmin(session) }
    : { authenticated: false };

  // `no-store` é obrigatório: sem ele um proxy ou o bfcache pode entregar a
  // resposta de uma pessoa para outra.
  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
