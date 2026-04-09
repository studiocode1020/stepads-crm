import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/eventos/grupos/reorder — body: { ids: string[] } em nova ordem
export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids)) return NextResponse.json({ success: false, error: "ids inválido" }, { status: 400 });

    await prisma.$transaction(
      ids.map((id, index) => prisma.eventGroup.update({ where: { id }, data: { ordem: index } }))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
