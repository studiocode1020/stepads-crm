import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const tags = await prisma.tag.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json({ success: true, data: tags });
};
