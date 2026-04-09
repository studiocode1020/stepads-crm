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
        eventGroup: { select: { id: true, nome: true } },
        _count: { select: { participacoes: true } },
      },
      orderBy: [{ ordem: "asc" }, { data: "desc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.event.count({ where }),
  ]);

  return { eventos, total, paginas: Math.ceil(total / porPagina) };
};

export const buscarEventoPorId = async (id: string) => {
  const evento = await prisma.event.findUnique({
    where: { id },
    include: {
      company: true,
      eventGroup: { select: { id: true, nome: true } },
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

  if (!evento) return null;

  // Distribuições para esta edição específica
  type DistRow = { valor: string; total: bigint };

  const [generoRows, origemRows, estadoRows] = await Promise.all([
    prisma.$queryRaw<DistRow[]>`
      SELECT c.genero AS valor, COUNT(*)::bigint AS total
      FROM event_participations ep
      JOIN contacts c ON c.id = ep."contactId"
      WHERE ep."eventId" = ${id}
        AND c.genero IS NOT NULL AND c.genero <> ''
      GROUP BY c.genero
      ORDER BY total DESC
    `,
    prisma.$queryRaw<DistRow[]>`
      SELECT c.origem AS valor, COUNT(*)::bigint AS total
      FROM event_participations ep
      JOIN contacts c ON c.id = ep."contactId"
      WHERE ep."eventId" = ${id}
        AND c.origem IS NOT NULL AND c.origem <> ''
      GROUP BY c.origem
      ORDER BY total DESC
    `,
    prisma.$queryRaw<DistRow[]>`
      SELECT c.estado AS valor, COUNT(*)::bigint AS total
      FROM event_participations ep
      JOIN contacts c ON c.id = ep."contactId"
      WHERE ep."eventId" = ${id}
        AND c.estado IS NOT NULL AND c.estado <> ''
      GROUP BY c.estado
      ORDER BY total DESC
      LIMIT 5
    `,
  ]);

  const toNum = (rows: DistRow[]) =>
    rows.map((r) => ({ valor: r.valor, total: Number(r.total) }));

  return {
    ...evento,
    distribuicoes: {
      genero: toNum(generoRows),
      origem: toNum(origemRows),
      estado: toNum(estadoRows),
    },
  };
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
  eventGroupId?: string;
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
    eventGroupId?: string | null;
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

// ─── EventGroup queries ────────────────────────────────────────────────────

export const buscarGruposEvento = async () => {
  const grupos = await prisma.eventGroup.findMany({
    include: {
      edicoes: {
        select: {
          id: true,
          nome: true,
          data: true,
          status: true,
          _count: { select: { participacoes: true } },
        },
        orderBy: { data: "desc" },
      },
    },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  const agora = new Date();
  const trintaDias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);

  return grupos.map((g) => {
    const totalClientes = g.edicoes.reduce(
      (acc, e) => acc + e._count.participacoes,
      0
    );

    const futuras = g.edicoes
      .filter((e) => new Date(e.data) >= agora)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const proximaEdicao = futuras[0] ?? null;
    const ativo = proximaEdicao
      ? new Date(proximaEdicao.data) <= trintaDias
      : false;

    return {
      id: g.id,
      nome: g.nome,
      descricao: g.descricao,
      totalClientes,
      totalEdicoes: g.edicoes.length,
      proximaEdicao: proximaEdicao
        ? { id: proximaEdicao.id, nome: proximaEdicao.nome, data: proximaEdicao.data }
        : null,
      ativo,
    };
  });
};

export const buscarGrupoPorId = async (id: string) => {
  const grupo = await prisma.eventGroup.findUnique({
    where: { id },
    include: {
      edicoes: {
        select: {
          id: true,
          nome: true,
          data: true,
          status: true,
          _count: { select: { participacoes: true } },
        },
        orderBy: { data: "desc" },
      },
    },
  });

  if (!grupo) return null;

  // IDs das edições deste grupo
  const edicaoIds = grupo.edicoes.map((e) => e.id);

  if (edicaoIds.length === 0) {
    return {
      id: grupo.id,
      nome: grupo.nome,
      descricao: grupo.descricao,
      stats: {
        totalClientes: 0,
        ticketMedio: 0,
        totalEdicoes: 0,
        proximaEdicao: null as { nome: string; data: Date } | null,
      },
      distribuicoes: {
        genero: [] as { valor: string; total: number }[],
        origem: [] as { valor: string; total: number }[],
        estado: [] as { valor: string; total: number }[],
      },
      edicoes: [] as {
        id: string;
        nome: string;
        data: Date;
        status: string;
        totalClientes: number;
        ticketMedio: number;
        faturamentoTotal: number;
      }[],
      clientes: [] as {
        id: string;
        nome: string;
        valorTotal: number;
        ticketMedio: number;
        edicoes: { id: string; nome: string }[];
      }[],
    };
  }

  type DistRow = { valor: string; total: bigint };
  type TicketRow = { eventid: string; ticketmedio: number | null; faturamentototal: number | null };
  type ClienteRow = {
    id: string;
    nome: string;
    valortotal: number | null;
    ticketmedio: number | null;
  };
  type EdicaoClienteRow = { contactid: string; eventid: string; eventnome: string };

  const [generoRows, origemRows, estadoRows, ticketRows, clienteRows, edicaoClienteRows, totalClientesResult] =
    await Promise.all([
      prisma.$queryRaw<DistRow[]>`
        SELECT c.genero AS valor, COUNT(DISTINCT ep."contactId")::bigint AS total
        FROM event_participations ep
        JOIN contacts c ON c.id = ep."contactId"
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
          AND c.genero IS NOT NULL AND c.genero <> ''
        GROUP BY c.genero
        ORDER BY total DESC
      `,
      prisma.$queryRaw<DistRow[]>`
        SELECT c.origem AS valor, COUNT(DISTINCT ep."contactId")::bigint AS total
        FROM event_participations ep
        JOIN contacts c ON c.id = ep."contactId"
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
          AND c.origem IS NOT NULL AND c.origem <> ''
        GROUP BY c.origem
        ORDER BY total DESC
      `,
      prisma.$queryRaw<DistRow[]>`
        SELECT c.estado AS valor, COUNT(DISTINCT ep."contactId")::bigint AS total
        FROM event_participations ep
        JOIN contacts c ON c.id = ep."contactId"
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
          AND c.estado IS NOT NULL AND c.estado <> ''
        GROUP BY c.estado
        ORDER BY total DESC
        LIMIT 5
      `,
      prisma.$queryRaw<TicketRow[]>`
        SELECT ep."eventId" AS eventid, AVG(ep."valorTicket") AS ticketmedio, SUM(ep."valorTicket") AS faturamentototal
        FROM event_participations ep
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
        GROUP BY ep."eventId"
      `,
      prisma.$queryRaw<ClienteRow[]>`
        SELECT
          c.id,
          c.nome,
          SUM(ep."valorTicket") AS valortotal,
          AVG(ep."valorTicket") AS ticketmedio
        FROM event_participations ep
        JOIN contacts c ON c.id = ep."contactId"
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
        GROUP BY c.id, c.nome
        ORDER BY valortotal DESC NULLS LAST
        LIMIT 100
      `,
      prisma.$queryRaw<EdicaoClienteRow[]>`
        SELECT ep."contactId" AS contactid, ep."eventId" AS eventid, e.nome AS eventnome
        FROM event_participations ep
        JOIN events e ON e.id = ep."eventId"
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
      `,
      prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COUNT(DISTINCT ep."contactId")::bigint AS total
        FROM event_participations ep
        WHERE ep."eventId" = ANY(${edicaoIds}::text[])
      `,
    ]);

  const toNum = (rows: DistRow[]) =>
    rows.map((r) => ({ valor: r.valor, total: Number(r.total) }));

  const ticketMap = new Map(
    ticketRows.map((r) => [r.eventid, {
      ticketMedio: r.ticketmedio ? Number(r.ticketmedio) : 0,
      faturamentoTotal: r.faturamentototal ? Number(r.faturamentototal) : 0,
    }])
  );

  const agora = new Date();
  const futuras = grupo.edicoes
    .filter((e) => new Date(e.data) >= agora)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const proximaEdicao = futuras[0]
    ? { nome: futuras[0].nome, data: futuras[0].data }
    : null;

  // Ticket médio global
  const allTickets = await prisma.$queryRaw<[{ avg: number | null }]>`
    SELECT AVG(ep."valorTicket") AS avg
    FROM event_participations ep
    WHERE ep."eventId" = ANY(${edicaoIds}::text[])
  `;
  const ticketMedioGlobal = allTickets[0]?.avg ? Number(allTickets[0].avg) : 0;

  // Mapa de edições por contato
  const edicoesPorContato = new Map<string, { id: string; nome: string }[]>();
  for (const row of edicaoClienteRows) {
    if (!edicoesPorContato.has(row.contactid)) {
      edicoesPorContato.set(row.contactid, []);
    }
    edicoesPorContato.get(row.contactid)!.push({ id: row.eventid, nome: row.eventnome });
  }

  const clientes = clienteRows.map((r) => ({
    id: r.id,
    nome: r.nome,
    valorTotal: r.valortotal ? Number(r.valortotal) : 0,
    ticketMedio: r.ticketmedio ? Number(r.ticketmedio) : 0,
    edicoes: edicoesPorContato.get(r.id) ?? [],
  }));

  const edicoes = grupo.edicoes.map((e) => ({
    id: e.id,
    nome: e.nome,
    data: e.data,
    status: e.status,
    totalClientes: e._count.participacoes,
    ticketMedio: ticketMap.get(e.id)?.ticketMedio ?? 0,
    faturamentoTotal: ticketMap.get(e.id)?.faturamentoTotal ?? 0,
  }));

  return {
    id: grupo.id,
    nome: grupo.nome,
    descricao: grupo.descricao,
    stats: {
      totalClientes: Number(totalClientesResult[0]?.total ?? 0),
      ticketMedio: ticketMedioGlobal,
      totalEdicoes: grupo.edicoes.length,
      proximaEdicao,
    },
    distribuicoes: {
      genero: toNum(generoRows),
      origem: toNum(origemRows),
      estado: toNum(estadoRows),
    },
    edicoes,
    clientes,
  };
};

export const criarGrupoEvento = async (dados: {
  nome: string;
  descricao?: string;
}) => {
  return prisma.eventGroup.create({ data: dados });
};

export const deletarGrupoEvento = async (id: string) => {
  // desvincula as edições (SetNull pelo onDelete) e remove o grupo
  return prisma.eventGroup.delete({ where: { id } });
};

export const listarGruposEvento = async () => {
  return prisma.eventGroup.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
};
