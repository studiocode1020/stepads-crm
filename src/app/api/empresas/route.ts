import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional(),
  site: z.string().optional(),
  observacoes: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  const busca = req.nextUrl.searchParams.get("busca") ?? "";
  const pagina = Number(req.nextUrl.searchParams.get("pagina") ?? 1);
  const porPagina = 20;

  const where = busca
    ? { OR: [{ nome: { contains: busca, mode: "insensitive" as const } }] }
    : {};

  const [empresas, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: { _count: { select: { eventos: true } } },
      orderBy: { nome: "asc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { empresas, total, paginas: Math.ceil(total / porPagina) } });
};

export const POST = async (req: NextRequest) => {
  const sessao = await auth();
  if (!sessao) return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const dados = schema.parse(body);
    const empresa = await prisma.company.create({ data: { ...dados, email: dados.email || undefined } });
    return NextResponse.json({ success: true, data: empresa }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
};
