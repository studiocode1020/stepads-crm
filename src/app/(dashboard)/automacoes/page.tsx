import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Bell, MessageSquare, Zap, Users, TrendingUp } from "lucide-react";

const automacoesFuturas = [
  {
    icone: Cake,
    titulo: "Mensagens de Aniversário",
    descricao: "Envie mensagens automáticas de feliz aniversário para seus contatos no dia especial deles.",
    status: "Em breve",
    cor: "text-pink-500 bg-pink-50",
  },
  {
    icone: Bell,
    titulo: "Convites Automáticos",
    descricao: "Convide automaticamente contatos para novos eventos com base em seu histórico de participação.",
    status: "Em breve",
    cor: "text-amber-500 bg-amber-50",
  },
  {
    icone: MessageSquare,
    titulo: "Campanhas de Reengajamento",
    descricao: "Reative contatos que não participam de eventos há mais de 3 meses com campanhas personalizadas.",
    status: "Em breve",
    cor: "text-blue-500 bg-blue-50",
  },
  {
    icone: Users,
    titulo: "Segmentação Automática",
    descricao: "Aplique tags e segmente sua base automaticamente com base em comportamentos e participações.",
    status: "Em breve",
    cor: "text-emerald-500 bg-emerald-50",
  },
  {
    icone: TrendingUp,
    titulo: "Relatórios Automáticos",
    descricao: "Receba relatórios semanais e mensais por e-mail com as principais métricas do seu CRM.",
    status: "Em breve",
    cor: "text-violet-500 bg-violet-50",
  },
  {
    icone: Zap,
    titulo: "Integrações (WhatsApp / E-mail)",
    descricao: "Conecte seu CRM ao WhatsApp Business e plataformas de e-mail para automações completas.",
    status: "Em breve",
    cor: "text-orange-500 bg-orange-50",
  },
];

const AutomacoesPage = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
          <Badge className="bg-amber-100 text-amber-800 border-0 font-medium">Em desenvolvimento</Badge>
        </div>
        <p className="text-muted-foreground">
          Funcionalidades de automação estão sendo desenvolvidas. Veja o que está por vir:
        </p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Automações Inteligentes</h2>
            <p className="text-white/80 text-sm">Próxima grande atualização do StepAds CRM</p>
          </div>
        </div>
        <p className="text-white/90 text-sm max-w-2xl">
          Em breve você poderá automatizar tarefas repetitivas, enviar mensagens personalizadas e
          engajar sua base de contatos de forma inteligente — tudo dentro do CRM.
        </p>
      </div>

      {/* Cards de funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {automacoesFuturas.map((item) => {
          const Icone = item.icone;
          return (
            <Card key={item.titulo} className="shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -translate-y-12 translate-x-12 opacity-50" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${item.cor}`}>
                    <Icone className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                    {item.status}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">{item.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {item.descricao}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AutomacoesPage;
