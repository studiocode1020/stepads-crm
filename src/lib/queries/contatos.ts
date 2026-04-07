import { prisma } from "@/lib/prisma";

export type ContatoComDetalhes = Awaited<ReturnType<typeof buscarContatos>>["contatos"][number];

export const buscarContatos = async ({
  pagina = 1,
  porPagina = 20,
  busca = "",
  eventoId = "",
  tagId = "",
}: {
  pagina?: number;
  porPagina?: number;
  busca?: string;
  eventoId?: string;
  tagId?: string;
}) => {
  const where = {
    AND: [
      busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" as const } },
              { email: { contains: busca, mode: "insensitive" as const } },
              { telefone: { contains: busca, mode: "insensitive" as const } },
            ],
          }
        : {},
      eventoId ? { participacoes: { some: { eventId: eventoId } } } : {},
      tagId ? { tags: { some: { tagId } } } : {},
    ],
  };

  const [contatos, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        participacoes: { include: { event: { select: { id: true, nome: true, data: true } } } },
        tags: { include: { tag: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contatos, total, paginas: Math.ceil(total / porPagina) };
};

export const buscarContatoPorId = async (id: string) => {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      participacoes: {
        include: { event: { include: { company: { select: { nome: true } } } } },
        orderBy: { criadoEm: "desc" },
      },
      tags: { include: { tag: true } },
    },
  });
};

export const criarContato = async (dados: {
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
  observacoes?: string;
}) => {
  return prisma.contact.create({ data: dados });
};

export const atualizarContato = async (
  id: string,
  dados: {
    nome?: string;
    email?: string;
    telefone?: string;
    dataNascimento?: Date | null;
    observacoes?: string;
  }
) => {
  return prisma.contact.update({ where: { id }, data: dados });
};

export const deletarContato = async (id: string) => {
  return prisma.contact.delete({ where: { id } });
};

export const contarAniversariantesDoMes = async () => {
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  return prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM contacts
    WHERE EXTRACT(MONTH FROM "dataNascimento") = ${mes}
  `.then((r) => Number(r[0]?.count ?? 0));
};
