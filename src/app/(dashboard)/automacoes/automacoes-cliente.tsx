"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Cake, Newspaper, RefreshCw, CalendarCheck,
  Play, Pause, Save, ArrowLeft, Zap, Users,
  MessageSquare, Settings, ChevronRight, Clock,
  CheckCircle2, Circle, AlertCircle, Smartphone, Mail,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Canal = "whatsapp" | "email";
type Status = "ativa" | "pausada" | "rascunho";

type AutomacaoModelo = {
  id: string;
  nome: string;
  descricao: string;
  Icone: React.ElementType;
  cor: "rose" | "blue" | "amber" | "emerald";
  gatilho: string;
  condicao: string;
  ofertaPadrao: string;
  canais: Canal[];
  eventoVinculado: boolean;
  audiencia: {
    totalMock: number;
    descricao: string;
    exemplos: string[];
    porqueElegiveis: string;
  };
  mensagemWhatsappPadrao: string;
  mensagemEmailAssuntoPadrao?: string;
  mensagemEmailCorpoPadrao?: string;
};

type AutomacaoInstancia = {
  status: Status;
  oferta: string;
  eventoVinculadoNome: string;
  mensagemWhatsapp: string;
  mensagemEmailAssunto: string;
  mensagemEmailCorpo: string;
};

// ─── Dados mockados das automações ───────────────────────────────────────────

const MODELOS: AutomacaoModelo[] = [
  {
    id: "aniversariante-mes",
    nome: "Aniversariante do Mês",
    descricao: "Envia uma mensagem especial para clientes que fazem aniversário no mês corrente.",
    Icone: Cake,
    cor: "rose",
    gatilho: "Data de aniversário do cliente",
    condicao: "Aniversário no mês corrente",
    ofertaPadrao: "Desconto ou mensagem personalizada de aniversário",
    canais: ["whatsapp"],
    eventoVinculado: false,
    audiencia: {
      totalMock: 14,
      descricao: "Clientes com aniversário neste mês",
      exemplos: ["Ana Lima", "Carlos Mendes", "Beatriz Souza", "João Ferreira"],
      porqueElegiveis: "Possuem data de nascimento cadastrada com mês igual ao mês atual",
    },
    mensagemWhatsappPadrao:
      "🎂 Olá, {nome}!\n\nA equipe quer te desejar um Feliz Aniversário! 🎉\n\nComo presente especial, temos uma condição exclusiva esperando por você no próximo evento.\n\nAproveite e entre em contato com a gente!",
  },
  {
    id: "newsletter-mensal",
    nome: "Newsletter Mensal",
    descricao: "Envia um resumo de novidades e próximos eventos para toda a base ativa.",
    Icone: Newspaper,
    cor: "blue",
    gatilho: "Dia 1 de cada mês",
    condicao: "Participou de pelo menos 1 evento nos últimos 12 meses",
    ofertaPadrao: "Novidades e programação de eventos do mês",
    canais: ["whatsapp", "email"],
    eventoVinculado: false,
    audiencia: {
      totalMock: 312,
      descricao: "Base ativa — participou de evento nos últimos 12 meses",
      exemplos: ["Mariana Costa", "Pedro Alves", "Fernanda Rocha", "Lucas Nunes"],
      porqueElegiveis: "Participaram de pelo menos um evento nos últimos 12 meses",
    },
    mensagemWhatsappPadrao:
      "Olá, {nome}! 👋\n\nA programação do mês chegou!\n\nConfira os próximos eventos e garanta sua vaga com condições especiais para quem já é da família.\n\nAcesse: [link do evento]",
    mensagemEmailAssuntoPadrao: "🗓️ Programação do mês — confira o que vem por aí",
    mensagemEmailCorpoPadrao:
      "Olá, {nome}!\n\nO mês começou e com ele vem uma programação incrível.\n\nConfira abaixo os próximos eventos e garanta sua vaga com condições exclusivas para você.\n\n[Inserir programação aqui]\n\nAté breve!\nEquipe",
  },
  {
    id: "reativacao-inativos",
    nome: "Reativação de Inativos",
    descricao: "Alcança clientes que não participam de eventos há mais de 6 meses.",
    Icone: RefreshCw,
    cor: "amber",
    gatilho: "6 meses sem participação em evento",
    condicao: "Última participação há mais de 180 dias",
    ofertaPadrao: "Condição especial de retorno — oferta exclusiva",
    canais: ["whatsapp"],
    eventoVinculado: false,
    audiencia: {
      totalMock: 87,
      descricao: "Clientes inativos há mais de 6 meses",
      exemplos: ["Roberto Dias", "Camila Teixeira", "André Gomes", "Patrícia Lemos"],
      porqueElegiveis: "Não participaram de nenhum evento nos últimos 6 meses",
    },
    mensagemWhatsappPadrao:
      "Olá, {nome}! Sentimos sua falta! 💙\n\nFaz um tempo que não nos vemos por aqui.\n\nTemos eventos incríveis chegando e queremos que você seja um dos primeiros a saber.\n\nQuer conferir? É só responder aqui!",
  },
  {
    id: "pre-evento",
    nome: "Pré-Evento (Frequentadores)",
    descricao: "Lembra frequentadores anteriores sobre o próximo evento vinculado.",
    Icone: CalendarCheck,
    cor: "emerald",
    gatilho: "30 dias antes da data do evento vinculado",
    condicao: "Participou de pelo menos 1 edição anterior deste evento",
    ofertaPadrao: "Acesso antecipado ou desconto de frequentador",
    canais: ["whatsapp"],
    eventoVinculado: true,
    audiencia: {
      totalMock: 43,
      descricao: "Frequentadores de edições anteriores do evento vinculado",
      exemplos: ["Isabela Martins", "Rafael Carvalho", "Tatiane Oliveira", "Diego Pinto"],
      porqueElegiveis: "Participaram de pelo menos uma edição anterior do evento vinculado",
    },
    mensagemWhatsappPadrao:
      "Olá, {nome}! 🎊\n\nVocê estava com a gente na última edição e isso significa muito pra gente!\n\nO próximo evento está chegando e você tem acesso antecipado — como frequentador especial.\n\nGarante logo o seu lugar!",
  },
];

const COR: Record<AutomacaoModelo["cor"], { bg: string; icon: string; badge: string }> = {
  rose:    { bg: "bg-rose-50",    icon: "text-rose-600",    badge: "bg-rose-100 text-rose-700" },
  blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
};

const STATUS_CONFIG: Record<Status, { label: string; classe: string; Icone: React.ElementType }> = {
  ativa:    { label: "Ativa",    classe: "bg-emerald-100 text-emerald-700", Icone: CheckCircle2 },
  pausada:  { label: "Pausada",  classe: "bg-amber-100 text-amber-700",    Icone: Circle },
  rascunho: { label: "Rascunho", classe: "bg-gray-100 text-gray-600",      Icone: AlertCircle },
};

function estadoInicial(modelo: AutomacaoModelo): AutomacaoInstancia {
  return {
    status: "rascunho",
    oferta: modelo.ofertaPadrao,
    eventoVinculadoNome: "",
    mensagemWhatsapp: modelo.mensagemWhatsappPadrao,
    mensagemEmailAssunto: modelo.mensagemEmailAssuntoPadrao ?? "",
    mensagemEmailCorpo: modelo.mensagemEmailCorpoPadrao ?? "",
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const AutomacoesCliente = ({
  contatosPreSelecionados = "",
}: {
  contatosPreSelecionados?: string;
}) => {
  const totalPreSelecionados = contatosPreSelecionados
    ? contatosPreSelecionados.split(",").filter(Boolean).length
    : 0;

  // Estado por automação (status + config editável)
  const [instancias, setInstancias] = useState<Record<string, AutomacaoInstancia>>(
    () => Object.fromEntries(MODELOS.map((m) => [m.id, estadoInicial(m)]))
  );

  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const modelo = MODELOS.find((m) => m.id === selecionadaId) ?? null;
  const instancia = selecionadaId ? instancias[selecionadaId] : null;

  const atualizar = (id: string, patch: Partial<AutomacaoInstancia>) =>
    setInstancias((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const alterarStatus = (id: string, novoStatus: Status) => {
    atualizar(id, { status: novoStatus });
    const nomes: Record<Status, string> = {
      ativa: "Automação ativada com sucesso",
      pausada: "Automação pausada",
      rascunho: "Salvo como rascunho",
    };
    toast.success(nomes[novoStatus]);
  };

  // ── Lista de automações ───────────────────────────────────────────────────

  if (!selecionadaId) {
    return (
      <div className="space-y-6">
        {/* Banner de pré-seleção vinda da aba Clientes */}
        {totalPreSelecionados > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {totalPreSelecionados} cliente{totalPreSelecionados !== 1 ? "s" : ""} selecionado{totalPreSelecionados !== 1 ? "s" : ""} da aba Clientes
              </p>
              <p className="text-xs text-muted-foreground">
                Escolha uma automação abaixo para aplicar a esta base.
              </p>
            </div>
          </div>
        )}

        {/* Aviso de protótipo */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
          <p>
            <strong>Visualização de produto.</strong> As automações abaixo representam regras contínuas que serão ativadas automaticamente quando os critérios forem atendidos. A execução real será implementada em etapa futura.
          </p>
        </div>

        {/* Cards das automações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODELOS.map((m) => {
            const inst = instancias[m.id];
            const cor = COR[m.cor];
            const st = STATUS_CONFIG[inst.status];
            const StIcon = st.Icone;
            return (
              <Card
                key={m.id}
                className="shadow-sm hover:shadow-md transition-shadow border cursor-pointer group"
                onClick={() => setSelecionadaId(m.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", cor.bg)}>
                      <m.Icone className={cn("w-5 h-5", cor.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 leading-tight">{m.nome}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0", st.classe)}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {m.descricao}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {m.canais.map((canal) => (
                            <span key={canal} className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                              {canal === "whatsapp"
                                ? <Smartphone className="w-3 h-3" />
                                : <Mail className="w-3 h-3" />}
                              {canal === "whatsapp" ? "WhatsApp" : "E-mail"}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-primary font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Configurar <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gatilho */}
                  <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Gatilho: {m.gatilho}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Detalhe / Configuração ────────────────────────────────────────────────

  if (!modelo || !instancia) return null;
  const cor = COR[modelo.cor];
  const st = STATUS_CONFIG[instancia.status];
  const StIcon = st.Icone;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button
        variant="ghost"
        className="-ml-2 gap-2"
        onClick={() => setSelecionadaId(null)}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Automações
      </Button>

      {/* Header da automação */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", cor.bg)}>
            <modelo.Icone className={cn("w-6 h-6", cor.icon)} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{modelo.nome}</h2>
            <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
          </div>
        </div>
        <span className={cn("text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1.5 flex-shrink-0", st.classe)}>
          <StIcon className="w-3.5 h-3.5" />
          {st.label}
        </span>
      </div>

      {/* Conteúdo em tabs */}
      <Tabs defaultValue="configuracao">
        <TabsList>
          <TabsTrigger value="configuracao" className="gap-2">
            <Settings className="w-4 h-4" /> Configuração
          </TabsTrigger>
          <TabsTrigger value="audiencia" className="gap-2">
            <Users className="w-4 h-4" /> Audiência
          </TabsTrigger>
          <TabsTrigger value="mensagem" className="gap-2">
            <MessageSquare className="w-4 h-4" /> Mensagem
          </TabsTrigger>
        </TabsList>

        {/* ── Aba: Configuração ── */}
        <TabsContent value="configuracao" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Regra da Automação</CardTitle>
              <CardDescription>Defina como e quando esta automação será executada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Gatilho</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-gray-700">{modelo.gatilho}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Condição</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <Zap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-gray-700">{modelo.condicao}</span>
                  </div>
                </div>
              </div>

              {modelo.eventoVinculado && (
                <div className="space-y-1.5">
                  <Label htmlFor="evento">Evento vinculado</Label>
                  <Select
                    value={instancia.eventoVinculadoNome || "nenhum"}
                    onValueChange={(v) =>
                      atualizar(modelo.id, { eventoVinculadoNome: v === "nenhum" ? "" : (v ?? "") })
                    }
                  >
                    <SelectTrigger id="evento">
                      <SelectValue placeholder="Selecionar evento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Selecionar evento...</SelectItem>
                      <SelectItem value="Réveillon Destino 2025">Réveillon Destino 2025</SelectItem>
                      <SelectItem value="Oboé Dezembro 2025">Oboé Dezembro 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="oferta">Oferta / Benefício</Label>
                <Input
                  id="oferta"
                  value={instancia.oferta}
                  onChange={(e) => atualizar(modelo.id, { oferta: e.target.value })}
                  placeholder="Descreva a oferta ou benefício desta automação..."
                />
                <p className="text-xs text-muted-foreground">
                  Use este campo para descrever o que será comunicado (desconto, acesso antecipado, novidade, etc.)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Canais</Label>
                <div className="flex gap-2">
                  {modelo.canais.map((canal) => (
                    <span
                      key={canal}
                      className="flex items-center gap-1.5 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                      {canal === "whatsapp"
                        ? <Smartphone className="w-4 h-4 text-emerald-600" />
                        : <Mail className="w-4 h-4 text-blue-600" />}
                      {canal === "whatsapp" ? "WhatsApp" : "E-mail"}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba: Audiência ── */}
        <TabsContent value="audiencia" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prévia da Audiência</CardTitle>
              <CardDescription>
                Estimativa de clientes que entrarão nesta regra quando ativada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Número principal */}
              <div className={cn("rounded-xl p-5 flex items-center gap-5", cor.bg)}>
                <div className="text-center">
                  <p className={cn("text-5xl font-bold", cor.icon)}>
                    {totalPreSelecionados > 0 ? totalPreSelecionados : modelo.audiencia.totalMock}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalPreSelecionados > 0 ? "clientes pré-selecionados" : "clientes elegíveis (estimado)"}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-14" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{modelo.audiencia.descricao}</p>
                  <p className="text-xs text-muted-foreground">{modelo.audiencia.porqueElegiveis}</p>
                </div>
              </div>

              {/* Exemplos */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Exemplos de clientes elegíveis</p>
                <div className="space-y-2">
                  {modelo.audiencia.exemplos.map((nome) => (
                    <div key={nome} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {nome.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">{nome}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">Elegível</Badge>
                    </div>
                  ))}
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    + {(totalPreSelecionados > 0 ? totalPreSelecionados : modelo.audiencia.totalMock) - modelo.audiencia.exemplos.length} outros clientes
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Os números acima são uma estimativa visual. A contagem real será calculada automaticamente quando a automação for ativada.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba: Mensagem ── */}
        <TabsContent value="mensagem" className="mt-4 space-y-4">
          {/* WhatsApp */}
          {modelo.canais.includes("whatsapp") && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-base">Mensagem WhatsApp</CardTitle>
                </div>
                <CardDescription>
                  Use <code className="bg-gray-100 px-1 rounded text-xs">{"{nome}"}</code> para personalizar com o nome do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  value={instancia.mensagemWhatsapp}
                  onChange={(e) => atualizar(modelo.id, { mensagemWhatsapp: e.target.value })}
                  className="font-mono text-sm resize-none"
                  placeholder="Digite a mensagem de WhatsApp..."
                />
                <p className="text-xs text-muted-foreground text-right">
                  {instancia.mensagemWhatsapp.length} caracteres
                </p>

                {/* Preview */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
                  <div className="bg-[#ece5dd] rounded-xl p-4">
                    <div className="bg-white rounded-xl p-3 max-w-[280px] shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {instancia.mensagemWhatsapp.replace("{nome}", "João")}
                      </p>
                      <p className="text-[10px] text-gray-400 text-right mt-1">✓✓</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* E-mail */}
          {modelo.canais.includes("email") && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">Mensagem E-mail</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-assunto">Assunto</Label>
                  <Input
                    id="email-assunto"
                    value={instancia.mensagemEmailAssunto}
                    onChange={(e) => atualizar(modelo.id, { mensagemEmailAssunto: e.target.value })}
                    placeholder="Assunto do e-mail..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-corpo">Corpo</Label>
                  <Textarea
                    id="email-corpo"
                    rows={7}
                    value={instancia.mensagemEmailCorpo}
                    onChange={(e) => atualizar(modelo.id, { mensagemEmailCorpo: e.target.value })}
                    className="resize-none text-sm"
                    placeholder="Corpo do e-mail..."
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Ações finais ── */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Status atual</p>
              <p className="text-xs text-muted-foreground">
                {instancia.status === "ativa"
                  ? "Esta automação está ativa e será executada automaticamente."
                  : instancia.status === "pausada"
                  ? "Esta automação está pausada e não será executada."
                  : "Este rascunho ainda não foi ativado."}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => alterarStatus(modelo.id, "rascunho")}
                disabled={instancia.status === "rascunho"}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </Button>

              {instancia.status === "ativa" ? (
                <Button
                  variant="outline"
                  onClick={() => alterarStatus(modelo.id, "pausada")}
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Pause className="w-4 h-4" />
                  Pausar Automação
                </Button>
              ) : (
                <Button
                  onClick={() => alterarStatus(modelo.id, "ativa")}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Ativar Automação
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
