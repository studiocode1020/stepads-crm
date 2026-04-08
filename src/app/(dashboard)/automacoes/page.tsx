import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { AutomacoesCliente } from "./automacoes-cliente";

const AutomacoesPage = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
          <Badge className="bg-emerald-100 text-emerald-800 border-0 font-medium">WhatsApp</Badge>
        </div>
        <p className="text-muted-foreground">
          Importe uma base de contatos, simule o custo e dispare mensagens via WhatsApp.
        </p>
      </div>

      <AutomacoesCliente />
    </div>
  );
};

export default AutomacoesPage;
