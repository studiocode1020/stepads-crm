import { prisma } from "@/lib/prisma";
import type { ContatoImportado } from "./parser";

export type ResultadoImportacao = {
  novosContatos: number;
  duplicados: number;
  erros: number;
  detalhes: { nome: string; status: "novo" | "duplicado" | "erro"; motivo?: string }[];
};

export const importarContatos = async (
  contatos: ContatoImportado[],
  eventId?: string,
  importLogId?: string
): Promise<ResultadoImportacao> => {
  let novosContatos = 0;
  let duplicados = 0;
  let erros = 0;
  const detalhes: ResultadoImportacao["detalhes"] = [];

  for (const c of contatos) {
    try {
      // Buscar contato existente por email OU telefone
      const existente = await prisma.contact.findFirst({
        where: {
          OR: [
            c.email ? { email: c.email } : undefined,
            c.telefone ? { telefone: c.telefone } : undefined,
          ].filter(Boolean) as object[],
        },
      });

      let contatoId: string;

      if (existente) {
        contatoId = existente.id;
        duplicados++;
        detalhes.push({ nome: c.nome, status: "duplicado" });
      } else {
        const novo = await prisma.contact.create({
          data: {
            nome: c.nome,
            email: c.email || null,
            telefone: c.telefone || null,
            dataNascimento: c.dataNascimento || null,
            observacoes: c.observacoes || null,
            importLogId: importLogId ?? null,
          },
        });
        contatoId = novo.id;
        novosContatos++;
        detalhes.push({ nome: c.nome, status: "novo" });
      }

      // Vincular ao evento se fornecido
      if (eventId) {
        await prisma.eventParticipation.upsert({
          where: { contactId_eventId: { contactId: contatoId, eventId } },
          update: {},
          create: { contactId: contatoId, eventId },
        });
      }
    } catch (error) {
      erros++;
      detalhes.push({ nome: c.nome, status: "erro", motivo: String(error) });
    }
  }

  return { novosContatos, duplicados, erros, detalhes };
};
