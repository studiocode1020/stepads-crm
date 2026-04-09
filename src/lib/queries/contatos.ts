import { prisma } from "@/lib/prisma";

// ─── Métricas consolidadas da base de clientes ────────────────────────────────

export const buscarMetricasClientes = async () => {
  const [totalContatos, statsRaw] = await Promise.all([
    prisma.contact.count(),
    prisma.$queryRaw<
      [{ media_gasto: number | null; ticket_medio: number | null; media_eventos: number | null }]
    >`
      SELECT
        AVG(sub.total_gasto)             AS media_gasto,
        AVG(sub.ticket_medio_individual) AS ticket_medio,
        AVG(sub.total_eventos)           AS media_eventos
      FROM (
        SELECT
          c.id,
          COALESCE(SUM(ep."valorTicket"), 0)::float                                          AS total_gasto,
          CASE WHEN COUNT(ep."valorTicket") > 0 THEN AVG(ep."valorTicket")::float ELSE 0 END AS ticket_medio_individual,
          COUNT(DISTINCT ep."eventId")::float                                                AS total_eventos
        FROM contacts c
        LEFT JOIN event_participations ep ON ep."contactId" = c.id
        GROUP BY c.id
      ) sub
    `,
  ]);

  const s = statsRaw[0];
  return {
    totalContatos,
    ticketMedio: s?.ticket_medio != null ? Number(s.ticket_medio) : null,
    mediaGasto: s?.media_gasto != null ? Number(s.media_gasto) : null,
    mediaEventos: s?.media_eventos != null ? Number(s.media_eventos) : null,
  };
};

// ─── Origens distintas dos contatos (para filtro) ────────────────────────────

export const listarOrigensContatos = async () => {
  const rows = await prisma.$queryRaw<{ origem: string }[]>`
    SELECT DISTINCT origem FROM contacts
    WHERE origem IS NOT NULL AND origem <> ''
    ORDER BY origem ASC
  `;
  return rows.map((r) => r.origem);
};

// ─── Tipo do cliente consolidado ─────────────────────────────────────────────

export type ClienteConsolidado = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  datanascimento: string | null;
  estado: string | null;
  origem: string | null;
  total_eventos: number;
  total_gasto: number;
  ticket_medio: number;
  ultima_participacao_nome: string | null;
  ultima_participacao_data: string | null;
  participacoes: { id: string; nome: string; data: string }[];
};

// ─── Query consolidada por cliente com filtros ───────────────────────────────

export const buscarClientesConsolidados = async (
  filtros: {
    busca?: string;
    aniversarioMes?: number;
    totalEventosMin?: number;
    totalEventosMax?: number;
    origem?: string;
    ticketMin?: number;
    ticketMax?: number;
    eventoId?: string;
    pagina?: number;
    porPagina?: number;
  } = {}
) => {
  const {
    busca = "",
    aniversarioMes,
    totalEventosMin,
    totalEventosMax,
    origem = "",
    ticketMin,
    ticketMax,
    eventoId = "",
    pagina = 1,
    porPagina = 50,
  } = filtros;

  const filterParams: unknown[] = [];
  let pi = 1;
  const p = (val: unknown) => {
    filterParams.push(val);
    return `$${pi++}`;
  };

  const whereConditions: string[] = [];
  const havingConditions: string[] = [];

  if (busca) {
    const bv = `%${busca}%`;
    const p1 = p(bv), p2 = p(bv), p3 = p(bv);
    whereConditions.push(`(c.nome ILIKE ${p1} OR c.email ILIKE ${p2} OR c.telefone ILIKE ${p3})`);
  }

  if (aniversarioMes) {
    whereConditions.push(`EXTRACT(MONTH FROM c."dataNascimento") = ${p(aniversarioMes)}`);
  }

  if (origem) {
    whereConditions.push(`c.origem = ${p(origem)}`);
  }

  if (eventoId) {
    whereConditions.push(
      `c.id IN (SELECT "contactId" FROM event_participations WHERE "eventId" = ${p(eventoId)})`
    );
  }

  if (totalEventosMin !== undefined) {
    havingConditions.push(`COUNT(DISTINCT ep."eventId") >= ${p(totalEventosMin)}`);
  }
  if (totalEventosMax !== undefined) {
    havingConditions.push(`COUNT(DISTINCT ep."eventId") <= ${p(totalEventosMax)}`);
  }
  if (ticketMin !== undefined) {
    havingConditions.push(`COALESCE(AVG(ep."valorTicket"), 0) >= ${p(ticketMin)}`);
  }
  if (ticketMax !== undefined) {
    havingConditions.push(`COALESCE(AVG(ep."valorTicket"), 0) <= ${p(ticketMax)}`);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  const havingClause =
    havingConditions.length > 0 ? `HAVING ${havingConditions.join(" AND ")}` : "";

  const filterParamsSnapshot = [...filterParams];
  const nextPi = pi;

  const mainParams = [
    ...filterParamsSnapshot,
    porPagina,
    (pagina - 1) * porPagina,
  ];
  const limitPh = `$${nextPi}`;
  const offsetPh = `$${nextPi + 1}`;

  type RawRow = {
    id: string;
    nome: string;
    datanascimento: Date | null;
    estado: string | null;
    origem: string | null;
    telefone: string | null;
    email: string | null;
    total_eventos: number;
    total_gasto: number;
    ticket_medio: number;
    ultima_participacao_nome: string | null;
    ultima_participacao_data: Date | null;
    participacoes: { id: string; nome: string; data: string }[] | null;
  };

  const mainSql = `
    SELECT
      c.id,
      c.nome,
      c."dataNascimento"    AS datanascimento,
      c.estado,
      c.origem,
      c.telefone,
      c.email,
      COUNT(DISTINCT ep."eventId")::int  AS total_eventos,
      COALESCE(SUM(ep."valorTicket"), 0)::float AS total_gasto,
      CASE WHEN COUNT(ep."valorTicket") > 0
           THEN AVG(ep."valorTicket")::float ELSE 0 END AS ticket_medio,
      (SELECT e2.nome FROM events e2
       JOIN event_participations ep2 ON ep2."eventId" = e2.id
       WHERE ep2."contactId" = c.id
       ORDER BY e2.data DESC LIMIT 1) AS ultima_participacao_nome,
      (SELECT e2.data FROM events e2
       JOIN event_participations ep2 ON ep2."eventId" = e2.id
       WHERE ep2."contactId" = c.id
       ORDER BY e2.data DESC LIMIT 1) AS ultima_participacao_data,
      COALESCE(
        (SELECT json_agg(
                  json_build_object('id', e2.id, 'nome', e2.nome,
                                   'data', TO_CHAR(e2.data,'YYYY-MM-DD'))
                  ORDER BY e2.data DESC
                )
         FROM event_participations ep2
         JOIN events e2 ON e2.id = ep2."eventId"
         WHERE ep2."contactId" = c.id
        ),
        '[]'::json
      ) AS participacoes
    FROM contacts c
    LEFT JOIN event_participations ep ON ep."contactId" = c.id
    ${whereClause}
    GROUP BY c.id, c.nome, c."dataNascimento", c.estado, c.origem, c.telefone, c.email
    ${havingClause}
    ORDER BY total_gasto DESC NULLS LAST, c.nome ASC
    LIMIT ${limitPh} OFFSET ${offsetPh}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total FROM (
      SELECT c.id
      FROM contacts c
      LEFT JOIN event_participations ep ON ep."contactId" = c.id
      ${whereClause}
      GROUP BY c.id
      ${havingClause}
    ) sub
  `;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<RawRow[]>(mainSql, ...mainParams),
    prisma.$queryRawUnsafe<[{ total: number }]>(countSql, ...filterParamsSnapshot),
  ]);

  const toIso = (d: Date | string | null) => {
    if (!d) return null;
    return d instanceof Date ? d.toISOString() : String(d);
  };

  const clientes: ClienteConsolidado[] = rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    telefone: r.telefone,
    email: r.email,
    datanascimento: toIso(r.datanascimento),
    estado: r.estado,
    origem: r.origem,
    total_eventos: Number(r.total_eventos),
    total_gasto: Number(r.total_gasto),
    ticket_medio: Number(r.ticket_medio),
    ultima_participacao_nome: r.ultima_participacao_nome,
    ultima_participacao_data: toIso(r.ultima_participacao_data),
    participacoes: Array.isArray(r.participacoes)
      ? r.participacoes
      : typeof r.participacoes === "string"
      ? (JSON.parse(r.participacoes) as { id: string; nome: string; data: string }[])
      : [],
  }));

  const total = Number(countRows[0]?.total ?? 0);
  return { clientes, total, paginas: Math.ceil(total / porPagina) };
};

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
  origem?: string;
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
