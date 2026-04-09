import {
  buscarClientesConsolidados,
  buscarMetricasClientes,
  listarOrigensContatos,
} from "@/lib/queries/contatos";
import { listarTodosEventos } from "@/lib/queries/eventos";
import { ContatosCliente } from "./contatos-cliente";

export const dynamic = "force-dynamic";

const ContatosPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    pagina?: string;
    aniversarioMes?: string;
    totalEventosMin?: string;
    totalEventosMax?: string;
    origem?: string;
    ticketMin?: string;
    ticketMax?: string;
    eventoId?: string;
  }>;
}) => {
  const params = await searchParams;
  const pagina = Number(params.pagina ?? 1);

  const filtros = {
    busca: params.busca ?? "",
    aniversarioMes: params.aniversarioMes ? Number(params.aniversarioMes) : undefined,
    totalEventosMin: params.totalEventosMin ? Number(params.totalEventosMin) : undefined,
    totalEventosMax: params.totalEventosMax ? Number(params.totalEventosMax) : undefined,
    origem: params.origem ?? "",
    ticketMin: params.ticketMin ? Number(params.ticketMin) : undefined,
    ticketMax: params.ticketMax ? Number(params.ticketMax) : undefined,
    eventoId: params.eventoId ?? "",
    pagina,
  };

  const [{ clientes, total, paginas }, metricas, origens, eventos] = await Promise.all([
    buscarClientesConsolidados(filtros),
    buscarMetricasClientes(),
    listarOrigensContatos(),
    listarTodosEventos(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-muted-foreground mt-1">
          {total.toLocaleString("pt-BR")} cliente{total !== 1 ? "s" : ""} na base
        </p>
      </div>
      <ContatosCliente
        clientes={clientes}
        total={total}
        paginas={paginas}
        paginaAtual={pagina}
        metricas={metricas}
        origens={origens}
        eventos={eventos}
        filtrosIniciais={filtros}
      />
    </div>
  );
};

export default ContatosPage;
