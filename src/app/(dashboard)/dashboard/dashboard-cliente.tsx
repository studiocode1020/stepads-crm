"use client";

import { Users, Calendar, UserPlus, Cake, FileUp, TrendingUp, Trophy, Repeat2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarDataHora } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Metricas = {
  totalContatos: number;
  totalEventos: number;
  contatosEsteMes: number;
  aniversariantesDoMes: number;
  importacoesRecentes: {
    id: string;
    nomeArquivo: string;
    novosContatos: number;
    duplicados: number;
    erros: number;
    criadoEm: Date;
    event: { nome: string } | null;
  }[];
  eventoMaisPopular: { nome: string; participantes: number } | null;
  taxaRetorno: number;
};

type ContatosMes = { mes: string; total: number };

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatarMes = (mes: string) => {
  const [, m] = mes.split("-");
  return MESES_PT[Number(m) - 1] ?? mes;
};

export const DashboardCliente = ({
  metricas,
  contatosPorMes,
}: {
  metricas: Metricas;
  contatosPorMes: ContatosMes[];
}) => {
  const dadosGrafico = contatosPorMes.map((d) => ({
    mes: formatarMes(d.mes),
    contatos: d.total,
  }));

  const cards = [
    {
      titulo: "Total de Contatos",
      valor: metricas.totalContatos.toLocaleString("pt-BR"),
      descricao: "contatos cadastrados",
      icone: Users,
      cor: "text-primary bg-primary/10",
    },
    {
      titulo: "Total de Eventos",
      valor: metricas.totalEventos.toLocaleString("pt-BR"),
      descricao: "eventos criados",
      icone: Calendar,
      cor: "text-emerald-600 bg-emerald-50",
    },
    {
      titulo: "Novos este mês",
      valor: metricas.contatosEsteMes.toLocaleString("pt-BR"),
      descricao: "contatos adicionados",
      icone: UserPlus,
      cor: "text-amber-600 bg-amber-50",
    },
    {
      titulo: "Aniversariantes",
      valor: metricas.aniversariantesDoMes.toLocaleString("pt-BR"),
      descricao: "fazem aniversário esse mês",
      icone: Cake,
      cor: "text-rose-600 bg-rose-50",
    },
    {
      titulo: "Taxa de Retorno",
      valor: `${metricas.taxaRetorno}%`,
      descricao: "foram a 2+ eventos",
      icone: Repeat2,
      cor: "text-violet-600 bg-violet-50",
    },
    {
      titulo: "Evento Mais Popular",
      valor: metricas.eventoMaisPopular?.participantes.toLocaleString("pt-BR") ?? "—",
      descricao: metricas.eventoMaisPopular?.nome ?? "Nenhum evento",
      icone: Trophy,
      cor: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icone = card.icone;
          return (
            <Card key={card.titulo} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.titulo}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.valor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.descricao}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.cor}`}>
                    <Icone className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico */}
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Crescimento da Base</CardTitle>
            </div>
            <CardDescription>Novos contatos nos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dadosGrafico} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradContatos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#534AB7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                  formatter={(v) => [v, "Contatos"]}
                />
                <Area
                  type="monotone"
                  dataKey="contatos"
                  stroke="#534AB7"
                  strokeWidth={2.5}
                  fill="url(#gradContatos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atividades recentes */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Importações Recentes</CardTitle>
            </div>
            <CardDescription>Últimas planilhas processadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metricas.importacoesRecentes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma importação realizada
                </p>
              )}
              {metricas.importacoesRecentes.map((imp) => (
                <div key={imp.id} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]" title={imp.nomeArquivo}>
                      {imp.nomeArquivo}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatarDataHora(imp.criadoEm)}
                    </span>
                  </div>
                  {imp.event && (
                    <p className="text-xs text-muted-foreground">{imp.event.nome}</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">
                      +{imp.novosContatos} novos
                    </Badge>
                    {imp.duplicados > 0 && (
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-0">
                        {imp.duplicados} dup.
                      </Badge>
                    )}
                    {imp.erros > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {imp.erros} erros
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
