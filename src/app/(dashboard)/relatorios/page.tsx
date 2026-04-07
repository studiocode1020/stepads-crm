import { buscarContatosPorEvento, buscarCrescimentoPorMes, buscarTopContatos } from "@/lib/queries/relatorios";
import { RelatoriosCliente } from "./relatorios-cliente";

export const dynamic = "force-dynamic";

const RelatoriosPage = async () => {
  const [contatosPorEvento, crescimentoPorMes, topContatos] = await Promise.all([
    buscarContatosPorEvento(),
    buscarCrescimentoPorMes(12),
    buscarTopContatos(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise da sua base de contatos e eventos</p>
      </div>
      <RelatoriosCliente
        contatosPorEvento={contatosPorEvento}
        crescimentoPorMes={crescimentoPorMes}
        topContatos={topContatos}
      />
    </div>
  );
};

export default RelatoriosPage;
