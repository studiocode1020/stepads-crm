import { prisma } from "@/lib/prisma";

export const buscarMetricasDashboard = async () => {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [
    totalContatos,
    totalEventos,
    contatosEsteMes,
    importacoesRecentes,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.event.count(),
    prisma.contact.count({ where: { criadoEm: { gte: inicioMes } } }),
    prisma.importLog.findMany({
      include: { event: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
  ]);

  const aniversariantesDoMes = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM contacts
    WHERE EXTRACT(MONTH FROM "dataNascimento") = ${agora.getMonth() + 1}
  `.then((r) => Number(r[0]?.count ?? 0));

  return {
    totalContatos,
    totalEventos,
    contatosEsteMes,
    aniversariantesDoMes,
    importacoesRecentes,
  };
};

export const buscarContatosPorMes = async () => {
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
  seisMesesAtras.setDate(1);
  seisMesesAtras.setHours(0, 0, 0, 0);

  const dados = await prisma.$queryRaw<{ mes: string; total: bigint }[]>`
    SELECT
      TO_CHAR("criadoEm", 'YYYY-MM') as mes,
      COUNT(*) as total
    FROM contacts
    WHERE "criadoEm" >= ${seisMesesAtras}
    GROUP BY mes
    ORDER BY mes ASC
  `;

  return dados.map((d) => ({
    mes: d.mes,
    total: Number(d.total),
  }));
};
