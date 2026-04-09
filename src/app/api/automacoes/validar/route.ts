import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseArquivo, mapearContatos } from "@/lib/import/parser";

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const mapeamentoRaw = formData.get("mapeamento") as string;

    if (!arquivo || !mapeamentoRaw) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    const mapeamento: Record<string, string> = JSON.parse(mapeamentoRaw);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { linhas } = parseArquivo(buffer);
    const contatos = mapearContatos(linhas, mapeamento);

    const total = contatos.length;
    const invalidos = contatos.filter((c) => !c.telefone).length;
    const validos = total - invalidos;

    // Duplicatas de telefone dentro da própria planilha
    const phones = contatos.map((c) => c.telefone).filter(Boolean) as string[];
    const uniquePhones = new Set(phones);
    const duplicados = phones.length - uniquePhones.size;

    return NextResponse.json({ success: true, data: { total, validos, invalidos, duplicados } });
  } catch (error) {
    console.error("[automacoes/validar POST]", error);
    return NextResponse.json({ success: false, error: "Erro ao validar base" }, { status: 500 });
  }
};
