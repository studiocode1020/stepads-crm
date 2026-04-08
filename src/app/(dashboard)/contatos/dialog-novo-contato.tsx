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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const ORIGENS = [
  "Indicação de amigo",
  "Redes sociais",
  "Evento anterior",
  "Site / Google",
  "WhatsApp",
  "Outro",
];

export const DialogNovoContato = ({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) => {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [origem, setOrigem] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (dados: Form) => {
    setCarregando(true);
    try {
      const resp = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dados, origem: origem || undefined }),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Contato criado com sucesso!");
        reset();
        setOrigem("");
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Nascimento</Label>
              <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Como conheceu?</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar origem..." />
              </SelectTrigger>
              <SelectContent>
                {ORIGENS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Observações sobre o contato..." rows={2} />
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
