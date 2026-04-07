"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Building2, Calendar, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  site: z.string().optional(),
  observacoes: z.string().optional(),
});
type Form = z.infer<typeof schema>;

type Empresa = {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  site: string | null;
  _count: { eventos: number };
};

export const EmpresasCliente = ({
  empresas, total, paginas, paginaAtual, buscaInicial,
}: {
  empresas: Empresa[];
  total: number;
  paginas: number;
  paginaAtual: number;
  buscaInicial: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [busca, setBusca] = useState(buscaInicial);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const onSubmit = async (dados: Form) => {
    setCarregando(true);
    try {
      const resp = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await resp.json();
      if (json.success) {
        toast.success("Empresa criada!");
        reset();
        setDialogAberto(false);
        router.refresh();
      } else {
        toast.error("Erro ao criar empresa");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <form onSubmit={buscar} className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar empresas..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit">Buscar</Button>
            <Button type="button" onClick={() => setDialogAberto(true)} className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </form>
        </div>

        {empresas.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
            Nenhuma empresa encontrada
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {empresas.map((e) => (
              <Card key={e.id} className="shadow-sm hover:shadow-md transition-shadow border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{e.nome}</p>
                      {e.cnpj && <p className="text-xs text-muted-foreground">{e.cnpj}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {e.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />{e.email}
                      </div>
                    )}
                    {e.telefone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{e.telefone}
                      </div>
                    )}
                    {e.site && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />{e.site}
                      </div>
                    )}
                  </div>

                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    {e._count.eventos} evento{e._count.eventos !== 1 ? "s" : ""}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {paginas > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {paginaAtual} de {paginas} ({total} empresas)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={paginaAtual <= 1}
                onClick={() => { const p = new URLSearchParams(); if (busca) p.set("busca", busca); p.set("pagina", String(paginaAtual - 1)); startTransition(() => router.push(`${pathname}?${p.toString()}`)); }}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={paginaAtual >= paginas}
                onClick={() => { const p = new URLSearchParams(); if (busca) p.set("busca", busca); p.set("pagina", String(paginaAtual + 1)); startTransition(() => router.push(`${pathname}?${p.toString()}`)); }}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogAberto} onOpenChange={(v) => !v && setDialogAberto(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input {...register("nome")} placeholder="Nome da empresa" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input {...register("cnpj")} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register("telefone")} placeholder="(11) 9999-9999" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input {...register("email")} type="email" placeholder="contato@empresa.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input {...register("site")} placeholder="www.empresa.com" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={carregando}>
                {carregando ? "Salvando..." : "Criar Empresa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
