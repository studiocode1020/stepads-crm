import Link from "next/link";
import { ArrowLeft, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buscarAniversariantesDoMes } from "@/lib/queries/dashboard";
import { calcularIdade, formatarData } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const AniversariantesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) => {
  const params = await searchParams;
  const mesAtual = new Date().getMonth() + 1;
  const mes = Math.min(12, Math.max(1, Number(params.mes ?? mesAtual)));
  const nomeMes = MESES[mes - 1];

  const aniversariantes = await buscarAniversariantesDoMes(mes);

  return (
    <div className="p-8 max-w-5xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Dashboard
        </Link>
      </Button>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <Cake className="w-5 h-5 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Aniversariantes</h1>
            <Badge className="bg-rose-100 text-rose-800 border-0">{nomeMes}</Badge>
          </div>
          <p className="text-muted-foreground ml-12">
            {aniversariantes.length} contato{aniversariantes.length !== 1 ? "s" : ""} fazem
            aniversário em {nomeMes}
          </p>
        </div>

        {/* Seletor de mês */}
        <div className="flex flex-wrap gap-1.5">
          {MESES.map((nome, idx) => {
            const numMes = idx + 1;
            const ativo = numMes === mes;
            return (
              <Link
                key={numMes}
                href={`/aniversariantes?mes=${numMes}`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  ativo
                    ? "bg-primary text-white border-primary"
                    : "text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                }`}
              >
                {nome.slice(0, 3)}
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Lista de Aniversariantes — {nomeMes}</CardTitle>
          <CardDescription>Ordenado por dia do aniversário</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Nome</TableHead>
                <TableHead>Aniversário</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-center">Eventos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aniversariantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Nenhum aniversariante em {nomeMes}
                  </TableCell>
                </TableRow>
              ) : (
                aniversariantes.map((c) => {
                  const idade = calcularIdade(c.dataNascimento);
                  return (
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
                        {formatarData(c.dataNascimento)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {idade !== null ? `${idade} anos` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.telefone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {c.totalEventos}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AniversariantesPage;
