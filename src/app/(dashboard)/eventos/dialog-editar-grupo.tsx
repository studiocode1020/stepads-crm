"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type GrupoCard = {
  id: string;
  nome: string;
  descricao: string | null;
};

export const DialogEditarGrupo = ({
  grupo,
  aberto,
  onFechar,
}: {
  grupo: GrupoCard | null;
  aberto: boolean;
  onFechar: () => void;
}) => {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (aberto && grupo) {
      setNome(grupo.nome);
      setDescricao(grupo.descricao ?? "");
    }
  }, [aberto, grupo]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupo || !nome.trim()) return;
    setCarregando(true);
    try {
      const resp = await fetch(`/api/eventos/grupos/${grupo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || null }),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Grupo atualizado!");
        onFechar();
        router.refresh();
      } else {
        toast.error("Erro ao atualizar grupo");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-grupo-nome">Nome *</Label>
            <Input
              id="edit-grupo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do grupo"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-grupo-desc">Descrição</Label>
            <Textarea
              id="edit-grupo-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do grupo..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={carregando || !nome.trim()}>
              {carregando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
