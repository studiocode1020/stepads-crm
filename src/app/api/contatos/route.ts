import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarContatos, criarContato } from "@/lib/queries/contatos";
import { z } from "zod";

const criarContatoSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pagina = Number(searchParams.get("pagina") ?? 1);
  const busca = searchParams.get("busca") ?? "";
  const eventoId = searchParams.get("eventoId") ?? "";
  const tagId = searchParams.get("tagId") ?? "";

  try {
    const resultado = await buscarContatos({ pagina, busca, eventoId, tagId });
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
    const dados = criarContatoSchema.parse(body);

    const contato = await criarContato({
      nome: dados.nome,
      email: dados.email || undefined,
      telefone: dados.telefone || undefined,
      dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
      observacoes: dados.observacoes || undefined,
    });

    return NextResponse.json({ success: true, data: contato }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
