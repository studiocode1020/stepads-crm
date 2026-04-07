import { buscarContatos } from "@/lib/queries/contatos";
import { listarTodosEventos } from "@/lib/queries/eventos";
import { prisma } from "@/lib/prisma";
import { ContatosCliente } from "./contatos-cliente";

export const dynamic = "force-dynamic";

const ContatosPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string; eventoId?: string; tagId?: string }>;
}) => {
  const params = await searchParams;
  const pagina = Number(params.pagina ?? 1);
  const busca = params.busca ?? "";
  const eventoId = params.eventoId ?? "";
  const tagId = params.tagId ?? "";

  const [{ contatos, total, paginas }, eventos, tags] = await Promise.all([
    buscarContatos({ pagina, busca, eventoId, tagId }),
    listarTodosEventos(),
    prisma.tag.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-muted-foreground mt-1">{total.toLocaleString("pt-BR")} contatos cadastrados</p>
        </div>
      </div>
      <ContatosCliente
        contatos={contatos}
        total={total}
        paginas={paginas}
        paginaAtual={pagina}
        buscaInicial={busca}
        eventoIdInicial={eventoId}
        tagIdInicial={tagId}
        eventos={eventos}
        tags={tags}
      />
    </div>
  );
};

export default ContatosPage;
