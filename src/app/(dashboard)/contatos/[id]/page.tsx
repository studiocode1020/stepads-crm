import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarContatoPorId } from "@/lib/queries/contatos";
import { formatarData, calcularIdade } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Building2, Radar } from "lucide-react";

export const dynamic = "force-dynamic";

const DetalheContatoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const contato = await buscarContatoPorId(id);

  if (!contato) notFound();

  const idade = calcularIdade(contato.dataNascimento);

  return (
    <div className="p-8 max-w-4xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/contatos">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Contatos
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do contato */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {contato.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{contato.nome}</h1>
                {contato.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {contato.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.cor }}
                      >
                        {tag.nome}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {contato.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-gray-700 truncate">{contato.email}</span>
                  </div>
                )}
                {contato.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-gray-700">{contato.telefone}</span>
                  </div>
                )}
                {contato.dataNascimento && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatarData(contato.dataNascimento)}
                      {idade !== null && <span className="text-muted-foreground ml-1">({idade} anos)</span>}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Cadastrado em {formatarData(contato.criadoEm)}</span>
                </div>
              </div>

              {contato.observacoes && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground">{contato.observacoes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{contato.participacoes.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                evento{contato.participacoes.length !== 1 ? "s" : ""} participado{contato.participacoes.length !== 1 ? "s" : ""}
              </p>
              <div className="mt-2">
                {contato.participacoes.length === 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Nenhum evento</span>
                )}
                {contato.participacoes.length === 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">Novo</span>
                )}
                {contato.participacoes.length >= 2 && contato.participacoes.length <= 3 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Regular</span>
                )}
                {contato.participacoes.length >= 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Frequente</span>
                )}
              </div>
            </CardContent>
          </Card>
          {(contato as { origem?: string | null }).origem && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Como conheceu</p>
                    <p className="text-sm font-medium text-gray-900">{(contato as { origem?: string | null }).origem}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histórico de eventos */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Histórico de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {contato.participacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Este contato não participou de nenhum evento ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {contato.participacoes.map((p) => (
                    <Link key={p.id} href={`/eventos/${p.event.id}`} className="block">
                      <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{p.event.nome}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatarData(p.event.data)}
                            </span>
                            {p.event.company && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                {p.event.company.nome}
                              </span>
                            )}
                            {p.event.local && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {p.event.local}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {p.event.tipo ?? "Evento"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetalheContatoPage;
