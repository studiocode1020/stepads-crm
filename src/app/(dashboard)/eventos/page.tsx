import { buscarEventos } from "@/lib/queries/eventos";
import { EventosCliente } from "./eventos-cliente";

export const dynamic = "force-dynamic";

const EventosPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string }>;
}) => {
  const params = await searchParams;
  const pagina = Number(params.pagina ?? 1);
  const busca = params.busca ?? "";

  const { eventos, total, paginas } = await buscarEventos({ pagina, busca });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <p className="text-muted-foreground mt-1">{total.toLocaleString("pt-BR")} eventos cadastrados</p>
      </div>
      <EventosCliente
        eventos={eventos}
        total={total}
        paginas={paginas}
        paginaAtual={pagina}
        buscaInicial={busca}
      />
    </div>
  );
};

export default EventosPage;
