import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarContatosPorEvento, buscarCrescimentoPorMes, buscarTopContatos } from "@/lib/queries/relatorios";

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const meses = Number(req.nextUrl.searchParams.get("meses") ?? 12);

  try {
    const [contatosPorEvento, crescimentoPorMes, topContatos] = await Promise.all([
      buscarContatosPorEvento(),
      buscarCrescimentoPorMes(meses),
      buscarTopContatos(),
    ]);

    return NextResponse.json({ success: true, data: { contatosPorEvento, crescimentoPorMes, topContatos } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
