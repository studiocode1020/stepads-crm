"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  data: z.string().min(1, "Data obrigatória"),
  local: z.string().optional(),
  tipo: z.string().optional(),
  capacidade: z.string().optional(),
  orcamento: z.string().optional(),
  descricao: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const STATUS_OPCOES = [
  { valor: "planejamento", label: "Em Planejamento" },
  { valor: "confirmado",   label: "Confirmado" },
  { valor: "realizado",    label: "Realizado" },
  { valor: "cancelado",    label: "Cancelado" },
];

type Grupo = { id: string; nome: string };

type EventoParaEditar = {
  id: string;
  nome: string;
  data: Date;
  local: string | null;
  tipo: string | null;
  status: string;
  capacidade: number | null;
  orcamento?: number | null;
  descricao?: string | null;
  eventGroupId?: string | null;
};

export const DialogEditarEvento = ({
  evento,
  aberto,
  onFechar,
}: {
  evento: EventoParaEditar | null;
  aberto: boolean;
  onFechar: () => void;
}) => {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState("planejamento");
  const [eventGroupId, setEventGroupId] = useState<string>("");
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  // Carrega grupos quando dialog abre
  useEffect(() => {
    if (!aberto) return;
    fetch("/api/eventos/grupos?modo=simples")
      .then((r) => r.json())
      .then((j) => { if (j.success) setGrupos(j.data); })
      .catch(() => {});
  }, [aberto]);

  // Preenche formulário com dados do evento
  useEffect(() => {
    if (!aberto || !evento) return;

    const dataLocal = new Date(evento.data);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dataFormatada = `${dataLocal.getFullYear()}-${pad(dataLocal.getMonth() + 1)}-${pad(dataLocal.getDate())}T${pad(dataLocal.getHours())}:${pad(dataLocal.getMinutes())}`;

    reset({
      nome: evento.nome,
      data: dataFormatada,
      local: evento.local ?? "",
      tipo: evento.tipo ?? "",
      capacidade: evento.capacidade ? String(evento.capacidade) : "",
      orcamento: evento.orcamento ? String(evento.orcamento) : "",
      descricao: evento.descricao ?? "",
    });
    setStatus(evento.status);
    setEventGroupId(evento.eventGroupId ?? "");
  }, [aberto, evento, reset]);

  const onSubmit = async (dados: Form) => {
    if (!evento) return;
    setCarregando(true);
    try {
      const payload: Record<string, unknown> = {
        ...dados,
        status,
        capacidade: dados.capacidade ? Number(dados.capacidade) : null,
        orcamento: dados.orcamento ? Number(dados.orcamento) : null,
        eventGroupId: eventGroupId || null,
      };

      const resp = await fetch(`/api/eventos/${evento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Evento atualizado!");
        onFechar();
        router.refresh();
      } else {
        toast.error("Erro ao atualizar evento");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nome">Nome *</Label>
            <Input id="edit-nome" {...register("nome")} placeholder="Nome do evento" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-data">Data *</Label>
              <Input id="edit-data" type="datetime-local" {...register("data")} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "planejamento")}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: string) => STATUS_OPCOES.find(s => s.valor === v)?.label ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((s) => (
                    <SelectItem key={s.valor} value={s.valor}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Grupo do evento</Label>
            <Select
              value={eventGroupId || "none"}
              onValueChange={(v) => setEventGroupId(!v || v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar grupo (opcional)">
                  {(v: string) => (!v || v === "none") ? "Sem grupo" : (grupos.find(g => g.id === v)?.nome ?? v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem grupo</SelectItem>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-local">Local</Label>
            <Input id="edit-local" {...register("local")} placeholder="Local do evento" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Input id="edit-tipo" {...register("tipo")} placeholder="Camarote, Festival, Réveillon..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-capacidade">Capacidade</Label>
              <Input id="edit-capacidade" type="number" {...register("capacidade")} placeholder="Ex: 500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-orcamento">Orçamento (R$)</Label>
              <Input id="edit-orcamento" type="number" step="0.01" {...register("orcamento")} placeholder="Ex: 15000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea id="edit-descricao" {...register("descricao")} placeholder="Descrição do evento..." rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
