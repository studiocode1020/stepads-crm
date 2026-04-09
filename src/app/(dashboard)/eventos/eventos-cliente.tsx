"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Plus, Calendar, MapPin, Users, Building2, Trash2, Eye,
  FolderOpen, Layers, ChevronRight, Zap,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatarData } from "@/lib/utils";
import { DialogNovoEvento } from "./dialog-novo-evento";
import { DialogNovoGrupo } from "./dialog-novo-grupo";

type Evento = {
  id: string;
  nome: string;
  data: Date;
  local: string | null;
  tipo: string | null;
  status: string;
  capacidade: number | null;
  company: { id: string; nome: string } | null;
  eventGroup: { id: string; nome: string } | null;
  _count: { participacoes: number };
};

type GrupoCard = {
  id: string;
  nome: string;
  descricao: string | null;
  totalClientes: number;
  totalEdicoes: number;
  proximaEdicao: { id: string; nome: string; data: Date } | null;
  ativo: boolean;
};

const STATUS_ESTILOS: Record<string, { label: string; classe: string }> = {
  planejamento: { label: "Em Planejamento", classe: "bg-blue-100 text-blue-800" },
  confirmado:   { label: "Confirmado",      classe: "bg-emerald-100 text-emerald-800" },
  realizado:    { label: "Realizado",       classe: "bg-gray-100 text-gray-700" },
  cancelado:    { label: "Cancelado",       classe: "bg-red-100 text-red-700" },
};

type Props = {
  grupos: GrupoCard[];
  eventosSemGrupo: Evento[];
  totalEventos: number;
  buscaInicial: string;
};

export const EventosCliente = ({
  grupos,
  eventosSemGrupo,
  totalEventos,
  buscaInicial,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [busca, setBusca] = useState(buscaInicial);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [dialogEventoAberto, setDialogEventoAberto] = useState(false);
  const [dialogGrupoAberto, setDialogGrupoAberto] = useState(false);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleDeletar = async () => {
    if (!deletandoId) return;
    const resp = await fetch(`/api/eventos/${deletandoId}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.success) {
      toast.success("Evento removido");
      router.refresh();
    } else {
      toast.error("Erro ao remover evento");
    }
    setDeletandoId(null);
  };

  const tipoCorMap: Record<string, string> = {
    Cultural: "bg-amber-100 text-amber-800",
    Educacional: "bg-blue-100 text-blue-800",
    Conferência: "bg-purple-100 text-purple-800",
    Webinar: "bg-emerald-100 text-emerald-800",
  };

  return (
    <>
      <div className="space-y-6">
        {/* Barra de ações */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <form onSubmit={buscar} className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogGrupoAberto(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Novo Grupo
              </Button>
              <Button type="button" onClick={() => setDialogEventoAberto(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Edição
              </Button>
            </div>
          </form>
        </div>

        {/* Grupos de eventos */}
        {grupos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Grupos de Eventos
              </h2>
              <span className="text-xs text-muted-foreground">({grupos.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grupos.map((g) => (
                <Card key={g.id} className="shadow-sm hover:shadow-md transition-shadow border group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/eventos/grupo/${g.id}`}
                          className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                          {g.nome}
                        </Link>
                        {g.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.descricao}</p>
                        )}
                      </div>
                      {g.ativo && (
                        <span className="ml-2 flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                          <Zap className="w-3 h-3" />
                          Ativo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-gray-900">{g.totalClientes.toLocaleString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">clientes</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-gray-900">{g.totalEdicoes}</p>
                        <p className="text-xs text-muted-foreground">edições</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-4">
                      {g.proximaEdicao ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          Próxima: <span className="font-medium text-gray-700 truncate">{g.proximaEdicao.nome}</span>
                          &nbsp;–&nbsp;{formatarData(g.proximaEdicao.data)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Encerrado</span>
                      )}
                    </div>

                    <Link
                      href={`/eventos/grupo/${g.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full gap-1 group-hover:border-primary group-hover:text-primary transition-colors"
                      )}
                    >
                      Ver grupo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Eventos sem grupo */}
        {eventosSemGrupo.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Eventos sem grupo
              </h2>
              <span className="text-xs text-muted-foreground">({eventosSemGrupo.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {eventosSemGrupo.map((e) => (
                <Card key={e.id} className="shadow-sm hover:shadow-md transition-shadow border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/eventos/${e.id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                          {e.nome}
                        </Link>
                      </div>
                      {e.tipo && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tipoCorMap[e.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                          {e.tipo}
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      {(() => {
                        const s = STATUS_ESTILOS[e.status] ?? STATUS_ESTILOS.planejamento;
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.classe}`}>
                            {s.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatarData(e.data)}</span>
                      </div>
                      {e.local && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{e.local}</span>
                        </div>
                      )}
                      {e.company && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{e.company.nome}</span>
                        </div>
                      )}
                    </div>

                    {e.capacidade && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{e._count.participacoes} confirmados</span>
                          <span>cap. {e.capacidade.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (e._count.participacoes / e.capacidade) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {e._count.participacoes} participante{e._count.participacoes !== 1 ? "s" : ""}
                      </Badge>
                      <div className="flex gap-1">
                        <Link href={`/eventos/${e.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "w-8 h-8")}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          className="w-8 h-8 hover:text-destructive"
                          onClick={() => setDeletandoId(e.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {grupos.length === 0 && eventosSemGrupo.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
            Nenhum evento encontrado
          </div>
        )}
      </div>

      <DialogNovoEvento aberto={dialogEventoAberto} onFechar={() => setDialogEventoAberto(false)} />
      <DialogNovoGrupo aberto={dialogGrupoAberto} onFechar={() => setDialogGrupoAberto(false)} />

      <AlertDialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento e todas as participações serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
