"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Upload, SlidersHorizontal, MessageSquare, Mail,
  ChevronRight, ChevronLeft, CheckCircle2, Send, Clock,
  FileText, X, Check, AlertCircle, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContatoPreview = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  estado?: string | null;
  genero?: string | null;
  total_eventos?: number;
  ticket_medio?: number;
  total_gasto?: number;
};

type OrigemTipo = "crm" | "planilha" | "manual";
type Canal = "whatsapp" | "email";

type Filtros = {
  eventoGrupoId: string;
  eventoId: string;
  aniversarioMes: string;
  estado: string;
  genero: string;
  origem: string;
  totalEventosMin: string;
  totalEventosMax: string;
  ticketMin: string;
  ticketMax: string;
  totalGastoMin: string;
  totalGastoMax: string;
};

const FILTROS_VAZIOS: Filtros = {
  eventoGrupoId: "", eventoId: "", aniversarioMes: "", estado: "",
  genero: "", origem: "", totalEventosMin: "", totalEventosMax: "",
  ticketMin: "", ticketMax: "", totalGastoMin: "", totalGastoMax: "",
};

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },   { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },    { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },   { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },{ value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },{ value: "12", label: "Dezembro" },
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

// ─── Step indicator ───────────────────────────────────────────────────────────

const ETAPAS = [
  { num: 1, label: "Origem" },
  { num: 2, label: "Público" },
  { num: 3, label: "Canal" },
  { num: 4, label: "Conteúdo" },
  { num: 5, label: "Revisão" },
];

function StepBar({ etapa }: { etapa: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {ETAPAS.map((e, i) => {
        const done    = etapa > e.num;
        const current = etapa === e.num;
        return (
          <div key={e.num} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              done    && "bg-green-100 text-green-700",
              current && "bg-primary text-white shadow-sm",
              !done && !current && "bg-gray-100 text-gray-400"
            )}>
              {done
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <span className="w-4 h-4 flex items-center justify-center font-bold">{e.num}</span>
              }
              <span className="hidden sm:inline">{e.label}</span>
            </div>
            {i < ETAPAS.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  contatosParam: string;
  origemParam: string;
  origens: string[];
  eventos: { id: string; nome: string; data: Date }[];
  grupos: { id: string; nome: string }[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketingCliente({
  contatosParam,
  origemParam,
  origens,
  eventos,
  grupos,
}: Props) {
  const router = useRouter();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [etapa, setEtapa] = useState(1);
  const [origemTipo, setOrigemTipo] = useState<OrigemTipo | null>(null);

  // ── Audiência ─────────────────────────────────────────────────────────────
  const [contatosPreSel, setContatosPreSel] = useState<ContatoPreview[]>([]);
  const [audiencia, setAudiencia] = useState<ContatoPreview[]>([]);
  const [totalAudiencia, setTotalAudiencia] = useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregandoAudiencia, setCarregandoAudiencia] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // quantidade digitada pelo usuário no modo CRM (sem pré-seleção)
  const [quantidadeEnvio, setQuantidadeEnvio] = useState<string>("");

  // ── Planilha ──────────────────────────────────────────────────────────────
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colunasPlanilha, setColunasPlanilha] = useState<string[]>([]);
  const [mapaColuna, setMapaColuna] = useState<{ nome: string; telefone: string }>({ nome: "", telefone: "" });
  const [previewPlanilha, setPreviewPlanilha] = useState<{ total: number; comTelefone: number } | null>(null);
  const [processandoPlanilha, setProcessandoPlanilha] = useState(false);

  // ── Canal e conteúdo ──────────────────────────────────────────────────────
  const [canal, setCanal] = useState<Canal | null>(null);
  const [nomeCampanha, setNomeCampanha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [linkCta, setLinkCta] = useState("");
  const [textoCta, setTextoCta] = useState("");

  // ── Dispatch ──────────────────────────────────────────────────────────────
  const [enviando, setEnviando] = useState(false);

  // ── Init: se vieram contatos da URL ──────────────────────────────────────
  useEffect(() => {
    if (!contatosParam) return;
    const ids = contatosParam.split(",").filter(Boolean);
    if (ids.length === 0) return;

    fetch(`/api/automacoes/contatos?ids=${contatosParam}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const contatos: ContatoPreview[] = json.data;
          setContatosPreSel(contatos);
          setSelecionados(new Set(contatos.map((c) => c.id)));
          setOrigemTipo("crm");
        }
      })
      .catch(() => {});
  }, [contatosParam]);

  // ── Busca de audiência com filtros ────────────────────────────────────────
  const buscarAudiencia = useCallback(async (f: Filtros, limit?: number) => {
    setCarregandoAudiencia(true);
    try {
      const p = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
      if (limit && limit > 0) p.set("limit", String(limit));

      const res = await fetch(`/api/marketing/audiencia?${p.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAudiencia(json.data.contatos);
        setTotalAudiencia(json.data.total);
        setSelecionados(new Set(json.data.contatos.map((c: ContatoPreview) => c.id)));
      }
    } catch {
      toast.error("Erro ao buscar audiência");
    } finally {
      setCarregandoAudiencia(false);
    }
  }, []);

  // Quando entra na etapa 2 com origem "crm" sem pré-seleção, carrega total da base (preview 200)
  useEffect(() => {
    if (etapa !== 2 || origemTipo !== "crm") return;
    if (contatosPreSel.length > 0) return;
    buscarAudiencia(FILTROS_VAZIOS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, origemTipo]);

  // Quando o usuário digita uma quantidade, busca os primeiros N contatos
  const quantidadeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (origemTipo !== "crm" || contatosPreSel.length > 0) return;
    const n = parseInt(quantidadeEnvio, 10);
    if (!quantidadeEnvio || isNaN(n) || n <= 0) return;
    if (quantidadeDebounceRef.current) clearTimeout(quantidadeDebounceRef.current);
    quantidadeDebounceRef.current = setTimeout(() => {
      buscarAudiencia(FILTROS_VAZIOS, n);
    }, 600);
    return () => { if (quantidadeDebounceRef.current) clearTimeout(quantidadeDebounceRef.current); };
  }, [quantidadeEnvio, origemTipo, contatosPreSel.length, buscarAudiencia]);

  useEffect(() => {
    if (etapa !== 2 || origemTipo !== "manual") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarAudiencia(filtros), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtros, etapa, origemTipo, buscarAudiencia]);

  // ── Upload de planilha ────────────────────────────────────────────────────
  const handleArquivo = async (file: File) => {
    setArquivo(file);
    setProcessandoPlanilha(true);
    setColunasPlanilha([]);
    setMapaColuna({ nome: "", telefone: "" });
    setPreviewPlanilha(null);

    const fd = new FormData();
    fd.append("arquivo", file);

    try {
      const res = await fetch("/api/marketing/planilha-preview", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setColunasPlanilha(json.data.colunas);

      // Auto-detect colunas comuns
      const colunas: string[] = json.data.colunas;
      const detectarNome = colunas.find((c) =>
        ["nome", "nome_cliente", "name", "cliente"].includes(c.toLowerCase())
      ) ?? "";
      const detectarTel = colunas.find((c) =>
        ["telefone", "phone", "celular", "tel", "whatsapp"].includes(c.toLowerCase())
      ) ?? "";
      setMapaColuna({ nome: detectarNome, telefone: detectarTel });
      setPreviewPlanilha({ total: json.data.total, comTelefone: json.data.total });
    } catch {
      toast.error("Erro ao processar planilha");
    } finally {
      setProcessandoPlanilha(false);
    }
  };

  // ── Audiência final (o que será disparado) ────────────────────────────────
  // "crm" pode vir com pré-seleção da URL ou carregar toda a base
  const fontecrm = contatosPreSel.length > 0 ? contatosPreSel : audiencia;
  const audienciaFinal: ContatoPreview[] =
    origemTipo === "crm"
      ? fontecrm.filter((c) => selecionados.has(c.id))
      : origemTipo === "manual"
      ? audiencia.filter((c) => selecionados.has(c.id))
      : [];

  const totalFinal =
    origemTipo === "planilha"
      ? (previewPlanilha?.total ?? 0)
      : audienciaFinal.length;

  // ── Dispatch ──────────────────────────────────────────────────────────────
  const enviarCampanha = async () => {
    if (canal === "email") {
      toast.info("Integração com e-mail não configurada nesta versão. Configure credenciais de SMTP ou SendGrid no painel para habilitar.");
      return;
    }

    if (!nomeCampanha.trim()) { toast.error("Informe o nome da campanha"); return; }
    if (!mensagem.trim())     { toast.error("Escreva a mensagem"); return; }
    if (totalFinal === 0)     { toast.error("Nenhum contato selecionado"); return; }

    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("nomeCampanha", nomeCampanha);
      fd.append("mensagem", mensagem);
      fd.append("quantidade", String(totalFinal));

      if (origemTipo === "planilha" && arquivo) {
        fd.append("origem", "planilha");
        fd.append("arquivo", arquivo);
        fd.append("mapeamento", JSON.stringify({
          [mapaColuna.nome]: "nome",
          [mapaColuna.telefone]: "telefone",
        }));
      } else {
        fd.append("origem", "crm");
        fd.append("contatosJson", JSON.stringify(
          audienciaFinal.map((c) => ({ nome: c.nome, telefone: c.telefone }))
        ));
      }

      const res  = await fetch("/api/automacoes/disparar", { method: "POST", body: fd });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      const { enviados, falhas, custoTotal } = json.data;
      toast.success(
        `Campanha "${nomeCampanha}" disparada! ${enviados} enviados, ${falhas} falhas. Custo: R$ ${custoTotal.toFixed(2)}`
      );
      router.push("/automacoes");
    } catch (err) {
      toast.error(`Erro ao disparar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setEnviando(false);
    }
  };

  const salvarRascunho = () => {
    const rascunho = {
      nomeCampanha, mensagem, assunto, corpo, linkCta, textoCta,
      canal, origemTipo, totalFinal,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("marketing_rascunho", JSON.stringify(rascunho));
    toast.success("Rascunho salvo localmente");
  };

  // ── Validação por etapa ───────────────────────────────────────────────────
  const podeAvancar = (): boolean => {
    if (etapa === 1) return origemTipo !== null;
    if (etapa === 2) {
      if (origemTipo === "planilha") return !!(arquivo && mapaColuna.nome && mapaColuna.telefone);
      return totalFinal > 0;
    }
    if (etapa === 3) return canal !== null;
    if (etapa === 4) {
      if (!nomeCampanha.trim()) return false;
      if (canal === "whatsapp") return mensagem.trim().length > 0;
      if (canal === "email")    return assunto.trim().length > 0 && corpo.trim().length > 0;
    }
    return true;
  };

  const setF = (key: keyof Filtros, val: string) =>
    setFiltros((prev) => ({ ...prev, [key]: val }));

  const toggleSelecionado = (id: string) =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ─────────────────────────────────────────────────────────────────────────
  // ETAPA 1 — Origem
  // ─────────────────────────────────────────────────────────────────────────
  const renderEtapa1 = () => {
    const origemLabel =
      origemParam === "clientes" ? "aba Clientes"
      : origemParam === "eventos" ? "aba Eventos"
      : "";

    return (
      <div className="space-y-4">
        {/* Banner de contatos pré-selecionados */}
        {contatosPreSel.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {contatosPreSel.length} cliente{contatosPreSel.length !== 1 ? "s" : ""} recebido{contatosPreSel.length !== 1 ? "s" : ""}{origemLabel ? ` da ${origemLabel}` : ""}
              </p>
              <p className="text-xs text-blue-700">Base pré-selecionada. Você pode continuar ou trocar a origem.</p>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground font-medium">Como você quer montar a base de envio?</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* CRM */}
          <button
            onClick={() => setOrigemTipo("crm")}
            className={cn(
              "flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
              origemTipo === "crm"
                ? "border-primary bg-primary/5"
                : "border-border bg-white"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              origemTipo === "crm" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            )}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Base do CRM</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contatosPreSel.length > 0
                  ? `${contatosPreSel.length} clientes pré-selecionados`
                  : "Use os clientes já cadastrados"
                }
              </p>
            </div>
            {origemTipo === "crm" && (
              <CheckCircle2 className="w-4 h-4 text-primary self-end" />
            )}
          </button>

          {/* Planilha */}
          <button
            onClick={() => setOrigemTipo("planilha")}
            className={cn(
              "flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
              origemTipo === "planilha"
                ? "border-primary bg-primary/5"
                : "border-border bg-white"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              origemTipo === "planilha" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            )}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Importar planilha</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envie um CSV ou XLSX com nome e telefone
              </p>
            </div>
            {origemTipo === "planilha" && (
              <CheckCircle2 className="w-4 h-4 text-primary self-end" />
            )}
          </button>

          {/* Manual */}
          <button
            onClick={() => { setOrigemTipo("manual"); buscarAudiencia(filtros); }}
            className={cn(
              "flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
              origemTipo === "manual"
                ? "border-primary bg-primary/5"
                : "border-border bg-white"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              origemTipo === "manual" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            )}>
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Seleção manual</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monte a base com filtros dentro desta página
              </p>
            </div>
            {origemTipo === "manual" && (
              <CheckCircle2 className="w-4 h-4 text-primary self-end" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ETAPA 2 — Público
  // ─────────────────────────────────────────────────────────────────────────
  const renderEtapa2 = () => {
    // ── Origem: CRM (pré-selecionados ou base completa) ───────────────────
    if (origemTipo === "crm") {
      const lista = contatosPreSel.length > 0 ? contatosPreSel : audiencia;
      const totalLabel = contatosPreSel.length > 0
        ? `${lista.length} clientes recebidos da aba Clientes`
        : totalAudiencia > 0
          ? `${totalAudiencia.toLocaleString("pt-BR")} clientes na base do CRM${totalAudiencia > 200 ? " (exibindo 200)" : ""}`
          : "Carregando base do CRM…";

      return (
        <div className="space-y-4">
          {carregandoAudiencia ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando base do CRM…
            </div>
          ) : (
            <>
              {/* Contador da base + input de quantidade */}
              <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-gray-800">
                    {totalAudiencia > 0
                      ? <>{totalAudiencia.toLocaleString("pt-BR")} contatos na base do CRM</>
                      : "Carregando base…"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-600">
                      Para quantos contatos deseja enviar?
                      <span className="text-muted-foreground ml-1">(os primeiros da lista, de cima para baixo)</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={totalAudiencia}
                      placeholder={`Máx. ${totalAudiencia.toLocaleString("pt-BR")}`}
                      value={quantidadeEnvio}
                      onChange={(e) => setQuantidadeEnvio(e.target.value)}
                      className="max-w-xs bg-white"
                    />
                  </div>
                  {carregandoAudiencia && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-5" />
                  )}
                </div>
                {selecionados.size > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {selecionados.size.toLocaleString("pt-BR")} contatos selecionados para envio
                  </p>
                )}
              </div>

              {/* Preview da lista */}
              {lista.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      PRÉVIA {lista.length < (parseInt(quantidadeEnvio) || totalAudiencia) ? `(${lista.length} exibidos)` : ""}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{selecionados.size} selecionados</span>
                  </div>
                  <div className="divide-y max-h-72 overflow-y-auto">
                    {lista.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                          selecionados.has(c.id) && "bg-primary/5"
                        )}
                        onClick={() => toggleSelecionado(c.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          selecionados.has(c.id)
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        )}>
                          {selecionados.has(c.id) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.telefone ?? c.email ?? "—"}
                            {c.estado ? ` · ${c.estado}` : ""}
                          </p>
                        </div>
                        {!c.telefone && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Sem telefone
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selecionados.size === 0 && !carregandoAudiencia && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Informe a quantidade ou aguarde o carregamento da base
                </p>
              )}
            </>
          )}
        </div>
      );
    }

    // ── Origem: Planilha ──────────────────────────────────────────────────
    if (origemTipo === "planilha") {
      return (
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              arquivo ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleArquivo(f);
            }}
          >
            {processandoPlanilha ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Processando planilha…</p>
              </div>
            ) : arquivo ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-primary" />
                <p className="text-sm font-medium text-gray-900">{arquivo.name}</p>
                <Button
                  variant="outline" size="sm"
                  onClick={() => { setArquivo(null); setColunasPlanilha([]); setPreviewPlanilha(null); }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Arraste aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">CSV ou XLSX com colunas nome + telefone</p>
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary underline">Escolher arquivo</span>
                  <input
                    type="file" className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleArquivo(f); }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Mapeamento de colunas */}
          {colunasPlanilha.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Mapeamento de colunas</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Coluna do nome *</Label>
                  <Select
                    value={mapaColuna.nome}
                    onValueChange={(v) => setMapaColuna((p) => ({ ...p, nome: v ?? "" }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {colunasPlanilha.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Coluna do telefone *</Label>
                  <Select
                    value={mapaColuna.telefone}
                    onValueChange={(v) => setMapaColuna((p) => ({ ...p, telefone: v ?? "" }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {colunasPlanilha.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {previewPlanilha && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span><strong>{previewPlanilha.total}</strong> contatos encontrados na planilha</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // ── Origem: Manual (filtros) ───────────────────────────────────────────
    return (
      <div className="space-y-4">
        {/* Filtros */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-4 border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Grupo de evento */}
            <div className="space-y-1.5">
              <Label className="text-xs">Evento (grupo)</Label>
              <Select
                value={filtros.eventoGrupoId || "todos"}
                onValueChange={(v) => setF("eventoGrupoId", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Todos os grupos">
                    {(v: string) => (!v || v === "todos") ? "Todos os grupos" : (grupos.find(g => g.id === v)?.nome ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Edição específica */}
            <div className="space-y-1.5">
              <Label className="text-xs">Edição específica</Label>
              <Select
                value={filtros.eventoId || "todos"}
                onValueChange={(v) => setF("eventoId", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Todas as edições">
                    {(v: string) => (!v || v === "todos") ? "Todas as edições" : (eventos.find(e => e.id === v)?.nome ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as edições</SelectItem>
                  {eventos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mês de aniversário */}
            <div className="space-y-1.5">
              <Label className="text-xs">Aniversário no mês</Label>
              <Select
                value={filtros.aniversarioMes || "todos"}
                onValueChange={(v) => setF("aniversarioMes", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Qualquer mês">
                    {(v: string) => (!v || v === "todos") ? "Qualquer mês" : (MESES.find(m => m.value === v)?.label ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Qualquer mês</SelectItem>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select
                value={filtros.estado || "todos"}
                onValueChange={(v) => setF("estado", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Todos os estados">
                    {(v: string) => (!v || v === "todos") ? "Todos os estados" : v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {ESTADOS_BR.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gênero */}
            <div className="space-y-1.5">
              <Label className="text-xs">Gênero</Label>
              <Select
                value={filtros.genero || "todos"}
                onValueChange={(v) => setF("genero", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Todos">
                    {(v: string) => (!v || v === "todos") ? "Todos" : v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Origem */}
            <div className="space-y-1.5">
              <Label className="text-xs">Origem</Label>
              <Select
                value={filtros.origem || "todos"}
                onValueChange={(v) => setF("origem", v === "todos" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Todas">
                    {(v: string) => (!v || v === "todos") ? "Todas" : v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {origens.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total gasto min/max */}
            <div className="space-y-1.5">
              <Label className="text-xs">Total gasto (R$)</Label>
              <div className="flex gap-1.5">
                <Input
                  className="h-9 bg-white" placeholder="Mín"
                  value={filtros.totalGastoMin}
                  onChange={(e) => setF("totalGastoMin", e.target.value)}
                />
                <Input
                  className="h-9 bg-white" placeholder="Máx"
                  value={filtros.totalGastoMax}
                  onChange={(e) => setF("totalGastoMax", e.target.value)}
                />
              </div>
            </div>

            {/* Ticket médio */}
            <div className="space-y-1.5">
              <Label className="text-xs">Ticket médio (R$)</Label>
              <div className="flex gap-1.5">
                <Input
                  className="h-9 bg-white" placeholder="Mín"
                  value={filtros.ticketMin}
                  onChange={(e) => setF("ticketMin", e.target.value)}
                />
                <Input
                  className="h-9 bg-white" placeholder="Máx"
                  value={filtros.ticketMax}
                  onChange={(e) => setF("ticketMax", e.target.value)}
                />
              </div>
            </div>

            {/* Total de eventos */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Qtd de eventos
                <span className="ml-1 text-muted-foreground font-normal">(1 – {eventos.length})</span>
              </Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  min={1}
                  max={eventos.length}
                  className="h-9 bg-white" placeholder="Mín (1)"
                  value={filtros.totalEventosMin}
                  onChange={(e) => setF("totalEventosMin", e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  max={eventos.length}
                  className="h-9 bg-white" placeholder={`Máx (${eventos.length})`}
                  value={filtros.totalEventosMax}
                  onChange={(e) => setF("totalEventosMax", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        {carregandoAudiencia ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando clientes…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {totalAudiencia > 0
                  ? <>{totalAudiencia} cliente{totalAudiencia !== 1 ? "s" : ""} encontrado{totalAudiencia !== 1 ? "s" : ""}</>
                  : "Nenhum cliente com esses filtros"
                }
                {totalAudiencia > 200 && (
                  <span className="text-muted-foreground font-normal"> (exibindo 200)</span>
                )}
              </p>
              {audiencia.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelecionados(new Set(audiencia.map((c) => c.id)))}>
                    Selecionar todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelecionados(new Set())}>
                    Desmarcar todos
                  </Button>
                </div>
              )}
            </div>

            {audiencia.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>CONTATO</span>
                  <span>{selecionados.size} selecionados</span>
                </div>
                <div className="divide-y max-h-72 overflow-y-auto">
                  {audiencia.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                        selecionados.has(c.id) && "bg-primary/5"
                      )}
                      onClick={() => toggleSelecionado(c.id)}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        selecionados.has(c.id) ? "border-primary bg-primary" : "border-gray-300"
                      )}>
                        {selecionados.has(c.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.telefone ?? c.email ?? "—"}
                          {c.estado ? ` · ${c.estado}` : ""}
                          {c.total_eventos ? ` · ${c.total_eventos} evento${c.total_eventos !== 1 ? "s" : ""}` : ""}
                        </p>
                      </div>
                      {!c.telefone && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          Sem telefone
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ETAPA 3 — Canal
  // ─────────────────────────────────────────────────────────────────────────
  const renderEtapa3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-medium">Escolha o canal de envio</p>
      <div className="grid gap-3 sm:grid-cols-2 max-w-lg">
        {/* WhatsApp */}
        <button
          onClick={() => setCanal("whatsapp")}
          className={cn(
            "flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all hover:border-green-400",
            canal === "whatsapp"
              ? "border-green-500 bg-green-50"
              : "border-border bg-white"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
            canal === "whatsapp" ? "bg-green-500 text-white" : "bg-gray-100"
          )}>
            💬
          </div>
          <div>
            <p className="font-semibold text-gray-900">WhatsApp</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disparo real via API · R$ 0,35/msg
            </p>
          </div>
          {canal === "whatsapp" && (
            <CheckCircle2 className="w-4 h-4 text-green-600 self-end" />
          )}
        </button>

        {/* Email */}
        <button
          onClick={() => setCanal("email")}
          className={cn(
            "flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all hover:border-blue-400",
            canal === "email"
              ? "border-blue-500 bg-blue-50"
              : "border-border bg-white"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            canal === "email" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
          )}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">E-mail</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Requer configuração de SMTP/SendGrid
            </p>
          </div>
          {canal === "email" && (
            <CheckCircle2 className="w-4 h-4 text-blue-600 self-end" />
          )}
        </button>
      </div>

      {canal === "email" && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 max-w-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            Integração com e-mail ainda não configurada. O rascunho poderá ser salvo, mas o envio real exigirá configuração de credenciais SMTP ou SendGrid no painel.
          </p>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ETAPA 4 — Conteúdo
  // ─────────────────────────────────────────────────────────────────────────
  const renderEtapa4 = () => (
    <div className="space-y-4">
      {/* Nome da campanha */}
      <div className="space-y-1.5">
        <Label>Nome da campanha *</Label>
        <Input
          placeholder="Ex: Pré-venda Oboé Dezembro 2025"
          value={nomeCampanha}
          onChange={(e) => setNomeCampanha(e.target.value)}
        />
      </div>

      {canal === "whatsapp" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Editor */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mensagem *</Label>
              <Textarea
                rows={8}
                placeholder={"Olá {nome}! 🎉\n\nTemos uma novidade especial para você..."}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{mensagem.length} caracteres · Use {"{nome}"} para personalizar</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Link (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={linkCta}
                  onChange={(e) => setLinkCta(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texto do botão</Label>
                <Input
                  placeholder="Comprar agora"
                  value={textoCta}
                  onChange={(e) => setTextoCta(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
            <div className="bg-[#ece5dd] rounded-xl p-4 min-h-48 flex flex-col gap-2">
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                  {mensagem.replace(/\{nome\}/g, "João") || (
                    <span className="text-gray-400 italic">Sua mensagem aparecerá aqui…</span>
                  )}
                </p>
                {linkCta && (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs text-primary font-medium truncate">
                      🔗 {textoCta || "Ver mais"} — {linkCta}
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1 text-right">12:00 ✓✓</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {canal === "email" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Assunto *</Label>
            <Input
              placeholder="Ex: Pré-venda exclusiva para você 🎉"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Corpo do e-mail *</Label>
            <Textarea
              rows={10}
              placeholder={"Olá {nome},\n\nTemos uma novidade especial..."}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              className="resize-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Link do botão (opcional)</Label>
              <Input
                placeholder="https://..."
                value={linkCta}
                onChange={(e) => setLinkCta(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Texto do botão</Label>
              <Input
                placeholder="Comprar agora"
                value={textoCta}
                onChange={(e) => setTextoCta(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ETAPA 5 — Revisão e Disparo
  // ─────────────────────────────────────────────────────────────────────────
  const renderEtapa5 = () => {
    const canalLabel  = canal === "whatsapp" ? "WhatsApp" : "E-mail";
    const origemLabel =
      origemTipo === "crm" ? "Aba Clientes"
      : origemTipo === "planilha" ? `Planilha: ${arquivo?.name}`
      : "Seleção manual com filtros";
    const custoEstimado = canal === "whatsapp" ? (totalFinal * 0.35).toFixed(2) : "—";

    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">Confirme os detalhes antes de enviar.</p>

        {/* Resumo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo da campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{nomeCampanha || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Canal</span>
                <span className="font-medium">{canalLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Audiência</span>
                <span className="font-medium">
                  {totalFinal} contato{totalFinal !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Origem</span>
                <span className="font-medium text-right max-w-xs truncate">{origemLabel}</span>
              </div>
              {canal === "whatsapp" && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Custo estimado</span>
                  <span className="font-medium">R$ {custoEstimado}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview da mensagem */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            {canal === "whatsapp" && (
              <div className="bg-[#ece5dd] rounded-xl p-4">
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {mensagem.replace(/\{nome\}/g, "João")}
                  </p>
                  {linkCta && (
                    <p className="text-xs text-primary font-medium mt-2 truncate">
                      🔗 {textoCta || "Ver mais"} — {linkCta}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 text-right">12:00 ✓✓</p>
                </div>
              </div>
            )}
            {canal === "email" && (
              <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                <p className="text-xs text-muted-foreground">Assunto: <strong className="text-gray-800">{assunto}</strong></p>
                <Separator />
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {corpo.replace(/\{nome\}/g, "João")}
                </p>
                {linkCta && (
                  <div className="mt-3">
                    <span className="bg-primary text-white text-xs px-4 py-2 rounded-lg">
                      {textoCta || "Ver mais"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notice e-mail */}
        {canal === "email" && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Envio de e-mail requer configuração de SMTP/SendGrid. O rascunho será salvo mas o envio real não está disponível nesta versão.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="outline"
            onClick={salvarRascunho}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Salvar rascunho
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-muted-foreground"
            onClick={() => toast.info("Agendamento de disparo não disponível nesta versão.")}
          >
            <Clock className="w-4 h-4" />
            Agendar disparo
          </Button>
          <Button
            onClick={enviarCampanha}
            disabled={enviando}
            className={cn(
              "gap-2 min-w-32",
              canal === "email" && "opacity-60"
            )}
          >
            {enviando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            {enviando ? "Disparando…" : "Enviar agora"}
          </Button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <StepBar etapa={etapa} />

      <Card>
        <CardContent className="p-6">
          {etapa === 1 && renderEtapa1()}
          {etapa === 2 && renderEtapa2()}
          {etapa === 3 && renderEtapa3()}
          {etapa === 4 && renderEtapa4()}
          {etapa === 5 && renderEtapa5()}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => etapa === 1 ? router.back() : setEtapa((e) => e - 1)}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {etapa === 1 ? "Voltar" : "Anterior"}
        </Button>

        {etapa < 5 && (
          <Button
            onClick={() => setEtapa((e) => e + 1)}
            disabled={!podeAvancar()}
            className="gap-2"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
