import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarGruposEvento, buscarGruposEvento, criarGrupoEvento } from "@/lib/queries/eventos";
import { z } from "zod";

const criarGrupoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const modo = searchParams.get("modo");

  try {
    if (modo === "simples") {
      const grupos = await listarGruposEvento();
      return NextResponse.json({ success: true, data: grupos });
    }
    const grupos = await buscarGruposEvento();
    return NextResponse.json({ success: true, data: grupos });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const dados = criarGrupoSchema.parse(body);
    const grupo = await criarGrupoEvento(dados);
    return NextResponse.json({ success: true, data: grupo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
