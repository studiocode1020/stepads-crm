# Decisões de Produto — Regras Consolidadas

## Modelo de Dados: Evento-Mãe + Edições

- **EventGroup** = marca do evento (ex: "Oboé", "Réveillon Destino")
- **Event** = edição anual ou específica (ex: "Oboé Março 2025", "Réveillon Destino 2025")
- Um contato pode participar de múltiplas edições do mesmo grupo
- A página do grupo mostra métricas consolidadas de todas as edições
- Esta hierarquia é **obrigatória** — nunca criar Event sem EventGroup

## Home / Dashboard

- 4 cards estratégicos: clientes, eventos, ticket médio, aniversariantes do mês
- Grid de eventos com status visual
- Os eventos exibidos são as **edições** (Events), não os grupos
- Clique no evento navega para `/eventos/[id]` (detalhe da edição)

## Aba Clientes (`/contatos`)

- Exibida como "Clientes" na sidebar (não "Contatos")
- Visão consolidada: um cliente = uma linha com métricas de toda sua história
- Filtros por agregação (ticket médio, nº de eventos) são feitos no banco com HAVING — não no frontend
- Seleção múltipla + "Enviar para Marketing" é a ponte entre Clientes e Automações
- Tags de participação exibidas na tabela = nomes dos eventos em que o cliente participou (não tags manuais)
- Paginação: backend já tem LIMIT/OFFSET, frontend ainda não tem controle de página

## Aba Automações (`/automacoes`)

- **É um protótipo visual** — nenhuma automação dispara de verdade
- O objetivo atual é mostrar a interface e o conceito do produto
- Status (ativa/pausada/rascunho) é salvo apenas em estado local React — não persiste no banco
- A integração real com disparo será feita posteriormente
- Contatos pré-selecionados de Clientes chegam via `?contatos=id1,id2,...` na URL
- Os 4 modelos são fixos no frontend — não vêm do banco

## O que foi Removido

- **"Empresas Parceiras"**: removido da sidebar. Arquivos existem mas não são acessíveis pela navegação. Pendente decisão final de remoção
- **Wizard de disparo WhatsApp**: substituído pelo sistema visual de regras. A infraestrutura de backend (rotas de disparo) ainda existe mas não é mais chamada pelo frontend atual
- **Filtro por tag** na aba Clientes: substituído por filtros mais ricos (aniversário, ticket, eventos, origem)

## O que Precisa ser Mantido

- `EventGroup` sempre precede `Event` — sem eventos órfãos
- Deduplicação de contatos: email primeiro, telefone como fallback, nunca criar duplicata
- `@prisma/adapter-pg` é obrigatório em todas as instâncias do PrismaClient (incluindo scripts)
- `.env.local` (não `.env`) — dotenv deve sempre apontar para esse arquivo
- Nunca fazer push para `main` sem autorização explícita do usuário
