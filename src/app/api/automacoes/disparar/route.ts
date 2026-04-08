import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseArquivo, mapearContatos } from "@/lib/import/parser";
import { enviarMensagem, calcularCusto, CUSTO_UNITARIO } from "@/lib/whatsapp";

type ContatoParaDisparo = { nome: string; telefone: string };

const dispararCampanha = async (
  nomeCampanha: string,
  mensagem: string,
  contatosValidos: ContatoParaDisparo[]
) => {
  const custoTotal = calcularCusto(contatosValidos.length);

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
          telefone: c.telefone,
          status: "pendente",
        })),
      },
    },
    include: { contatos: true },
  });

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

  const campanhaFinal = await prisma.whatsappCampaign.update({
    where: { id: campanha.id },
    data: {
      enviados,
      falhas,
      status: falhas === contatosValidos.length ? "erro" : "concluida",
    },
  });

  return {
    campanhaId: campanhaFinal.id,
    totalContatos: contatosValidos.length,
    enviados,
    falhas,
    custoTotal,
  };
};

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const nomeCampanha = (formData.get("nomeCampanha") as string)?.trim();
    const mensagem = (formData.get("mensagem") as string)?.trim();
    const quantidadeRaw = formData.get("quantidade") as string;
    const origem = (formData.get("origem") as string) ?? "planilha";

    if (!nomeCampanha || !mensagem || !quantidadeRaw) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    const quantidade = parseInt(quantidadeRaw, 10);
    if (isNaN(quantidade) || quantidade <= 0) {
      return NextResponse.json({ success: false, error: "Quantidade inválida" }, { status: 400 });
    }

    let contatosValidos: ContatoParaDisparo[] = [];

    if (origem === "crm") {
      // Origem: contatos do CRM enviados como JSON
      const contatosJson = formData.get("contatosJson") as string;
      if (!contatosJson) {
        return NextResponse.json({ success: false, error: "Contatos não informados" }, { status: 400 });
      }
      const todos: ContatoParaDisparo[] = JSON.parse(contatosJson);
      contatosValidos = todos.filter((c) => c.telefone && c.nome).slice(0, quantidade);
    } else {
      // Origem: planilha
      const arquivo = formData.get("arquivo") as File | null;
      const mapeamentoRaw = formData.get("mapeamento") as string;
      if (!arquivo || !mapeamentoRaw) {
        return NextResponse.json({ success: false, error: "Arquivo ou mapeamento não informados" }, { status: 400 });
      }
      const mapeamento: Record<string, string> = JSON.parse(mapeamentoRaw);
      const buffer = Buffer.from(await arquivo.arrayBuffer());
      const { linhas } = parseArquivo(buffer);
      const contatos = mapearContatos(linhas, mapeamento);
      contatosValidos = contatos
        .filter((c) => c.telefone && c.nome)
        .map((c) => ({ nome: c.nome, telefone: c.telefone! }))
        .slice(0, quantidade);
    }

    if (contatosValidos.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum contato válido com telefone encontrado" }, { status: 400 });
    }

    const resultado = await dispararCampanha(nomeCampanha, mensagem, contatosValidos);

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error("[automacoes/disparar POST]", error);
    return NextResponse.json({ success: false, error: "Erro ao processar disparo" }, { status: 500 });
  }
};
