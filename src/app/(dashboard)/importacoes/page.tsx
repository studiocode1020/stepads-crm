import Link from "next/link";
import { ArrowLeft, FileUp, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listarImportacoes } from "@/lib/queries/importacoes";
import { formatarDataHora } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ImportacoesPage = async () => {
  const importacoes = await listarImportacoes();

  return (
    <div className="p-8 max-w-4xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <FileUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Importações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {importacoes.length} importação{importacoes.length !== 1 ? "ões" : ""} registrada{importacoes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {importacoes.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileUp className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm">Nenhuma importação realizada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {importacoes.map((imp) => (
            <Link key={imp.id} href={`/importacoes/${imp.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-gray-50 text-gray-400 flex-shrink-0">
                      <FileUp className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{imp.nomeArquivo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatarDataHora(imp.criadoEm)}
                        </span>
                        {imp.event && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {imp.event.nome}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {imp.novosContatos} novos
                      </Badge>
                      {imp.duplicados > 0 && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-0 text-xs">
                          {imp.duplicados} dup.
                        </Badge>
                      )}
                      {imp.erros > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {imp.erros} erros
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportacoesPage;
