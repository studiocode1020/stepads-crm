"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle,
  RefreshCw, Send, History, MessageSquare, DollarSign, Users, XCircle,
  Database, Search, CheckSquare, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------- Types ----------

type Origem = "planilha" | "crm";
type Etapa = "upload" | "mapeamento" | "simulacao" | "disparando" | "resultado";

type ContatoCRM = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
};

type Campanha = {
  id: string;
  nome: string;
  status: string;
  totalContatos: number;
  enviados: number;
  falhas: number;
  custoUnitario: number;
  custoTotal: number;
  criadoEm: string;
  mensagem: string;
};

type ResultadoDisparo = {
  campanhaId: string;
  totalContatos: number;
  enviados: number;
  falhas: number;
  custoTotal: number;
};

type Evento = { id: string; nome: string };
type Tag = { id: string; nome: string; cor: string };

const CAMPOS_SISTEMA = [
  { value: "", label: "— Ignorar coluna —" },
  { value: "nome", label: "Nome" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "dataNascimento", label: "Data de Nascimento" },
  { value: "observacoes", label: "Observações" },
];

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente:     { label: "Pendente",     variant: "secondary" },
  em_andamento: { label: "Em andamento", variant: "default" },
  concluida:    { label: "Concluída",    variant: "default" },
  erro:         { label: "Com erros",    variant: "destructive" },
};

const formatarMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatarData = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

// ---------- Histórico ----------

const Historico = () => {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await fetch("/api/automacoes");
      const json = await resp.json();
      if (json.success) setCampanhas(json.data);
    } catch {
      toast.error("Erro ao carregar histórico");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando histórico...
      </div>
    );
  }

  if (campanhas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <History className="w-10 h-10 opacity-30" />
        <p className="text-sm">Nenhuma campanha disparada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{campanhas.length} campanha(s) encontrada(s)</p>
        <Button variant="outline" size="sm" onClick={carregar}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Campanha</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Enviados</TableHead>
              <TableHead className="text-center">Falhas</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.map((c) => {
              const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "outline" as const };
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={c.mensagem}>
                      {c.mensagem}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatarData(c.criadoEm)}
                  </TableCell>
                  <TableCell className="text-center font-medium">{c.totalContatos}</TableCell>
                  <TableCell className="text-center text-emerald-600 font-medium">{c.enviados}</TableCell>
                  <TableCell className="text-center text-red-500 font-medium">{c.falhas}</TableCell>
                  <TableCell className="text-right font-medium">{formatarMoeda(c.custoTotal)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ---------- Seletor de contatos do CRM ----------

const SeletorCRM = ({
  onConfirmar,
}: {
  onConfirmar: (contatos: ContatoCRM[]) => void;
}) => {
  const [contatos, setContatos] = useState<ContatoCRM[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  // Carregar tags e eventos para os filtros
  useEffect(() => {
    Promise.all([
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/eventos").then((r) => r.json()),
    ]).then(([tagsJson, eventosJson]) => {
      if (tagsJson.success) setTags(tagsJson.data);
      if (eventosJson.success) setEventos(eventosJson.data?.eventos ?? []);
    }).catch(() => {});
  }, []);

  const buscarContatos = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroTag) params.set("tagId", filtroTag);
      if (filtroEvento) params.set("eventoId", filtroEvento);
      const resp = await fetch(`/api/automacoes/contatos?${params}`);
      const json = await resp.json();
      if (json.success) {
        setContatos(json.data);
        setSelecionados(new Set(json.data.map((c: ContatoCRM) => c.id)));
      }
    } catch {
      toast.error("Erro ao carregar contatos");
    } finally {
      setCarregando(false);
    }
  }, [filtroTag, filtroEvento]);

  useEffect(() => { buscarContatos(); }, [buscarContatos]);

  const contatosFiltrados = contatos.filter((c) =>
    busca ? c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone ?? "").includes(busca) : true
  );

  const toggleTodos = () => {
    if (selecionados.size === contatosFiltrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(contatosFiltrados.map((c) => c.id)));
    }
  };

  const toggleContato = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const contatosSelecionados = contatos.filter((c) => selecionados.has(c.id));

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroTag || "todos"} onValueChange={(v) => setFiltroTag(v === "todos" ? "" : (v ?? ""))}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroEvento || "todos"} onValueChange={(v) => setFiltroEvento(v === "todos" ? "" : (v ?? ""))}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os eventos</SelectItem>
            {eventos.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador e seleção em massa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={toggleTodos} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {selecionados.size === contatosFiltrados.length && contatosFiltrados.length > 0
              ? <CheckSquare className="w-4 h-4 text-primary" />
              : <Square className="w-4 h-4" />}
            Selecionar todos
          </button>
          {selecionados.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selecionados.size} selecionado(s)
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {carregando ? "Carregando..." : `${contatosFiltrados.length} contato(s) com telefone`}
        </p>
      </div>

      {/* Lista */}
      <div className="rounded-xl border overflow-hidden max-h-72 overflow-y-auto">
        {carregando ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Carregando...
          </div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Users className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhum contato com telefone encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatosFiltrados.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => toggleContato(c.id)}
                >
                  <TableCell>
                    {selecionados.has(c.id)
                      ? <CheckSquare className="w-4 h-4 text-primary" />
                      : <Square className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.telefone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Button
        onClick={() => onConfirmar(contatosSelecionados)}
        disabled={contatosSelecionados.length === 0}
      >
        Usar {contatosSelecionados.length} contato(s) selecionado(s)
      </Button>
    </div>
  );
};

// ---------- Wizard principal ----------

export const AutomacoesCliente = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [origem, setOrigem] = useState<Origem>("planilha");

  // Planilha
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colunas, setColunas] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [totalLinhas, setTotalLinhas] = useState(0);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});

  // CRM
  const [contatosCRM, setContatosCRM] = useState<ContatoCRM[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Simulação
  const [nomeCampanha, setNomeCampanha] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [custoUnitario] = useState(0.35);

  const [resultado, setResultado] = useState<ResultadoDisparo | null>(null);

  const totalDisponivel = origem === "crm" ? contatosCRM.length : totalLinhas;
  const quantidadeNum = parseInt(quantidade, 10);
  const quantidadeValida = !isNaN(quantidadeNum) && quantidadeNum > 0 && quantidadeNum <= totalDisponivel;
  const custoEstimado = quantidadeValida ? parseFloat((quantidadeNum * custoUnitario).toFixed(2)) : 0;

  const handleArquivo = async (file: File) => {
    setArquivo(file);
    setCarregando(true);
    try {
      const form = new FormData();
      form.append("arquivo", file);
      const resp = await fetch("/api/importar", { method: "POST", body: form });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error);
      const { colunas: cols, preview: prev, totalLinhas: total } = json.data;
      setColunas(cols);
      setPreview(prev);
      setTotalLinhas(total);
      const autoMap: Record<string, string> = {};
      cols.forEach((col: string) => {
        const c = col.toLowerCase();
        if (c.includes("nome")) autoMap[col] = "nome";
        else if (c.includes("tel") || c.includes("fone") || c.includes("celular") || c.includes("whatsapp")) autoMap[col] = "telefone";
        else if (c.includes("email") || c.includes("e-mail")) autoMap[col] = "email";
        else autoMap[col] = "";
      });
      setMapeamento(autoMap);
      setEtapa("mapeamento");
    } catch (error) {
      toast.error(`Erro ao processar arquivo: ${error}`);
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarCRM = (contatos: ContatoCRM[]) => {
    setContatosCRM(contatos);
    setQuantidade(String(contatos.length));
    setEtapa("simulacao");
  };

  const handleDisparar = async () => {
    if (!nomeCampanha || !mensagem || !quantidadeValida) return;
    setEtapa("disparando");
    setProgresso(10);
    setCarregando(true);

    try {
      const form = new FormData();
      form.append("nomeCampanha", nomeCampanha);
      form.append("mensagem", mensagem);
      form.append("quantidade", String(quantidadeNum));
      form.append("origem", origem);

      if (origem === "crm") {
        const selecionados = contatosCRM.slice(0, quantidadeNum);
        form.append("contatosJson", JSON.stringify(selecionados.map((c) => ({ nome: c.nome, telefone: c.telefone }))));
      } else {
        if (!arquivo) return;
        form.append("arquivo", arquivo);
        form.append("mapeamento", JSON.stringify(mapeamento));
      }

      setProgresso(30);
      const resp = await fetch("/api/automacoes/disparar", { method: "POST", body: form });
      setProgresso(90);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error);
      setProgresso(100);
      setResultado(json.data);
      setEtapa("resultado");
      toast.success("Campanha disparada com sucesso!");
    } catch (error) {
      toast.error(`Erro no disparo: ${error}`);
      setEtapa("simulacao");
    } finally {
      setCarregando(false);
    }
  };

  const reiniciar = () => {
    setEtapa("upload");
    setOrigem("planilha");
    setArquivo(null);
    setColunas([]);
    setPreview([]);
    setTotalLinhas(0);
    setMapeamento({});
    setContatosCRM([]);
    setNomeCampanha("");
    setQuantidade("");
    setMensagem("");
    setResultado(null);
    setProgresso(0);
  };

  const temTelefone = Object.values(mapeamento).some((v) => v === "telefone");
  const temNome = Object.values(mapeamento).some((v) => v === "nome");

  // ---- Resultado ----
  if (etapa === "resultado" && resultado) {
    return (
      <Tabs defaultValue="nova">
        <TabsList className="mb-6">
          <TabsTrigger value="nova"><Send className="w-4 h-4 mr-2" />Nova Campanha</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-4 h-4 mr-2" />Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="nova">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <CardTitle>Campanha Disparada!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{resultado.totalContatos}</p>
                  <p className="text-sm text-blue-600 mt-1">Total disparado</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-700">{resultado.enviados}</p>
                  <p className="text-sm text-emerald-600 mt-1">Enviados</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">{resultado.falhas}</p>
                  <p className="text-sm text-red-600 mt-1">Falhas</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-violet-700">{formatarMoeda(resultado.custoTotal)}</p>
                  <p className="text-sm text-violet-600 mt-1">Custo total</p>
                </div>
              </div>
              <Button onClick={reiniciar}>
                <RefreshCw className="w-4 h-4 mr-2" /> Nova Campanha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="historico"><Historico /></TabsContent>
      </Tabs>
    );
  }

  // ---- Disparando ----
  if (etapa === "disparando") {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Send className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900">Disparando mensagens...</p>
            <p className="text-sm text-muted-foreground mt-1">Enviando para {quantidadeNum} contatos via WhatsApp</p>
          </div>
          <Progress value={progresso} className="max-w-xs mx-auto" />
          <p className="text-sm text-muted-foreground">{progresso}%</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="nova">
      <TabsList className="mb-6">
        <TabsTrigger value="nova"><Send className="w-4 h-4 mr-2" />Nova Campanha</TabsTrigger>
        <TabsTrigger value="historico"><History className="w-4 h-4 mr-2" />Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="nova" className="space-y-4">

        {/* ---- UPLOAD / SELEÇÃO ---- */}
        {etapa === "upload" && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">1. Selecionar base de contatos</CardTitle>
              <CardDescription>Escolha de onde virão os contatos para esta campanha</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={origem} onValueChange={(v) => setOrigem(v as Origem)}>
                <TabsList className="mb-6 w-full sm:w-auto">
                  <TabsTrigger value="planilha" className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Importar Planilha
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="flex items-center gap-2">
                    <Database className="w-4 h-4" /> Base do CRM
                  </TabsTrigger>
                </TabsList>

                {/* Planilha */}
                <TabsContent value="planilha">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleArquivo(file);
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleArquivo(f); }}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        {carregando
                          ? <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                          : <Upload className="w-8 h-8 text-primary" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {carregando ? "Processando arquivo..." : "Arraste ou clique para fazer upload"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Suporta .xlsx e .csv</p>
                      </div>
                      {!carregando && <Button variant="outline">Selecionar arquivo</Button>}
                    </div>
                  </div>
                </TabsContent>

                {/* Base do CRM */}
                <TabsContent value="crm">
                  <SeletorCRM onConfirmar={handleConfirmarCRM} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* ---- MAPEAMENTO (apenas planilha) ---- */}
        {etapa === "mapeamento" && origem === "planilha" && (
          <>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  2. Mapeamento de Colunas
                </CardTitle>
                <CardDescription>
                  {arquivo?.name} — {totalLinhas} contatos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colunas.map((col) => (
                    <div key={col} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground bg-gray-50 px-3 py-2 rounded-lg border flex-1 truncate" title={col}>
                        {col}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={mapeamento[col] ?? ""}
                        onValueChange={(v) => setMapeamento((prev) => ({ ...prev, [col]: v ?? "" }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPOS_SISTEMA.map((c) => (
                            <SelectItem key={c.value || "ignorar"} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {(!temNome || !temTelefone) && (
                  <p className="flex items-center gap-1.5 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Mapeie as colunas &quot;Nome&quot; e &quot;Telefone&quot; para continuar
                  </p>
                )}
              </CardContent>
            </Card>

            {preview.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Preview (primeiras {preview.length} linhas)</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {colunas.map((c) => <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((linha, i) => (
                        <TableRow key={i}>
                          {colunas.map((c) => (
                            <TableCell key={c} className="text-xs max-w-[150px] truncate" title={linha[c]}>{linha[c]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={reiniciar}>Cancelar</Button>
              <Button onClick={() => { setQuantidade(String(totalLinhas)); setEtapa("simulacao"); }} disabled={!temNome || !temTelefone}>
                Próximo: Configurar Disparo
              </Button>
            </div>
          </>
        )}

        {/* ---- SIMULAÇÃO + MENSAGEM ---- */}
        {etapa === "simulacao" && (
          <>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {origem === "crm" ? "2." : "3."} Resumo da Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-700">{totalDisponivel}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {origem === "crm" ? "Contatos selecionados" : "Total importado"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-700">{totalDisponivel}</p>
                    <p className="text-sm text-emerald-600 mt-1">Com telefone</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-700">{formatarMoeda(custoUnitario)}</p>
                    <p className="text-sm text-gray-600 mt-1">Custo por mensagem</p>
                  </div>
                </div>

                {origem === "crm" && contatosCRM.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Usando <strong>{contatosCRM.length} contatos</strong> da base do CRM
                    </p>
                    <button
                      onClick={() => setEtapa("upload")}
                      className="ml-auto text-xs text-blue-600 underline hover:no-underline"
                    >
                      Alterar seleção
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  {origem === "crm" ? "3." : "4."} Simulação de Disparos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da campanha</Label>
                  <Input
                    placeholder="Ex: Campanha Abril 2026"
                    value={nomeCampanha}
                    onChange={(e) => setNomeCampanha(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Quantidade de disparos desejada (máx: {totalDisponivel})</Label>
                  <Input
                    type="number"
                    placeholder={`1 a ${totalDisponivel}`}
                    min={1}
                    max={totalDisponivel}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="max-w-xs"
                  />
                  {quantidade && !quantidadeValida && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Informe um número entre 1 e {totalDisponivel}
                    </p>
                  )}
                </div>
                {quantidadeValida && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-800">Custo estimado</p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        {quantidadeNum} mensagens × {formatarMoeda(custoUnitario)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-violet-700">{formatarMoeda(custoEstimado)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {origem === "crm" ? "4." : "5."} Mensagem / Template
                </CardTitle>
                <CardDescription>Texto que será enviado para todos os contatos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Olá! Temos uma novidade especial para você..."
                  rows={5}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{mensagem.length} caracteres</p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEtapa(origem === "crm" ? "upload" : "mapeamento")}>Voltar</Button>
              <Button
                onClick={handleDisparar}
                disabled={!nomeCampanha || !mensagem || !quantidadeValida}
              >
                <Send className="w-4 h-4 mr-2" />
                Disparar {quantidadeValida ? quantidadeNum : ""} mensagens
              </Button>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="historico">
        <Historico />
      </TabsContent>
    </Tabs>
  );
};
