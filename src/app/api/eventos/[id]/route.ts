import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarEventoPorId, atualizarEvento, deletarEvento } from "@/lib/queries/eventos";
import { z } from "zod";

const atualizarEventoSchema = z.object({
  nome: z.string().min(1).optional(),
  data: z.string().optional(),
  local: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  eventGroupId: z.string().optional().nullable(),
});

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const evento = await buscarEventoPorId(id);
    if (!evento) return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: evento });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const dados = atualizarEventoSchema.parse(body);

    const evento = await atualizarEvento(id, {
      nome: dados.nome,
      data: dados.data ? new Date(dados.data) : undefined,
      local: dados.local ?? undefined,
      tipo: dados.tipo ?? undefined,
      descricao: dados.descricao ?? undefined,
      companyId: dados.companyId,
      eventGroupId: dados.eventGroupId,
    });

    return NextResponse.json({ success: true, data: evento });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    await deletarEvento(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
