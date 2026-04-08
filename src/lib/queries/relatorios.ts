import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const buscarContatosPorEvento = unstable_cache(async () => {
  const dados = await prisma.event.findMany({
    include: { _count: { select: { participacoes: true } } },
    orderBy: { data: "desc" },
    take: 10,
  });

  return dados.map((e) => ({
    nome: e.nome,
    total: e._count.participacoes,
  }));
}, ["relatorios-contatos-por-evento"], { revalidate: 60 });

export const buscarCrescimentoPorMes = unstable_cache(async (meses = 12) => {
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);

  const dados = await prisma.$queryRaw<{ mes: string; total: bigint }[]>`
    SELECT
      TO_CHAR("criadoEm", 'YYYY-MM') as mes,
      COUNT(*) as total
    FROM contacts
    WHERE "criadoEm" >= ${inicio}
    GROUP BY mes
    ORDER BY mes ASC
  `;

  return dados.map((d) => ({
    mes: d.mes,
    total: Number(d.total),
  }));
}, ["relatorios-crescimento-por-mes"], { revalidate: 60 });

export const buscarTopContatos = unstable_cache(async (limite = 10) => {
  const dados = await prisma.$queryRaw<
    { id: string; nome: string; email: string | null; total_eventos: bigint }[]
  >`
    SELECT
      c.id,
      c.nome,
      c.email,
      COUNT(ep.id) as total_eventos
    FROM contacts c
    JOIN event_participations ep ON ep."contactId" = c.id
    GROUP BY c.id, c.nome, c.email
    ORDER BY total_eventos DESC
    LIMIT ${limite}
  `;

  return dados.map((d) => ({
    id: d.id,
    nome: d.nome,
    email: d.email,
    totalEventos: Number(d.total_eventos),
  }));
}, ["relatorios-top-contatos"], { revalidate: 60 });
