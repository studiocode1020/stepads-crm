"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Plus, Download, Filter, Trash2, Eye, Phone, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatarData } from "@/lib/utils";
import { DialogNovoContato } from "./dialog-novo-contato";

type Contato = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: Date | null;
  criadoEm: Date;
  participacoes: { event: { id: string; nome: string; data: Date } }[];
  tags: { tag: { id: string; nome: string; cor: string } }[];
};

type Props = {
  contatos: Contato[];
  total: number;
  paginas: number;
  paginaAtual: number;
  buscaInicial: string;
  eventoIdInicial: string;
  tagIdInicial: string;
  eventos: { id: string; nome: string; data: Date }[];
  tags: { id: string; nome: string; cor: string }[];
};

export const ContatosCliente = ({
  contatos, total, paginas, paginaAtual, buscaInicial,
  eventoIdInicial, tagIdInicial, eventos, tags,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [busca, setBusca] = useState(buscaInicial);
  const [eventoId, setEventoId] = useState(eventoIdInicial);
  const [tagId, setTagId] = useState(tagIdInicial);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const atualizarFiltros = (novaBusca: string, novoEvento: string, novaTag: string, pagina = 1) => {
    const params = new URLSearchParams();
    if (novaBusca) params.set("busca", novaBusca);
    if (novoEvento) params.set("eventoId", novoEvento);
    if (novaTag) params.set("tagId", novaTag);
    if (pagina > 1) params.set("pagina", String(pagina));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltros(busca, eventoId, tagId);
  };

  const handleDeletar = async () => {
    if (!deletandoId) return;
    const resp = await fetch(`/api/contatos/${deletandoId}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.success) {
      toast.success("Contato removido");
      router.refresh();
    } else {
      toast.error("Erro ao remover contato");
    }
    setDeletandoId(null);
  };

  const exportar = () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (eventoId) params.set("eventoId", eventoId);
    window.open(`/api/contatos/exportar?${params.toString()}`, "_blank");
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filtros */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <form onSubmit={handleBusca} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={eventoId || "todos"} onValueChange={(v) => {
              const val = (v === "todos" || v === null) ? "" : v;
              setEventoId(val);
              atualizarFiltros(busca, val, tagId);
            }}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os eventos</SelectItem>
                {eventos.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagId || "todas"} onValueChange={(v) => {
              const val = (v === "todas" || v === null) ? "" : v;
              setTagId(val);
              atualizarFiltros(busca, eventoId, val);
            }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">Buscar</Button>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" type="button" onClick={exportar}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button type="button" onClick={() => setDialogAberto(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </div>
          </form>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">Nascimento</TableHead>
                <TableHead className="font-semibold">Eventos</TableHead>
                <TableHead className="font-semibold">Tags</TableHead>
                <TableHead className="font-semibold">Cadastrado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              )}
              {contatos.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Link href={`/contatos/${c.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                      {c.nome}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.telefone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{c.telefone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatarData(c.dataNascimento)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const n = c.participacoes.length;
                      if (n === 0) return <span className="text-xs text-muted-foreground">—</span>;
                      if (n >= 4) return <Badge className="text-xs bg-violet-600 hover:bg-violet-700">Frequente · {n}x</Badge>;
                      if (n >= 2) return <Badge className="text-xs bg-emerald-600 hover:bg-emerald-700">Regular · {n}x</Badge>;
                      return <Badge variant="secondary" className="text-xs">Novo · 1x</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.nome}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatarData(c.criadoEm)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/contatos/${c.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "w-8 h-8")}>
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Button
                        variant="ghost" size="icon"
                        className="w-8 h-8 hover:text-destructive"
                        onClick={() => setDeletandoId(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {paginas > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {paginaAtual} de {paginas} ({total.toLocaleString("pt-BR")} contatos)</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={paginaAtual <= 1}
                onClick={() => atualizarFiltros(busca, eventoId, tagId, paginaAtual - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={paginaAtual >= paginas}
                onClick={() => atualizarFiltros(busca, eventoId, tagId, paginaAtual + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogNovoContato aberto={dialogAberto} onFechar={() => setDialogAberto(false)} />

      <AlertDialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato será removido junto com seu histórico de eventos.
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
