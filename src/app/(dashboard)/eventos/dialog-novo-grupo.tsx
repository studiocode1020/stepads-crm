"use client";

import { useState } from "react";
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

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export const DialogNovoGrupo = ({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) => {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (dados: Form) => {
    setCarregando(true);
    try {
      const resp = await fetch("/api/eventos/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Grupo criado com sucesso!");
        reset();
        onFechar();
        router.refresh();
      } else {
        toast.error("Erro ao criar grupo");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Grupo de Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Ex: Réveillon Destino" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição do grupo..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={carregando}>
              {carregando ? "Salvando..." : "Criar Grupo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
