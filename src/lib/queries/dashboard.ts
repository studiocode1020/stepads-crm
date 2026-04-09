import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const buscarMetricasDashboard = unstable_cache(async () => {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [
    totalContatos,
    contatosEsteMes,
    importacoesRecentes,
    eventos,
    proximoEvento,
    eventoMaisPopular,
    faturamentoPorEventoRaw,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { criadoEm: { gte: inicioMes } } }),
    prisma.importLog.findMany({
      include: { event: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
    prisma.event.findMany({
      select: {
        id: true,
        nome: true,
        data: true,
        status: true,
        _count: { select: { participacoes: true } },
      },
      orderBy: { data: "desc" },
    }),
    prisma.event.findFirst({
      where: {
        data: { gte: agora },
        status: { notIn: ["cancelado", "realizado"] },
      },
      orderBy: { data: "asc" },
      select: { id: true, nome: true, data: true, status: true },
    }),
    prisma.event.findFirst({
      include: { _count: { select: { participacoes: true } } },
      orderBy: { participacoes: { _count: "desc" } },
    }),
    prisma.$queryRaw<{ eventid: string; nome: string; faturamentototal: number }[]>`
      SELECT ep."eventId" AS eventid, e.nome, SUM(ep."valorTicket") AS faturamentototal
      FROM event_participations ep
      JOIN events e ON e.id = ep."eventId"
      WHERE ep."valorTicket" IS NOT NULL AND ep."valorTicket" > 0
      GROUP BY ep."eventId", e.nome
      ORDER BY faturamentototal DESC
    `,
  ]);

  const [aniversariantesDoMes, clientesRecorrentes] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM contacts
      WHERE EXTRACT(MONTH FROM "dataNascimento") = ${agora.getMonth() + 1}
    `.then((r) => Number(r[0]?.count ?? 0)),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM (
        SELECT "contactId" FROM event_participations
        GROUP BY "contactId" HAVING COUNT(*) >= 2
      ) sub
    `.then((r) => Number(r[0]?.count ?? 0)),
  ]);

  // Ticket médio: média do valor_ticket pago por cada participante em seus ingressos
  const ticketMedioRaw = await prisma.$queryRaw<{ media: number | null }[]>`
    SELECT AVG("valorTicket") as media
    FROM event_participations
    WHERE "valorTicket" IS NOT NULL AND "valorTicket" > 0
  `.then((r) => r[0]?.media ?? null);
  const ticketMedio = ticketMedioRaw !== null ? Number(ticketMedioRaw) : null;

  const faturamentoPorEvento = faturamentoPorEventoRaw.map((r) => ({
    id: r.eventid,
    nome: r.nome,
    faturamentoTotal: Number(r.faturamentototal),
  }));

  return {
    totalContatos,
    contatosEsteMes,
    aniversariantesDoMes,
    importacoesRecentes,
    clientesRecorrentes,
    ticketMedio,
    faturamentoPorEvento,
    proximoEvento: proximoEvento
      ? {
          id: proximoEvento.id,
          nome: proximoEvento.nome,
          data: proximoEvento.data.toISOString(),
          status: proximoEvento.status,
        }
      : null,
    eventoMaisPopular: eventoMaisPopular
      ? { id: eventoMaisPopular.id, nome: eventoMaisPopular.nome, participantes: eventoMaisPopular._count.participacoes }
      : null,
    eventos: eventos.map((e) => ({
      id: e.id,
      nome: e.nome,
      data: e.data.toISOString(),
      status: e.status,
      participantes: e._count.participacoes,
    })),
  };
}, ["dashboard-metricas"], { revalidate: 30 });

export const buscarContatosPorMes = unstable_cache(async () => {
  const dozeAtras = new Date();
  dozeAtras.setMonth(dozeAtras.getMonth() - 11);
  dozeAtras.setDate(1);
  dozeAtras.setHours(0, 0, 0, 0);

  const dados = await prisma.$queryRaw<{ mes: string; total: bigint }[]>`
    SELECT
      TO_CHAR("criadoEm", 'YYYY-MM') as mes,
      COUNT(*) as total
    FROM contacts
    WHERE "criadoEm" >= ${dozeAtras}
    GROUP BY mes
    ORDER BY mes ASC
  `;

  return dados.map((d) => ({
    mes: d.mes,
    total: Number(d.total),
  }));
}, ["dashboard-contatos-por-mes"], { revalidate: 60 });

export const buscarAniversariantesDoMes = async (mes?: number) => {
  const mesAlvo = mes ?? new Date().getMonth() + 1;

  const contatos = await prisma.$queryRaw<{
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    dataNascimento: Date | null;
    totalEventos: bigint;
  }[]>`
    SELECT
      c.id,
      c.nome,
      c.email,
      c.telefone,
      c."dataNascimento",
      COUNT(ep."eventId") as "totalEventos"
    FROM contacts c
    LEFT JOIN event_participations ep ON ep."contactId" = c.id
    WHERE EXTRACT(MONTH FROM c."dataNascimento") = ${mesAlvo}
    GROUP BY c.id, c.nome, c.email, c.telefone, c."dataNascimento"
    ORDER BY EXTRACT(DAY FROM c."dataNascimento") ASC
  `;

  return contatos.map((c) => ({
    id: c.id,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    dataNascimento: c.dataNascimento ? c.dataNascimento.toISOString() : null,
    totalEventos: Number(c.totalEventos),
  }));
};
