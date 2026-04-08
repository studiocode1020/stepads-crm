import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarEventos, criarEvento } from "@/lib/queries/eventos";
import { z } from "zod";

const criarEventoSchema = z.object({
  nome: z.string().min(1),
  data: z.string(),
  local: z.string().optional(),
  tipo: z.string().optional(),
  status: z.string().optional(),
  capacidade: z.number().int().positive().optional(),
  orcamento: z.number().positive().optional(),
  descricao: z.string().optional(),
  companyId: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pagina = Number(searchParams.get("pagina") ?? 1);
  const busca = searchParams.get("busca") ?? "";

  try {
    const resultado = await buscarEventos({ pagina, busca });
    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const dados = criarEventoSchema.parse(body);

    const evento = await criarEvento({
      ...dados,
      data: new Date(dados.data),
    });

    return NextResponse.json({ success: true, data: evento }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
