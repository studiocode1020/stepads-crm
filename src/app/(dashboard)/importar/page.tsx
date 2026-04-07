import { listarTodosEventos } from "@/lib/queries/eventos";
import { ImportarCliente } from "./importar-cliente";

export const dynamic = "force-dynamic";

const ImportarPage = async () => {
  const eventos = await listarTodosEventos();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar Planilha</h1>
        <p className="text-muted-foreground mt-1">
          Faça upload de uma planilha .xlsx ou .csv para importar contatos
        </p>
      </div>
      <ImportarCliente eventos={eventos} />
    </div>
  );
};

export default ImportarPage;
