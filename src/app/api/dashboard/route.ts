import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarMetricasDashboard, buscarContatosPorMes } from "@/lib/queries/dashboard";

export const GET = async () => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const [metricas, contatosPorMes] = await Promise.all([
      buscarMetricasDashboard(),
      buscarContatosPorMes(),
    ]);

    return NextResponse.json({ success: true, data: { ...metricas, contatosPorMes } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
