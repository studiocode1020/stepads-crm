import { prisma } from "@/lib/prisma";
import { EmpresasCliente } from "./empresas-cliente";

export const dynamic = "force-dynamic";

const EmpresasPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string }>;
}) => {
  const params = await searchParams;
  const pagina = Number(params.pagina ?? 1);
  const busca = params.busca ?? "";
  const porPagina = 20;

  const where = busca
    ? { nome: { contains: busca, mode: "insensitive" as const } }
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <p className="text-muted-foreground mt-1">{total} empresas cadastradas</p>
      </div>
      <EmpresasCliente
        empresas={empresas}
        total={total}
        paginas={Math.ceil(total / porPagina)}
        paginaAtual={pagina}
        buscaInicial={busca}
      />
    </div>
  );
};

export default EmpresasPage;
