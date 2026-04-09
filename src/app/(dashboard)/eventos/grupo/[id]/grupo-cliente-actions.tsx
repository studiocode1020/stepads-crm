"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DialogNovoEvento } from "../../dialog-novo-evento";

type Props = {
  grupoId: string;
  mostrarNovaEdicao?: boolean;
  tamanho?: "sm" | "default";
};

export const GrupoClienteActions = ({
  grupoId,
  mostrarNovaEdicao = false,
  tamanho = "sm",
}: Props) => {
  const [dialogAberto, setDialogAberto] = useState(false);

  if (!mostrarNovaEdicao) return null;

  return (
    <>
      <Button size={tamanho} onClick={() => setDialogAberto(true)}>
        <Plus className="w-4 h-4 mr-1.5" />
        Nova Edição
      </Button>
      <DialogNovoEvento
        aberto={dialogAberto}
        onFechar={() => setDialogAberto(false)}
        groupId={grupoId}
      />
    </>
  );
};
