"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Props = {
  contatosPorEvento: { nome: string; total: number }[];
  crescimentoPorMes: { mes: string; total: number }[];
  topContatos: { id: string; nome: string; email: string | null; totalEventos: number }[];
};

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CORES_GRAFICO = ["#534AB7", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF", "#6366F1", "#4F46E5", "#7C3AED", "#8B5CF6", "#A78BFA"];

const formatarMes = (mes: string) => {
  const [, m] = mes.split("-");
  return MESES_PT[Number(m) - 1] ?? mes;
};

const CustomTooltipPie = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg shadow-sm p-2.5 text-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} contatos</p>
    </div>
  );
};

export const RelatoriosCliente = ({ contatosPorEvento, crescimentoPorMes, topContatos }: Props) => {
  const dadosCrescimento = crescimentoPorMes.map((d) => ({
    mes: formatarMes(d.mes),
    contatos: d.total,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de pizza - contatos por evento */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Contatos por Evento</CardTitle>
            <CardDescription>Distribuição de participantes nos eventos</CardDescription>
          </CardHeader>
          <CardContent>
            {contatosPorEvento.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={contatosPorEvento}
                    dataKey="total"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {contatosPorEvento.map((_, i) => (
                      <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-700">{String(value).length > 25 ? String(value).slice(0, 25) + "…" : value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - crescimento */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Crescimento da Base</CardTitle>
            <CardDescription>Novos contatos por mês (últimos 12 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosCrescimento.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dadosCrescimento} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v) => [v, "Contatos"]}
                  />
                  <Bar dataKey="contatos" fill="#534AB7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 contatos */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top 10 Contatos Mais Frequentes</CardTitle>
          <CardDescription>Contatos com mais participações em eventos</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="pl-6">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Eventos Participados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topContatos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Sem dados disponíveis
                  </TableCell>
                </TableRow>
              )}
              {topContatos.map((c, i) => (
                <TableRow key={c.id} className="hover:bg-gray-50/50">
                  <TableCell className="pl-6 text-muted-foreground font-medium">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={`/contatos/${c.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                      {c.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className="text-xs font-semibold"
                      style={{ backgroundColor: i === 0 ? "#534AB7" : i < 3 ? "#818CF8" : undefined }}
                    >
                      {c.totalEventos} evento{c.totalEventos !== 1 ? "s" : ""}
                    </Badge>
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
