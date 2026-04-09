import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listarOrigensContatos } from "@/lib/queries/contatos";
import { listarTodosEventos, listarGruposEvento } from "@/lib/queries/eventos";
import MarketingCliente from "./marketing-cliente";

export const metadata = { title: "Mensagens de Marketing — StepAds CRM" };

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ contatos?: string; origem?: string }>;
}) {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const params = await searchParams;
  const contatosParam = params.contatos ?? "";
  const origemParam   = params.origem   ?? "";

  const [origens, eventos, grupos] = await Promise.all([
    listarOrigensContatos(),
    listarTodosEventos(),
    listarGruposEvento(),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens de Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monte o público, escolha o canal e dispare sua campanha.
        </p>
      </div>

      <MarketingCliente
        contatosParam={contatosParam}
        origemParam={origemParam}
        origens={origens}
        eventos={eventos}
        grupos={grupos}
      />
    </div>
  );
}
