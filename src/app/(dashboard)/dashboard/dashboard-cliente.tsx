"use client";

import Link from "next/link";
import {
  Users, Calendar, TrendingUp, Zap, FileUp, ArrowUpRight, Repeat2, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarData, formatarDataHora } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ---------- Types ----------

type EventoCard = {
  id: string;
  nome: string;
  data: string;
  status: string;
  participantes: number;
};

type Metricas = {
  totalContatos: number;
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
  clientesRecorrentes: number;
  ticketMedio: number | null;
  proximoEvento: { id: string; nome: string; data: string; status: string } | null;
  eventos: EventoCard[];
};

type ContatosMes = { mes: string; total: number };

// ---------- Helpers ----------

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatarMes = (mes: string) => {
  const [, m] = mes.split("-");
  return MESES_PT[Number(m) - 1] ?? mes;
};

const formatarMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const getStatusEvento = (status: string, dataIso: string) => {
  const agora = new Date();
  const data = new Date(dataIso);
  if (status === "cancelado") {
    return { label: "Cancelado", className: "bg-red-100 text-red-700" };
  }
  if (status === "realizado" || data < agora) {
    return { label: "Concluído", className: "bg-gray-100 text-gray-600" };
  }
  const diasAte = Math.ceil((data.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  if (diasAte <= 30) {
    return { label: "Em breve", className: "bg-amber-100 text-amber-700", emBreve: true };
  }
  return {
    label: status === "confirmado" ? "Confirmado" : "Planejamento",
    className: "bg-blue-100 text-blue-700",
  };
};

// Ordena: próximos eventos (asc), depois passados (desc)
const sortEventos = (eventos: EventoCard[]) => {
  const agora = new Date();
  const upcoming = eventos
    .filter((e) => new Date(e.data) >= agora)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const past = eventos
    .filter((e) => new Date(e.data) < agora)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return [...upcoming, ...past];
};

// ---------- Componente ----------

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

  const eventosOrdenados = sortEventos(metricas.eventos);
  const agora = new Date();

  const diasParaProximo = metricas.proximoEvento
    ? Math.ceil(
        (new Date(metricas.proximoEvento.data).getTime() - agora.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-8">

      {/* ── 4 Cards principais ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Card 1: Tamanho da base */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamanho da Base</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metricas.totalContatos.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">contatos cadastrados</p>
              </div>
              <div className="p-3 rounded-xl text-primary bg-primary/10">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Clientes recorrentes */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Recorrentes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metricas.clientesRecorrentes.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">participaram de 2+ eventos</p>
              </div>
              <div className="p-3 rounded-xl text-violet-600 bg-violet-50">
                <Repeat2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Ticket médio */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metricas.ticketMedio != null ? formatarMoeda(metricas.ticketMedio) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metricas.ticketMedio != null
                    ? "por cliente por evento"
                    : "sem dados de orçamento"}
                </p>
              </div>
              <div className="p-3 rounded-xl text-emerald-600 bg-emerald-50">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Próximo evento — destaque visual */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" />
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                    Próximo Evento
                  </p>
                </div>
                {metricas.proximoEvento ? (
                  <>
                    <p
                      className="text-base font-bold text-white leading-snug line-clamp-2"
                      title={metricas.proximoEvento.nome}
                    >
                      {metricas.proximoEvento.nome}
                    </p>
                    <p className="text-sm text-white/80 mt-1">
                      {formatarData(metricas.proximoEvento.data)}
                    </p>
                    {diasParaProximo !== null && diasParaProximo <= 30 && (
                      <span className="mt-2 inline-block text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                        Em {diasParaProximo} dia{diasParaProximo !== 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/70 mt-1">Nenhum evento próximo</p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-white/20 flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Eventos da produtora ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Eventos da Produtora</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {metricas.eventos.length} evento{metricas.eventos.length !== 1 ? "s" : ""} cadastrado{metricas.eventos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/eventos"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {eventosOrdenados.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">Nenhum evento cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {eventosOrdenados.map((evento) => {
              const st = getStatusEvento(evento.status, evento.data);
              const isUpcoming =
                new Date(evento.data) >= agora &&
                evento.status !== "cancelado" &&
                evento.status !== "realizado";

              return (
                <Link key={evento.id} href={`/eventos/${evento.id}`}>
                  <Card
                    className={`shadow-sm hover:shadow-md transition-all cursor-pointer h-full ${
                      isUpcoming
                        ? "border-primary/20 hover:border-primary/40"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
                          {evento.nome}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium flex-shrink-0 ${st.className} ${
                            "emBreve" in st && st.emBreve ? "ring-1 ring-amber-300" : ""
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{formatarData(evento.data)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {evento.participantes.toLocaleString("pt-BR")}{" "}
                            {evento.participantes === 1 ? "participante" : "participantes"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Seção secundária ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Gráfico de crescimento */}
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

        {/* Importações recentes */}
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
                    <p
                      className="text-sm font-medium text-gray-900 truncate max-w-[160px]"
                      title={imp.nomeArquivo}
                    >
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
