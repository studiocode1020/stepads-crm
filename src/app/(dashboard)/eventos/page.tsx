import { buscarEventos, buscarGruposEvento } from "@/lib/queries/eventos";
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

  const [{ eventos, total }, grupos] = await Promise.all([
    buscarEventos({ pagina, busca }),
    buscarGruposEvento(),
  ]);

  // Separa eventos sem grupo
  const eventosSemGrupo = eventos.filter((e) => !e.eventGroup);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <p className="text-muted-foreground mt-1">
          {grupos.length} grupo{grupos.length !== 1 ? "s" : ""} · {total.toLocaleString("pt-BR")} eventos cadastrados
        </p>
      </div>
      <EventosCliente
        grupos={grupos}
        eventosSemGrupo={eventosSemGrupo}
        totalEventos={total}
        buscaInicial={busca}
      />
    </div>
  );
};

export default EventosPage;
