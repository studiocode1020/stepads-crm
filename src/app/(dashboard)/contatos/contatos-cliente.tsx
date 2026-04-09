"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Download, Filter, Trash2, Eye, Users, TrendingUp,
  DollarSign, BarChart2, CheckSquare, Square, Send, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatarData } from "@/lib/utils";
import type { ClienteConsolidado } from "@/lib/queries/contatos";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type Metricas = {
  totalContatos: number;
  ticketMedio: number | null;
  mediaGasto: number | null;
  mediaEventos: number | null;
};

type FiltrosIniciais = {
  busca: string;
  aniversarioMes?: number;
  totalEventosMin?: number;
  totalEventosMax?: number;
  origem: string;
  ticketMin?: number;
  ticketMax?: number;
  eventoId: string;
};

type Props = {
  clientes: ClienteConsolidado[];
  total: number;
  paginas: number;
  paginaAtual: number;
  metricas: Metricas;
  origens: string[];
  eventos: { id: string; nome: string; data: Date | string }[];
  filtrosIniciais: FiltrosIniciais;
};

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export const ContatosCliente = ({
  clientes, total, paginas, paginaAtual, metricas, origens, eventos, filtrosIniciais,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Filtros
  const [busca, setBusca] = useState(filtrosIniciais.busca);
  const [aniversarioMes, setAniversarioMes] = useState(filtrosIniciais.aniversarioMes?.toString() ?? "");
  const [totalEventosMin, setTotalEventosMin] = useState(filtrosIniciais.totalEventosMin?.toString() ?? "");
  const [totalEventosMax, setTotalEventosMax] = useState(filtrosIniciais.totalEventosMax?.toString() ?? "");
  const [origem, setOrigem] = useState(filtrosIniciais.origem);
  const [ticketMin, setTicketMin] = useState(filtrosIniciais.ticketMin?.toString() ?? "");
  const [ticketMax, setTicketMax] = useState(filtrosIniciais.ticketMax?.toString() ?? "");
  const [eventoId, setEventoId] = useState(filtrosIniciais.eventoId);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Seleção
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Deleção
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [confirmandoDeleteLote, setConfirmandoDeleteLote] = useState(false);

  const aplicarFiltros = (pg = 1) => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (aniversarioMes) params.set("aniversarioMes", aniversarioMes);
    if (totalEventosMin) params.set("totalEventosMin", totalEventosMin);
    if (totalEventosMax) params.set("totalEventosMax", totalEventosMax);
    if (origem) params.set("origem", origem);
    if (ticketMin) params.set("ticketMin", ticketMin);
    if (ticketMax) params.set("ticketMax", ticketMax);
    if (eventoId) params.set("eventoId", eventoId);
    if (pg > 1) params.set("pagina", String(pg));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const limparFiltros = () => {
    setBusca("");
    setAniversarioMes("");
    setTotalEventosMin("");
    setTotalEventosMax("");
    setOrigem("");
    setTicketMin("");
    setTicketMax("");
    setEventoId("");
    startTransition(() => router.push(pathname));
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === clientes.length && clientes.length > 0) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(clientes.map((c) => c.id)));
    }
  };

  const enviarParaMarketing = () => {
    const ids = Array.from(selecionados).join(",");
    router.push(`/marketing?contatos=${ids}&origem=clientes`);
  };

  const handleDeletar = async () => {
    if (!deletandoId) return;
    const resp = await fetch(`/api/contatos/${deletandoId}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.success) {
      toast.success("Contato removido");
      router.refresh();
    } else {
      toast.error("Erro ao remover contato");
    }
    setDeletandoId(null);
  };

  const handleDeletarLote = async () => {
    const ids = Array.from(selecionados);
    const resp = await fetch("/api/contatos/deletar-lote", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const json = await resp.json();
    if (json.success) {
      toast.success(`${json.count} cliente${json.count !== 1 ? "s" : ""} removido${json.count !== 1 ? "s" : ""}`);
      setSelecionados(new Set());
      router.refresh();
    } else {
      toast.error("Erro ao remover clientes");
    }
    setConfirmandoDeleteLote(false);
  };

  const exportar = () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (eventoId) params.set("eventoId", eventoId);
    window.open(`/api/contatos/exportar?${params.toString()}`, "_blank");
  };

  const temFiltrosAtivos =
    busca || aniversarioMes || totalEventosMin || totalEventosMax ||
    origem || ticketMin || ticketMax || eventoId;

  const moeda = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      {/* ── Bloco 1 — Resumo da base ─────────────────────────────────── */}
      <TooltipProvider>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Card className="shadow-sm cursor-default">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricas.totalContatos.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">Clientes únicos</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Total de clientes cadastrados na base, sem duplicatas — cada pessoa conta uma vez independente de quantos eventos participou.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Card className="shadow-sm cursor-default">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricas.ticketMedio != null ? moeda(metricas.ticketMedio) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Ticket médio</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Valor médio pago por ingresso considerando todas as participações registradas na base.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Card className="shadow-sm cursor-default">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricas.mediaGasto != null ? moeda(metricas.mediaGasto) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Média gasto / cliente</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Quanto cada cliente gastou em média no total — soma de todos os seus ingressos dividida pelo número de clientes.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Card className="shadow-sm cursor-default">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricas.mediaEventos != null ? Number(metricas.mediaEventos).toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Média de eventos</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Média de eventos que cada cliente já participou. Indica o nível de fidelidade e recorrência da sua base.
            </TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>

      {/* ── Bloco 2 — Filtros ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-4 shadow-sm mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              className="pl-9"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setFiltrosAbertos((v) => !v)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {temFiltrosAtivos && <span className="w-2 h-2 rounded-full bg-primary" />}
            {filtrosAbertos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

          <Button onClick={() => aplicarFiltros()}>Buscar</Button>

          {temFiltrosAtivos && (
            <Button variant="ghost" onClick={limparFiltros} className="gap-1 text-muted-foreground">
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={exportar}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {filtrosAbertos && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Aniversário */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Mês de aniversário
              </label>
              <Select
                value={aniversarioMes || "todos"}
                onValueChange={(v) => setAniversarioMes(v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses">
                    {(v: string) => (!v || v === "todos") ? "Todos os meses" : (MESES[parseInt(v) - 1] ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {MESES.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Evento */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Participou do evento
              </label>
              <Select
                value={eventoId || "todos"}
                onValueChange={(v) => setEventoId(v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os eventos">
                    {(v: string) => (!v || v === "todos") ? "Todos os eventos" : (eventos.find(e => e.id === v)?.nome ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os eventos</SelectItem>
                  {eventos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origem */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Origem
              </label>
              <Select
                value={origem || "todas"}
                onValueChange={(v) => setOrigem(v === "todas" ? "" : (v ?? ""))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as origens</SelectItem>
                  {origens.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Faixa de ticket médio */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Ticket médio (R$)
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={ticketMin}
                  onChange={(e) => setTicketMin(e.target.value)}
                  min={0}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={ticketMax}
                  onChange={(e) => setTicketMax(e.target.value)}
                  min={0}
                  className="w-24"
                />
              </div>
            </div>

            {/* Total de eventos */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Total de eventos
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={totalEventosMin}
                  onChange={(e) => setTotalEventosMin(e.target.value)}
                  min={0}
                  className="w-20"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={totalEventosMax}
                  onChange={(e) => setTotalEventosMax(e.target.value)}
                  min={0}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Barra de seleção ─────────────────────────────────────────── */}
      {selecionados.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-gray-900">
              {selecionados.size} cliente{selecionados.size !== 1 ? "s" : ""} selecionado{selecionados.size !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelecionados(new Set())}
            >
              Cancelar seleção
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setConfirmandoDeleteLote(true)}
            >
              <Trash2 className="w-4 h-4" />
              Excluir {selecionados.size} cliente{selecionados.size !== 1 ? "s" : ""}
            </Button>
            <Button size="sm" onClick={enviarParaMarketing} className="gap-2">
              <Send className="w-4 h-4" />
              Enviar para Marketing
            </Button>
          </div>
        </div>
      )}

      {/* ── Bloco 3 — Tabela consolidada ─────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-10">
                  <button onClick={toggleTodos}>
                    {selecionados.size === clientes.length && clientes.length > 0
                      ? <CheckSquare className="w-4 h-4 text-primary" />
                      : <Square className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Aniversário</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold text-right">Total Gasto</TableHead>
                <TableHead className="font-semibold text-right">Ticket Médio</TableHead>
                <TableHead className="font-semibold text-center">Eventos</TableHead>
                <TableHead className="font-semibold">Participações</TableHead>
                <TableHead className="font-semibold">Última Participação</TableHead>
                <TableHead className="font-semibold">Origem</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-12"
                  >
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
              {clientes.map((c) => (
                <TableRow
                  key={c.id}
                  className={`hover:bg-gray-50/50 cursor-pointer select-none ${
                    selecionados.has(c.id) ? "bg-primary/5" : ""
                  }`}
                  onClick={() => toggleSelecionado(c.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelecionado(c.id)}>
                      {selecionados.has(c.id)
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/contatos/${c.id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors whitespace-nowrap"
                    >
                      {c.nome}
                    </Link>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {c.datanascimento ? formatarData(c.datanascimento) : "—"}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {c.estado ?? "—"}
                  </TableCell>

                  <TableCell className="text-sm text-right font-medium whitespace-nowrap">
                    {c.total_gasto > 0 ? moeda(c.total_gasto) : "—"}
                  </TableCell>

                  <TableCell className="text-sm text-right text-muted-foreground whitespace-nowrap">
                    {c.ticket_medio > 0 ? moeda(c.ticket_medio) : "—"}
                  </TableCell>

                  <TableCell className="text-center">
                    {c.total_eventos > 0 ? (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          c.total_eventos >= 4
                            ? "bg-violet-100 text-violet-700"
                            : c.total_eventos >= 2
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                        }`}
                      >
                        {c.total_eventos}x
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[220px]">
                      {c.participacoes.slice(0, 2).map((p) => (
                        <Badge
                          key={p.id}
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          {p.nome}
                        </Badge>
                      ))}
                      {c.participacoes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{c.participacoes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm whitespace-nowrap">
                    {c.ultima_participacao_nome ? (
                      <div>
                        <p
                          className="text-xs font-medium text-gray-700 truncate max-w-[160px]"
                          title={c.ultima_participacao_nome}
                        >
                          {c.ultima_participacao_nome}
                        </p>
                        {c.ultima_participacao_data && (
                          <p className="text-xs text-muted-foreground">
                            {formatarData(c.ultima_participacao_data)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {c.origem ?? "—"}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/contatos/${c.id}`}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button
                        className="p-1.5 rounded-md hover:bg-red-50 hover:text-destructive transition-colors"
                        onClick={() => setDeletandoId(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {paginas > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
          <span>
            Página {paginaAtual} de {paginas} ({total.toLocaleString("pt-BR")} clientes)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual <= 1}
              onClick={() => aplicarFiltros(paginaAtual - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual >= paginas}
              onClick={() => aplicarFiltros(paginaAtual + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Confirmação de deleção individual */}
      <AlertDialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido junto com seu histórico de participações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de deleção em lote */}
      <AlertDialog open={confirmandoDeleteLote} onOpenChange={setConfirmandoDeleteLote}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {selecionados.size} cliente{selecionados.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os clientes selecionados serão removidos permanentemente junto com seus históricos de participações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletarLote}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir {selecionados.size} cliente{selecionados.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
