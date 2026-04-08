import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseArquivo, mapearContatos } from "@/lib/import/parser";
import { enviarMensagem, calcularCusto, CUSTO_UNITARIO } from "@/lib/whatsapp";

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const nomeCampanha = (formData.get("nomeCampanha") as string)?.trim();
    const mensagem = (formData.get("mensagem") as string)?.trim();
    const mapeamentoRaw = formData.get("mapeamento") as string;
    const quantidadeRaw = formData.get("quantidade") as string;

    if (!arquivo || !nomeCampanha || !mensagem || !mapeamentoRaw || !quantidadeRaw) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    const mapeamento: Record<string, string> = JSON.parse(mapeamentoRaw);
    const quantidade = parseInt(quantidadeRaw, 10);

    if (isNaN(quantidade) || quantidade <= 0) {
      return NextResponse.json({ success: false, error: "Quantidade inválida" }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { linhas } = parseArquivo(buffer);
    const contatos = mapearContatos(linhas, mapeamento);

    // Filtrar apenas quem tem telefone e limitar à quantidade solicitada
    const contatosValidos = contatos
      .filter((c) => c.telefone && c.nome)
      .slice(0, quantidade);

    if (contatosValidos.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum contato válido com telefone encontrado" }, { status: 400 });
    }

    const custoTotal = calcularCusto(contatosValidos.length);

    // Criar campanha
    const campanha = await prisma.whatsappCampaign.create({
      data: {
        nome: nomeCampanha,
        mensagem,
        totalContatos: contatosValidos.length,
        custoUnitario: CUSTO_UNITARIO,
        custoTotal,
        status: "em_andamento",
        contatos: {
          create: contatosValidos.map((c) => ({
            nome: c.nome,
            telefone: c.telefone!,
            status: "pendente",
          })),
        },
      },
      include: { contatos: true },
    });

    // Disparar mensagens
    let enviados = 0;
    let falhas = 0;

    for (const contato of campanha.contatos) {
      const resultado = await enviarMensagem(contato.telefone, mensagem);

      await prisma.whatsappCampaignContact.update({
        where: { id: contato.id },
        data: {
          status: resultado.sucesso ? "enviado" : "falha",
          erro: resultado.erro ?? null,
          enviadoEm: resultado.sucesso ? new Date() : null,
        },
      });

      if (resultado.sucesso) enviados++;
      else falhas++;
    }

    // Atualizar campanha com totais
    const campanhaFinal = await prisma.whatsappCampaign.update({
      where: { id: campanha.id },
      data: {
        enviados,
        falhas,
        status: falhas === contatosValidos.length ? "erro" : "concluida",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        campanhaId: campanhaFinal.id,
        totalContatos: contatosValidos.length,
        enviados,
        falhas,
        custoTotal,
      },
    });
  } catch (error) {
    console.error("[automacoes/disparar POST]", error);
    return NextResponse.json({ success: false, error: "Erro ao processar disparo" }, { status: 500 });
  }
};
