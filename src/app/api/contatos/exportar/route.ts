import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buscarContatos } from "@/lib/queries/contatos";

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const busca = searchParams.get("busca") ?? "";
  const eventoId = searchParams.get("eventoId") ?? "";

  try {
    const { contatos } = await buscarContatos({ busca, eventoId, porPagina: 9999 });

    const linhas = [
      ["Nome", "E-mail", "Telefone", "Data de Nascimento", "Cadastrado em"],
      ...contatos.map((c) => [
        c.nome,
        c.email ?? "",
        c.telefone ?? "",
        c.dataNascimento ? new Date(c.dataNascimento).toLocaleDateString("pt-BR") : "",
        new Date(c.criadoEm).toLocaleDateString("pt-BR"),
      ]),
    ];

    const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="contatos.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
