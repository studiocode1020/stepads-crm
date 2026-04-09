"use client";

import Link from "next/link";
import {
  Users, Calendar, TrendingUp, Zap, FileUp, ArrowUpRight, Repeat2, DollarSign, Cake, Trophy,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarData, formatarDataHora } from "@/lib/utils";
import { FaturamentoChart } from "../eventos/grupo/[id]/faturamento-chart";

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
  faturamentoPorEvento: { id: string; nome: string; faturamentoTotal: number }[];
  proximoEvento: { id: string; nome: string; data: string; status: string } | null;
  eventoMaisPopular: { id: string; nome: string; participantes: number } | null;
  eventos: EventoCard[];
};

type ContatosMes = { mes: string; total: number };

// ---------- Helpers ----------

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
  contatosPorMes: _contatosPorMes,
}: {
  metricas: Metricas;
  contatosPorMes: ContatosMes[];
}) => {
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

      {/* ── Cards secundários ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Aniversariantes do mês — clicável */}
        <Link href="/aniversariantes">
          <Card className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-rose-200 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aniversariantes do Mês</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {metricas.aniversariantesDoMes.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    fazem aniversário esse mês
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 rounded-xl text-rose-600 bg-rose-50">
                    <Cake className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-primary group-hover:underline flex items-center gap-0.5">
                    Ver lista <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Evento Mais Popular */}
        <Link href={metricas.eventoMaisPopular ? `/eventos/${metricas.eventoMaisPopular.id}` : "/eventos"}>
          <Card className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-orange-200 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Evento Mais Popular</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {metricas.eventoMaisPopular?.participantes.toLocaleString("pt-BR") ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={metricas.eventoMaisPopular?.nome}>
                    {metricas.eventoMaisPopular?.nome ?? "Nenhum evento"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 rounded-xl text-orange-600 bg-orange-50">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-primary group-hover:underline flex items-center gap-0.5">
                    Ver evento <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
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

        {/* Gráfico de faturamento por evento */}
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Faturamento por Evento</CardTitle>
            </div>
            <CardDescription>Receita acumulada de cada evento</CardDescription>
          </CardHeader>
          <CardContent>
            <FaturamentoChart edicoes={metricas.faturamentoPorEvento} horizontal />
          </CardContent>
        </Card>

        {/* Importações recentes */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Importações Recentes</CardTitle>
              </div>
              <Link
                href="/importacoes"
                className="text-xs text-primary hover:underline flex items-center gap-0.5 flex-shrink-0"
              >
                Ver todas <ArrowUpRight className="w-3 h-3" />
              </Link>
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
