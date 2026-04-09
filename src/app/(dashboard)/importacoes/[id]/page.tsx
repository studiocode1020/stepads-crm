import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buscarImportacaoPorId } from "@/lib/queries/importacoes";
import { formatarData, formatarDataHora } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DetalheImportacaoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const imp = await buscarImportacaoPorId(id);

  if (!imp) notFound();

  const totalContatos = imp.contatos.length;

  return (
    <div className="p-8 max-w-5xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/importacoes">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Importações
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <FileUp className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{imp.nomeArquivo}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importado em {formatarDataHora(imp.criadoEm)}
            {imp.event && (
              <>
                {" · "}
                <Link href={`/eventos/${imp.event.id}`} className="text-primary hover:underline">
                  {imp.event.nome}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{imp.totalLinhas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Linhas processadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{imp.novosContatos}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Novos contatos</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{imp.duplicados}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Duplicados</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{imp.erros}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Erros</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de contatos */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos desta importação
              <Badge variant="secondary" className="text-xs font-normal">
                {totalContatos}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {totalContatos === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-10">
              Nenhum contato novo registrado nesta importação
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Gênero</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imp.contatos.map((c) => (
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
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.telefone ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {c.genero ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.estado ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatarData(c.criadoEm)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalheImportacaoPage;
