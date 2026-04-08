import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const buscarEventos = async ({
  pagina = 1,
  porPagina = 20,
  busca = "",
}: {
  pagina?: number;
  porPagina?: number;
  busca?: string;
}) => {
  const where = busca
    ? {
        OR: [
          { nome: { contains: busca, mode: "insensitive" as const } },
          { local: { contains: busca, mode: "insensitive" as const } },
          { tipo: { contains: busca, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [eventos, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        company: { select: { id: true, nome: true } },
        _count: { select: { participacoes: true } },
      },
      orderBy: { data: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.event.count({ where }),
  ]);

  return { eventos, total, paginas: Math.ceil(total / porPagina) };
};

export const buscarEventoPorId = async (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      company: true,
      participacoes: {
        include: {
          contact: {
            include: { tags: { include: { tag: true } } },
          },
        },
        orderBy: { criadoEm: "desc" },
      },
      importLogs: { orderBy: { criadoEm: "desc" } },
      _count: { select: { participacoes: true } },
    },
  });
};

export const criarEvento = async (dados: {
  nome: string;
  data: Date;
  local?: string;
  tipo?: string;
  status?: string;
  capacidade?: number;
  orcamento?: number;
  descricao?: string;
  companyId?: string;
}) => {
  return prisma.event.create({ data: dados });
};

export const atualizarEvento = async (
  id: string,
  dados: {
    nome?: string;
    data?: Date;
    local?: string;
    tipo?: string;
    status?: string;
    capacidade?: number | null;
    orcamento?: number | null;
    descricao?: string;
    companyId?: string | null;
  }
) => {
  return prisma.event.update({ where: { id }, data: dados });
};

export const deletarEvento = async (id: string) => {
  return prisma.event.delete({ where: { id } });
};

export const listarTodosEventos = unstable_cache(
  async () => {
    return prisma.event.findMany({
      select: { id: true, nome: true, data: true },
      orderBy: { data: "desc" },
    });
  },
  ["todos-eventos"],
  { revalidate: 30 }
);
