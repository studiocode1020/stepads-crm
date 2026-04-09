import { Zap } from "lucide-react";
import { AutomacoesCliente } from "./automacoes-cliente";

const AutomacoesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ contatos?: string }>;
}) => {
  const params = await searchParams;
  const contatosPreSelecionados = params.contatos ?? "";

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
        </div>
        <p className="text-muted-foreground">
          Configure regras contínuas de comunicação que rodam automaticamente para você.
        </p>
      </div>

      <AutomacoesCliente contatosPreSelecionados={contatosPreSelecionados} />
    </div>
  );
};

export default AutomacoesPage;
