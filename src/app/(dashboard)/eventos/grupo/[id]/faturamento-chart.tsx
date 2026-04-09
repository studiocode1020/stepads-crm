"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type Edicao = {
  id: string;
  nome: string;
  faturamentoTotal: number;
};

const CORES = [
  "#534AB7", "#6366f1", "#818cf8", "#a5b4fc",
  "#10b981", "#34d399", "#6ee7b7",
  "#f59e0b", "#fbbf24", "#fcd34d",
  "#ef4444", "#f87171",
];

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const RADIAN = Math.PI / 180;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if ((percent ?? 0) < 0.05) return null;
  const radius = (innerRadius ?? 0) + ((outerRadius ?? 0) - (innerRadius ?? 0)) * 0.55;
  const x = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-0.5">{name}</p>
      <p className="text-primary font-bold">{moeda(value)}</p>
    </div>
  );
};

export function FaturamentoChart({
  edicoes,
  horizontal = false,
}: {
  edicoes: Edicao[];
  horizontal?: boolean;
}) {
  const dados = edicoes
    .filter((e) => e.faturamentoTotal > 0)
    .map((e) => ({ name: e.nome, value: e.faturamentoTotal }));

  const totalFaturamento = dados.reduce((acc, d) => acc + d.value, 0);

  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-8">
        Sem faturamento registrado nas edições
      </p>
    );
  }

  const chartHeight = horizontal ? 340 : 260;

  const legendaItemsVertical = dados.map((d, i) => {
    const pct = totalFaturamento > 0 ? ((d.value / totalFaturamento) * 100).toFixed(1) : "0";
    return (
      <div key={i} className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: CORES[i % CORES.length] }}
          />
          <span className="text-gray-700 truncate">{d.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-muted-foreground">{pct}%</span>
          <span className="font-medium text-gray-900">{moeda(d.value)}</span>
        </div>
      </div>
    );
  });

  if (horizontal) {
    return (
      <div className="flex items-center justify-center gap-8">
        {/* Gráfico — lado esquerdo */}
        <div className="relative flex-shrink-0" style={{ width: 280, height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="76%"
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
              >
                {dados.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Total central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold text-gray-900 leading-tight">
              {moeda(totalFaturamento)}
            </p>
          </div>
        </div>

        {/* Legenda — lado direito */}
        <div className="space-y-2.5">
          {dados.map((d, i) => {
            const pct = totalFaturamento > 0 ? ((d.value / totalFaturamento) * 100).toFixed(1) : "0";
            return (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CORES[i % CORES.length] }}
                />
                <span className="text-gray-700 max-w-[180px] truncate">{d.name}</span>
                <span className="text-muted-foreground whitespace-nowrap">{pct}%</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">{moeda(d.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Total no centro via posição absoluta simulada com wrapper */}
      <div className="relative w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
            >
              {dados.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Total central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {moeda(totalFaturamento)}
          </p>
        </div>
      </div>

      {/* Legenda manual */}
      <div className="w-full space-y-1.5">
        {legendaItemsVertical}
      </div>
    </div>
  );
}
