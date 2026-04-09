import { prisma } from "@/lib/prisma";

export const listarImportacoes = async () => {
  const logs = await prisma.importLog.findMany({
    include: {
      event: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
  return logs;
};

export const buscarImportacaoPorId = async (id: string) => {
  type ContatoRow = {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    genero: string | null;
    estado: string | null;
    origem: string | null;
    criadoEm: Date;
  };

  const [log, contatoRows] = await Promise.all([
    prisma.importLog.findUnique({
      where: { id },
      include: { event: { select: { id: true, nome: true } } },
    }),
    prisma.$queryRaw<ContatoRow[]>`
      SELECT id, nome, email, telefone, genero, estado, origem, "criadoEm"
      FROM contacts
      WHERE "importLogId" = ${id}
      ORDER BY "criadoEm" ASC
    `,
  ]);

  if (!log) return null;
  return { ...log, contatos: contatoRows };
};
