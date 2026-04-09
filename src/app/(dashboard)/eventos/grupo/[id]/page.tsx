import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarGrupoPorId } from "@/lib/queries/eventos";
import { formatarData } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Calendar, Users, TrendingUp, Layers, ChevronRight,
} from "lucide-react";
import { GrupoClienteActions } from "./grupo-cliente-actions";

export const dynamic = "force-dynamic";

const STATUS_ESTILOS: Record<string, { label: string; classe: string }> = {
  planejamento: { label: "Em Planejamento", classe: "bg-blue-100 text-blue-800" },
  confirmado:   { label: "Confirmado",      classe: "bg-emerald-100 text-emerald-800" },
  realizado:    { label: "Realizado",       classe: "bg-gray-100 text-gray-700" },
  cancelado:    { label: "Cancelado",       classe: "bg-red-100 text-red-700" },
};

type DistribuicaoBarrasProps = {
  titulo: string;
  dados: { valor: string; total: number }[];
};

const DistribuicaoBarras = ({ titulo, dados }: DistribuicaoBarrasProps) => {
  const max = dados.reduce((acc, d) => acc + d.total, 0);
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{titulo}</p>
      {dados.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {dados.map((d) => {
            const pct = max > 0 ? Math.round((d.total / max) * 100) : 0;
            return (
              <div key={d.valor}>
                <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                  <span className="capitalize">{d.valor}</span>
                  <span>{pct}% ({d.total})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DetalheGrupoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const grupo = await buscarGrupoPorId(id);

  if (!grupo) notFound();

  const { stats, distribuicoes, edicoes, clientes } = grupo;

  return (
    <div className="p-8 max-w-6xl">
      {/* Breadcrumb / Voltar */}
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/eventos">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Eventos
        </Link>
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{grupo.nome}</h1>
          {grupo.descricao && (
            <p className="text-muted-foreground mt-1 max-w-xl">{grupo.descricao}</p>
          )}
        </div>
        <GrupoClienteActions grupoId={grupo.id} mostrarNovaEdicao tamanho="default" />
      </div>

      {/* Bloco 1 — Dashboard Consolidado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalClientes.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Total de Clientes</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {stats.ticketMedio > 0
                ? stats.ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalEdicoes}</p>
            <p className="text-xs text-muted-foreground">Edições</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900 line-clamp-1">
              {stats.proximaEdicao ? stats.proximaEdicao.nome : "Encerrado"}
            </p>
            {stats.proximaEdicao && (
              <p className="text-xs text-muted-foreground">{formatarData(stats.proximaEdicao.data)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Próxima Edição</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuições */}
      <Card className="shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perfil da Base Consolidada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DistribuicaoBarras titulo="Gênero" dados={distribuicoes.genero} />
            <DistribuicaoBarras titulo="Origem" dados={distribuicoes.origem} />
            <DistribuicaoBarras titulo="Estado (top 5)" dados={distribuicoes.estado} />
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2 — Edições */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Edições ({edicoes.length})</h2>
        </div>
        {edicoes.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma edição cadastrada neste grupo
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {edicoes.map((e) => {
              const statusInfo = STATUS_ESTILOS[e.status] ?? STATUS_ESTILOS.planejamento;
              return (
                <Card key={e.id} className="shadow-sm hover:shadow-md transition-shadow border group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        href={`/eventos/${e.id}`}
                        className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 flex-1"
                      >
                        {e.nome}
                      </Link>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusInfo.classe}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatarData(e.data)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <p className="text-sm font-bold text-gray-900">{e.totalClientes}</p>
                        <p className="text-xs text-muted-foreground">clientes</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {e.ticketMedio > 0
                            ? e.ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">ticket médio</p>
                      </div>
                    </div>
                    <Link
                      href={`/eventos/${e.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      Ver edição <ChevronRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bloco 3 — Base Consolidada de Clientes */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Base Consolidada de Clientes ({clientes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Nome</TableHead>
                <TableHead>Valor Acumulado</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead>Edições</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum participante registrado
                  </TableCell>
                </TableRow>
              )}
              {clientes.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Link
                      href={`/contatos/${c.id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {c.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.valorTotal > 0
                      ? c.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.ticketMedio > 0
                      ? c.ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.edicoes.map((ed) => (
                        <Badge key={ed.id} variant="secondary" className="text-xs">
                          {ed.nome}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalheGrupoPage;
