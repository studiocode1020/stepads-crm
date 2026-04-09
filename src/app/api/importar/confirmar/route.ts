import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseArquivo, mapearContatos } from "@/lib/import/parser";
import { importarContatos } from "@/lib/import/deduplicacao";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File;
    const mapeamentoRaw = formData.get("mapeamento") as string;
    const eventId = formData.get("eventId") as string | null;

    if (!arquivo || !mapeamentoRaw) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    const mapeamento = JSON.parse(mapeamentoRaw);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { linhas } = parseArquivo(buffer);
    const contatos = mapearContatos(linhas, mapeamento);

    // Criar ImportLog primeiro para obter o ID
    const importLog = await prisma.importLog.create({
      data: {
        nomeArquivo: arquivo.name,
        eventId: eventId ?? null,
        totalLinhas: linhas.length,
        novosContatos: 0,
        duplicados: 0,
        erros: 0,
      },
    });

    const resultado = await importarContatos(contatos, eventId ?? undefined, importLog.id);

    // Atualizar ImportLog com os resultados reais
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        novosContatos: resultado.novosContatos,
        duplicados: resultado.duplicados,
        erros: resultado.erros,
      },
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
