import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const buscarMetricasDashboard = unstable_cache(async () => {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [
    totalContatos,
    totalEventos,
    contatosEsteMes,
    importacoesRecentes,
    eventoMaisPopular,
    contatosMultiplosEventos,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.event.count(),
    prisma.contact.count({ where: { criadoEm: { gte: inicioMes } } }),
    prisma.importLog.findMany({
      include: { event: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
    prisma.event.findFirst({
      include: { _count: { select: { participacoes: true } } },
      orderBy: { participacoes: { _count: "desc" } },
    }),
    prisma.contact.count({
      where: { participacoes: { some: {} } },
    }),
  ]);

  const aniversariantesDoMes = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM contacts
    WHERE EXTRACT(MONTH FROM "dataNascimento") = ${agora.getMonth() + 1}
  `.then((r) => Number(r[0]?.count ?? 0));

  const contatosRetornantes = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM (
      SELECT "contactId" FROM event_participations
      GROUP BY "contactId" HAVING COUNT(*) >= 2
    ) sub
  `.then((r) => Number(r[0]?.count ?? 0));

  const taxaRetorno = totalContatos > 0
    ? Math.round((contatosRetornantes / totalContatos) * 100)
    : 0;

  return {
    totalContatos,
    totalEventos,
    contatosEsteMes,
    aniversariantesDoMes,
    importacoesRecentes,
    eventoMaisPopular: eventoMaisPopular
      ? { nome: eventoMaisPopular.nome, participantes: eventoMaisPopular._count.participacoes }
      : null,
    taxaRetorno,
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
