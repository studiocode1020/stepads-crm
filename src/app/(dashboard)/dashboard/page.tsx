import { auth } from "@/lib/auth";
import { buscarMetricasDashboard, buscarContatosPorMes } from "@/lib/queries/dashboard";
import { DashboardCliente } from "./dashboard-cliente";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const sessao = await auth();
  const [metricas, contatosPorMes] = await Promise.all([
    buscarMetricasDashboard(),
    buscarContatosPorMes(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {sessao?.user?.name?.split(" ")[0] ?? "usuário"}!
        </p>
      </div>
      <DashboardCliente metricas={metricas} contatosPorMes={contatosPorMes} />
    </div>
  );
};

export default DashboardPage;
