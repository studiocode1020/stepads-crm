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
  status: z.string().optional(),
  capacidade: z.string().optional(),
  orcamento: z.string().optional(),
  descricao: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const STATUS_OPCOES = [
  { valor: "planejamento", label: "Em Planejamento" },
  { valor: "confirmado", label: "Confirmado" },
  { valor: "realizado", label: "Realizado" },
  { valor: "cancelado", label: "Cancelado" },
];

type Grupo = { id: string; nome: string };

export const DialogNovoEvento = ({
  aberto,
  onFechar,
  groupId,
}: {
  aberto: boolean;
  onFechar: () => void;
  groupId?: string;
}) => {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState("planejamento");
  const [eventGroupId, setEventGroupId] = useState<string>(groupId ?? "");
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

  // Sincroniza groupId prop
  useEffect(() => {
    setEventGroupId(groupId ?? "");
  }, [groupId, aberto]);

  const onSubmit = async (dados: Form) => {
    setCarregando(true);
    try {
      const payload: Record<string, unknown> = {
        ...dados,
        status,
        capacidade: dados.capacidade ? Number(dados.capacidade) : undefined,
        orcamento: dados.orcamento ? Number(dados.orcamento) : undefined,
      };
      if (eventGroupId) payload.eventGroupId = eventGroupId;

      const resp = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Evento criado com sucesso!");
        reset();
        setStatus("planejamento");
        setEventGroupId(groupId ?? "");
        onFechar();
        router.refresh();
      } else {
        toast.error("Erro ao criar evento");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Nome do evento" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="datetime-local" {...register("data")} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "planejamento")}>
                <SelectTrigger>
                  <SelectValue />
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
                <SelectValue placeholder="Selecionar grupo (opcional)" />
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
            <Label htmlFor="local">Local</Label>
            <Input id="local" {...register("local")} placeholder="Local do evento" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Input id="tipo" {...register("tipo")} placeholder="Camarote, Festival, Réveillon..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capacidade">Capacidade</Label>
              <Input id="capacidade" type="number" {...register("capacidade")} placeholder="Ex: 500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orcamento">Orçamento (R$)</Label>
              <Input id="orcamento" type="number" step="0.01" {...register("orcamento")} placeholder="Ex: 15000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register("descricao")} placeholder="Descrição do evento..." rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={carregando}>
              {carregando ? "Salvando..." : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
