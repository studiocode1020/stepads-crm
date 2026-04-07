import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarContatoPorId, atualizarContato, deletarContato } from "@/lib/queries/contatos";
import { z } from "zod";

const atualizarContatoSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const contato = await buscarContatoPorId(id);
    if (!contato) return NextResponse.json({ success: false, error: "Contato não encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: contato });
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
    const dados = atualizarContatoSchema.parse(body);

    const contato = await atualizarContato(id, {
      nome: dados.nome,
      email: dados.email ?? undefined,
      telefone: dados.telefone ?? undefined,
      dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
      observacoes: dados.observacoes ?? undefined,
    });

    return NextResponse.json({ success: true, data: contato });
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
    await deletarContato(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
