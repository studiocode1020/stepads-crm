import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseArquivo } from "@/lib/import/parser";

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File;

    if (!arquivo) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { colunas, linhas } = parseArquivo(buffer);

    return NextResponse.json({
      success: true,
      data: {
        colunas,
        preview: linhas.slice(0, 5),
        totalLinhas: linhas.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
