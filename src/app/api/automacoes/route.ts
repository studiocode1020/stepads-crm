import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const campanhas = await prisma.whatsappCampaign.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        status: true,
        totalContatos: true,
        enviados: true,
        falhas: true,
        custoUnitario: true,
        custoTotal: true,
        criadoEm: true,
        mensagem: true,
      },
    });

    return NextResponse.json({ success: true, data: campanhas });
  } catch (error) {
    console.error("[automacoes GET]", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar campanhas" }, { status: 500 });
  }
};
