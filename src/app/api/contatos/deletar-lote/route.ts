import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/contatos/deletar-lote — body: { ids: string[] }
export const DELETE = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0)
      return NextResponse.json({ success: false, error: "ids inválido" }, { status: 400 });

    const { count } = await prisma.contact.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
