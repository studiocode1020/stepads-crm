import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;

  const eventoGrupoId  = searchParams.get("eventoGrupoId")  ?? "";
  const eventoId       = searchParams.get("eventoId")        ?? "";
  const estado         = searchParams.get("estado")          ?? "";
  const genero         = searchParams.get("genero")          ?? "";
  const origem         = searchParams.get("origem")          ?? "";

  const aniversarioMes  = searchParams.get("aniversarioMes") ? parseInt(searchParams.get("aniversarioMes")!, 10) : null;
  const totalEventosMin = searchParams.get("totalEventosMin") ? parseInt(searchParams.get("totalEventosMin")!, 10) : null;
  const totalEventosMax = searchParams.get("totalEventosMax") ? parseInt(searchParams.get("totalEventosMax")!, 10) : null;
  const ticketMin       = searchParams.get("ticketMin")       ? parseFloat(searchParams.get("ticketMin")!)       : null;
  const ticketMax       = searchParams.get("ticketMax")       ? parseFloat(searchParams.get("ticketMax")!)       : null;
  const totalGastoMin   = searchParams.get("totalGastoMin")   ? parseFloat(searchParams.get("totalGastoMin")!)   : null;
  const totalGastoMax   = searchParams.get("totalGastoMax")   ? parseFloat(searchParams.get("totalGastoMax")!)   : null;

  const filterParams: unknown[] = [];
  const whereConditions: string[] = ["1=1"];
  const havingConditions: string[] = ["1=1"];

  if (estado) {
    filterParams.push(estado);
    whereConditions.push(`c.estado = $${filterParams.length}`);
  }
  if (genero) {
    filterParams.push(genero);
    whereConditions.push(`c.genero = $${filterParams.length}`);
  }
  if (origem) {
    filterParams.push(origem);
    whereConditions.push(`c.origem = $${filterParams.length}`);
  }
  if (aniversarioMes !== null) {
    filterParams.push(aniversarioMes);
    whereConditions.push(`EXTRACT(MONTH FROM c."dataNascimento") = $${filterParams.length}`);
  }
  if (eventoGrupoId) {
    filterParams.push(eventoGrupoId);
    whereConditions.push(`eg.id = $${filterParams.length}`);
  }
  if (eventoId) {
    filterParams.push(eventoId);
    whereConditions.push(`ep."eventId" = $${filterParams.length}`);
  }
  if (totalEventosMin !== null) {
    filterParams.push(totalEventosMin);
    havingConditions.push(`COUNT(DISTINCT ep."eventId") >= $${filterParams.length}`);
  }
  if (totalEventosMax !== null) {
    filterParams.push(totalEventosMax);
    havingConditions.push(`COUNT(DISTINCT ep."eventId") <= $${filterParams.length}`);
  }
  if (ticketMin !== null) {
    filterParams.push(ticketMin);
    havingConditions.push(`AVG(ep."valorTicket") >= $${filterParams.length}`);
  }
  if (ticketMax !== null) {
    filterParams.push(ticketMax);
    havingConditions.push(`AVG(ep."valorTicket") <= $${filterParams.length}`);
  }
  if (totalGastoMin !== null) {
    filterParams.push(totalGastoMin);
    havingConditions.push(`SUM(ep."valorTicket") >= $${filterParams.length}`);
  }
  if (totalGastoMax !== null) {
    filterParams.push(totalGastoMax);
    havingConditions.push(`SUM(ep."valorTicket") <= $${filterParams.length}`);
  }

  const whereClause  = whereConditions.join(" AND ");
  const havingClause = havingConditions.join(" AND ");

  const filterParamsSnapshot = [...filterParams];

  filterParams.push(200);
  const limitIdx = filterParams.length;
  filterParams.push(0);
  const offsetIdx = filterParams.length;

  const countSql = `
    SELECT COUNT(*)::bigint AS total
    FROM (
      SELECT c.id
      FROM contacts c
      LEFT JOIN event_participations ep ON ep."contactId" = c.id
      LEFT JOIN events e ON e.id = ep."eventId"
      LEFT JOIN event_groups eg ON eg.id = e."eventGroupId"
      WHERE ${whereClause}
      GROUP BY c.id
      HAVING ${havingClause}
    ) sub
  `;

  const dataSql = `
    SELECT
      c.id,
      c.nome,
      c.telefone,
      c.email,
      c.estado,
      c.genero,
      COUNT(DISTINCT ep."eventId")::int               AS total_eventos,
      COALESCE(AVG(ep."valorTicket"), 0)::float        AS ticket_medio,
      COALESCE(SUM(ep."valorTicket"), 0)::float        AS total_gasto
    FROM contacts c
    LEFT JOIN event_participations ep ON ep."contactId" = c.id
    LEFT JOIN events e ON e.id = ep."eventId"
    LEFT JOIN event_groups eg ON eg.id = e."eventGroupId"
    WHERE ${whereClause}
    GROUP BY c.id, c.nome, c.telefone, c.email, c.estado, c.genero
    HAVING ${havingClause}
    ORDER BY c.nome ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  try {
    type ContatoRow = {
      id: string; nome: string; telefone: string | null; email: string | null;
      estado: string | null; genero: string | null;
      total_eventos: number; ticket_medio: number; total_gasto: number;
    };

    const [countResult, contatos] = await Promise.all([
      prisma.$queryRawUnsafe<[{ total: bigint }]>(countSql, ...filterParamsSnapshot),
      prisma.$queryRawUnsafe<ContatoRow[]>(dataSql, ...filterParams),
    ]);

    return NextResponse.json({
      success: true,
      data: { contatos, total: Number(countResult[0]?.total ?? 0) },
    });
  } catch (error) {
    console.error("[marketing/audiencia GET]", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar audiência" }, { status: 500 });
  }
};
