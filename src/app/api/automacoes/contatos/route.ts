import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get("tagId") ?? "";
    const eventoId = searchParams.get("eventoId") ?? "";

    const where: Record<string, unknown> = {
      telefone: { not: null },
    };

    if (tagId) where.tags = { some: { tagId } };
    if (eventoId) where.participacoes = { some: { eventId: eventoId } };

    const contatos = await prisma.contact.findMany({
      where,
      select: { id: true, nome: true, telefone: true, email: true },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ success: true, data: contatos });
  } catch (error) {
    console.error("[automacoes/contatos GET]", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar contatos" }, { status: 500 });
  }
};
