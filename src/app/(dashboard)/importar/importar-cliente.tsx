"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Evento = { id: string; nome: string; data: Date };

type Etapa = "upload" | "mapeamento" | "confirmando" | "resultado";

type ResultadoImportacao = {
  novosContatos: number;
  duplicados: number;
  erros: number;
  detalhes: { nome: string; status: "novo" | "duplicado" | "erro"; motivo?: string }[];
};

const CAMPOS_SISTEMA = [
  { value: "", label: "— Ignorar coluna —" },
  { value: "nome", label: "Nome" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "dataNascimento", label: "Data de Nascimento" },
  { value: "observacoes", label: "Observações" },
];

export const ImportarCliente = ({ eventos }: { eventos: Evento[] }) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colunas, setColunas] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [totalLinhas, setTotalLinhas] = useState(0);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});
  const [eventoId, setEventoId] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

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
      // Auto-mapeamento por nome de coluna
      const autoMap: Record<string, string> = {};
      cols.forEach((col: string) => {
        const c = col.toLowerCase();
        if (c.includes("nome")) autoMap[col] = "nome";
        else if (c.includes("email") || c.includes("e-mail")) autoMap[col] = "email";
        else if (c.includes("tel") || c.includes("fone") || c.includes("celular")) autoMap[col] = "telefone";
        else if (c.includes("nasc") || c.includes("data")) autoMap[col] = "dataNascimento";
        else if (c.includes("obs")) autoMap[col] = "observacoes";
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

  const handleConfirmar = async () => {
    if (!arquivo) return;
    setEtapa("confirmando");
    setProgresso(10);
    setCarregando(true);

    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("mapeamento", JSON.stringify(mapeamento));
      if (eventoId) form.append("eventId", eventoId);

      setProgresso(40);
      const resp = await fetch("/api/importar/confirmar", { method: "POST", body: form });
      setProgresso(80);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error);
      setProgresso(100);
      setResultado(json.data);
      setEtapa("resultado");
      toast.success("Importação concluída!");
    } catch (error) {
      toast.error(`Erro na importação: ${error}`);
      setEtapa("mapeamento");
    } finally {
      setCarregando(false);
    }
  };

  const reiniciar = () => {
    setEtapa("upload");
    setArquivo(null);
    setColunas([]);
    setPreview([]);
    setTotalLinhas(0);
    setMapeamento({});
    setEventoId("");
    setResultado(null);
    setProgresso(0);
  };

  if (etapa === "resultado" && resultado) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <CardTitle>Importação Concluída</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{resultado.novosContatos}</p>
              <p className="text-sm text-emerald-600 mt-1">Novos contatos</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{resultado.duplicados}</p>
              <p className="text-sm text-amber-600 mt-1">Já existentes</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{resultado.erros}</p>
              <p className="text-sm text-red-600 mt-1">Erros</p>
            </div>
          </div>

          {resultado.detalhes.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.detalhes.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{d.nome}</TableCell>
                      <TableCell>
                        <Badge
                          variant={d.status === "novo" ? "default" : d.status === "duplicado" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {d.status === "novo" ? "Novo" : d.status === "duplicado" ? "Duplicado" : "Erro"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reiniciar} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nova Importação
            </Button>
            <Button onClick={() => router.push("/contatos")}>
              Ver Contatos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etapa === "confirmando") {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900">Importando contatos...</p>
            <p className="text-sm text-muted-foreground mt-1">Processando deduplicação e inserção</p>
          </div>
          <Progress value={progresso} className="max-w-xs mx-auto" />
          <p className="text-sm text-muted-foreground">{progresso}%</p>
        </CardContent>
      </Card>
    );
  }

  if (etapa === "mapeamento") {
    return (
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Mapeamento de Colunas
            </CardTitle>
            <CardDescription>
              {arquivo?.name} — {totalLinhas} linhas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vinculação a evento */}
            <div className="space-y-2">
              <Label>Vincular ao evento (opcional)</Label>
              <Select value={eventoId || "nenhum"} onValueChange={(v) => setEventoId((v === "nenhum" || v === null) ? "" : v)}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Selecionar evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum evento</SelectItem>
                  {eventos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Mapeamento de colunas */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Mapeie as colunas da planilha:</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Preview (primeiras {preview.length} linhas)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {colunas.map((c) => (
                      <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((linha, i) => (
                    <TableRow key={i}>
                      {colunas.map((c) => (
                        <TableCell key={c} className="text-xs max-w-[150px] truncate" title={linha[c]}>
                          {linha[c]}
                        </TableCell>
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
          <Button
            onClick={handleConfirmar}
            disabled={!Object.values(mapeamento).some((v) => v === "nome")}
          >
            Confirmar Importação ({totalLinhas} contatos)
          </Button>
        </div>

        {!Object.values(mapeamento).some((v) => v === "nome") && (
          <p className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            Mapeie pelo menos a coluna &quot;Nome&quot; para continuar
          </p>
        )}
      </div>
    );
  }

  // Etapa de upload
  return (
    <Card className="shadow-sm">
      <CardContent className="p-8">
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
              {carregando ? (
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {carregando ? "Processando arquivo..." : "Arraste ou clique para fazer upload"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Suporta arquivos .xlsx e .csv
              </p>
            </div>
            {!carregando && (
              <Button variant="outline">Selecionar arquivo</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
