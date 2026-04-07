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
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export const DialogNovoContato = ({
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
      const resp = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Contato criado com sucesso!");
        reset();
        onFechar();
        router.refresh();
      } else {
        toast.error("Erro ao criar contato");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Nome completo" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} placeholder="email@exemplo.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Observações sobre o contato..." rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={carregando}>
              {carregando ? "Salvando..." : "Criar Contato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
