import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarEventoPorId } from "@/lib/queries/eventos";
import { formatarData, formatarDataHora } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, MapPin, Building2, Users, Mail, Phone, DollarSign } from "lucide-react";

const STATUS_ESTILOS: Record<string, { label: string; classe: string }> = {
  planejamento: { label: "Em Planejamento", classe: "bg-blue-100 text-blue-800" },
  confirmado:   { label: "Confirmado",      classe: "bg-emerald-100 text-emerald-800" },
  realizado:    { label: "Realizado",       classe: "bg-gray-100 text-gray-700" },
  cancelado:    { label: "Cancelado",       classe: "bg-red-100 text-red-700" },
};

export const dynamic = "force-dynamic";

const DetalheEventoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const evento = await buscarEventoPorId(id);

  if (!evento) notFound();

  const totalParticipantes = evento._count.participacoes;
  const statusInfo = STATUS_ESTILOS[evento.status] ?? STATUS_ESTILOS.planejamento;
  const ocupacao = evento.capacidade ? Math.round((totalParticipantes / evento.capacidade) * 100) : null;

  return (
    <div className="p-8 max-w-5xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/eventos">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Eventos
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Info do evento */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">{evento.nome}</h1>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.classe}`}>
                    {statusInfo.label}
                  </span>
                  {evento.tipo && (
                    <Badge variant="secondary">{evento.tipo}</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatarData(evento.data)}</span>
                </div>
                {evento.local && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{evento.local}</span>
                  </div>
                )}
                {evento.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>{evento.company.nome}</span>
                  </div>
                )}
              </div>

              {evento.descricao && (
                <p className="mt-4 text-sm text-muted-foreground border-t pt-4">{evento.descricao}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="space-y-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{totalParticipantes}</p>
              <p className="text-sm text-muted-foreground">participantes</p>
              {ocupacao !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Ocupação</span>
                    <span>{ocupacao}% de {evento.capacidade?.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, ocupacao)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {evento.orcamento && (
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {evento.orcamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-sm text-muted-foreground">orçamento</p>
              </CardContent>
            </Card>
          )}
          {evento.importLogs.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Importações</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                {evento.importLogs.map((log) => (
                  <div key={log.id} className="text-xs">
                    <p className="font-medium truncate" title={log.nomeArquivo}>{log.nomeArquivo}</p>
                    <p className="text-muted-foreground">{formatarDataHora(log.criadoEm)}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">+{log.novosContatos}</Badge>
                      {log.duplicados > 0 && <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-0">{log.duplicados} dup.</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lista de participantes */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Participantes ({totalParticipantes})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evento.participacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum participante registrado
                  </TableCell>
                </TableRow>
              )}
              {evento.participacoes.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Link href={`/contatos/${p.contact.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                      {p.contact.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.contact.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {p.contact.email}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.contact.telefone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.contact.telefone}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {p.contact.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.nome}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatarData(p.criadoEm)}
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

export default DetalheEventoPage;
