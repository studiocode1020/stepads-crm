"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Plus, Calendar, MapPin, Users, Building2, Eye,
  FolderOpen, Layers, ChevronRight, Zap, MoreHorizontal,
  Pencil, Trash2, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatarData } from "@/lib/utils";
import { DialogNovoEvento } from "./dialog-novo-evento";
import { DialogNovoGrupo } from "./dialog-novo-grupo";
import { DialogEditarEvento } from "./dialog-editar-evento";
import { DialogEditarGrupo } from "./dialog-editar-grupo";

// ─── Types ────────────────────────────────────────────────────────────────────

type Evento = {
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ESTILOS: Record<string, { label: string; classe: string }> = {
  planejamento: { label: "Em Planejamento", classe: "bg-blue-100 text-blue-800" },
  confirmado:   { label: "Confirmado",      classe: "bg-emerald-100 text-emerald-800" },
  realizado:    { label: "Realizado",       classe: "bg-gray-100 text-gray-700" },
  cancelado:    { label: "Cancelado",       classe: "bg-red-100 text-red-700" },
};

const tipoCorMap: Record<string, string> = {
  Cultural: "bg-amber-100 text-amber-800",
  Educacional: "bg-blue-100 text-blue-800",
  Conferência: "bg-purple-100 text-purple-800",
  Webinar: "bg-emerald-100 text-emerald-800",
};

// ─── Sortable Group Card ──────────────────────────────────────────────────────

function SortableGrupoCard({
  grupo,
  onEditar,
  onDeletar,
}: {
  grupo: GrupoCard;
  onEditar: () => void;
  onDeletar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: grupo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="shadow-sm hover:shadow-md transition-shadow border group relative">
        {/* Drag handle — canto superior esquerdo */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors touch-none"
          tabIndex={-1}
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <CardContent className="p-5 pt-5 pl-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/eventos/grupo/${grupo.id}`}
                className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                {grupo.nome}
              </Link>
              {grupo.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{grupo.descricao}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {grupo.ativo && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  <Zap className="w-3 h-3" />
                  Ativo
                </span>
              )}
              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEditar}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar grupo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDeletar} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir grupo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-gray-900">{grupo.totalClientes.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">clientes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-gray-900">{grupo.totalEdicoes}</p>
              <p className="text-xs text-muted-foreground">edições</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            {grupo.proximaEdicao ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Próxima: <span className="font-medium text-gray-700 truncate">{grupo.proximaEdicao.nome}</span>
                &nbsp;–&nbsp;{formatarData(grupo.proximaEdicao.data)}
              </span>
            ) : (
              <span className="text-muted-foreground italic">Encerrado</span>
            )}
          </div>

          <Link
            href={`/eventos/grupo/${grupo.id}`}
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
    </div>
  );
}

// ─── Sortable Evento Card ─────────────────────────────────────────────────────

function SortableEventoCard({
  evento,
  onEditar,
  onDeletar,
}: {
  evento: Evento;
  onEditar: () => void;
  onDeletar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: evento.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const s = STATUS_ESTILOS[evento.status] ?? STATUS_ESTILOS.planejamento;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="shadow-sm hover:shadow-md transition-shadow border relative">
        {/* Drag handle — canto superior esquerdo */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors touch-none"
          tabIndex={-1}
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <CardContent className="p-5 pt-5 pl-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Link href={`/eventos/${evento.id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                {evento.nome}
              </Link>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {evento.tipo && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoCorMap[evento.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                  {evento.tipo}
                </span>
              )}
              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEditar}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar evento
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDeletar} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir evento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.classe}`}>
              {s.label}
            </span>
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatarData(evento.data)}</span>
            </div>
            {evento.local && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{evento.local}</span>
              </div>
            )}
            {evento.company && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{evento.company.nome}</span>
              </div>
            )}
          </div>

          {evento.capacidade && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{evento._count.participacoes} confirmados</span>
                <span>cap. {evento.capacidade.toLocaleString("pt-BR")}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (evento._count.participacoes / evento.capacidade) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {evento._count.participacoes} participante{evento._count.participacoes !== 1 ? "s" : ""}
            </Badge>
            <Link href={`/eventos/${evento.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "w-8 h-8")}>
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  grupos: GrupoCard[];
  eventosSemGrupo: Evento[];
  totalEventos: number;
  buscaInicial: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const EventosCliente = ({
  grupos: gruposInicial,
  eventosSemGrupo: eventosInicial,
  totalEventos,
  buscaInicial,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [busca, setBusca] = useState(buscaInicial);

  // ── State ──
  const [grupos, setGrupos] = useState(gruposInicial);
  const [eventos, setEventos] = useState(eventosInicial);

  // Dialogs
  const [dialogEventoAberto, setDialogEventoAberto] = useState(false);
  const [dialogGrupoAberto, setDialogGrupoAberto] = useState(false);
  const [editandoEvento, setEditandoEvento] = useState<Evento | null>(null);
  const [editandoGrupo, setEditandoGrupo] = useState<GrupoCard | null>(null);

  // Confirmações de exclusão
  const [deletandoEventoId, setDeletandoEventoId] = useState<string | null>(null);
  const [deletandoGrupoId, setDeletandoGrupoId] = useState<string | null>(null);

  // ── DnD Sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Handlers ──
  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleDeletarEvento = async () => {
    if (!deletandoEventoId) return;
    const resp = await fetch(`/api/eventos/${deletandoEventoId}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.success) {
      toast.success("Evento removido");
      router.refresh();
    } else {
      toast.error("Erro ao remover evento");
    }
    setDeletandoEventoId(null);
  };

  const handleDeletarGrupo = async () => {
    if (!deletandoGrupoId) return;
    const resp = await fetch(`/api/eventos/grupos/${deletandoGrupoId}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.success) {
      toast.success("Grupo removido");
      router.refresh();
    } else {
      toast.error("Erro ao remover grupo");
    }
    setDeletandoGrupoId(null);
  };

  const handleDragEndGrupos = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = grupos.findIndex((g) => g.id === active.id);
    const newIndex = grupos.findIndex((g) => g.id === over.id);
    const novaOrdem = arrayMove(grupos, oldIndex, newIndex);
    setGrupos(novaOrdem);

    fetch("/api/eventos/grupos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: novaOrdem.map((g) => g.id) }),
    }).catch(() => toast.error("Erro ao salvar ordem"));
  };

  const handleDragEndEventos = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = eventos.findIndex((e) => e.id === active.id);
    const newIndex = eventos.findIndex((e) => e.id === over.id);
    const novaOrdem = arrayMove(eventos, oldIndex, newIndex);
    setEventos(novaOrdem);

    fetch("/api/eventos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: novaOrdem.map((e) => e.id) }),
    }).catch(() => toast.error("Erro ao salvar ordem"));
  };

  // ── Render ──
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndGrupos}>
              <SortableContext items={grupos.map((g) => g.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {grupos.map((g) => (
                    <SortableGrupoCard
                      key={g.id}
                      grupo={g}
                      onEditar={() => setEditandoGrupo(g)}
                      onDeletar={() => setDeletandoGrupoId(g.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Eventos sem grupo */}
        {eventos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Eventos sem grupo
              </h2>
              <span className="text-xs text-muted-foreground">({eventos.length})</span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndEventos}>
              <SortableContext items={eventos.map((e) => e.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {eventos.map((e) => (
                    <SortableEventoCard
                      key={e.id}
                      evento={e}
                      onEditar={() => setEditandoEvento(e)}
                      onDeletar={() => setDeletandoEventoId(e.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {grupos.length === 0 && eventos.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
            Nenhum evento encontrado
          </div>
        )}
      </div>

      {/* Dialogs de criação */}
      <DialogNovoEvento aberto={dialogEventoAberto} onFechar={() => setDialogEventoAberto(false)} />
      <DialogNovoGrupo aberto={dialogGrupoAberto} onFechar={() => setDialogGrupoAberto(false)} />

      {/* Dialogs de edição */}
      <DialogEditarEvento
        evento={editandoEvento}
        aberto={!!editandoEvento}
        onFechar={() => setEditandoEvento(null)}
      />
      <DialogEditarGrupo
        grupo={editandoGrupo}
        aberto={!!editandoGrupo}
        onFechar={() => setEditandoGrupo(null)}
      />

      {/* Confirmação exclusão evento */}
      <AlertDialog open={!!deletandoEventoId} onOpenChange={() => setDeletandoEventoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento e todas as participações serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletarEvento} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação exclusão grupo */}
      <AlertDialog open={!!deletandoGrupoId} onOpenChange={() => setDeletandoGrupoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              O grupo será removido. Os eventos vinculados a ele serão desvinculados, mas não excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletarGrupo} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
