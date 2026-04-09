# Alterações Realizadas — Histórico Completo

## Dashboard (`/dashboard`)

**Antes:** Cards genéricos sem contexto estratégico, sem link para detalhes.

**Alterado:**
- 4 cards estratégicos: Total de Clientes, Eventos Realizados, Ticket Médio, Aniversariantes do Mês
- Grid de eventos clicáveis com status visual (realizado, confirmado, planejamento)
- Card "Aniversariantes do Mês" com link para `/aniversariantes`
- Card "Evento Mais Popular" com contagem de participantes
- Ticket médio calculado a partir do campo real `valor_ticket` da `EventParticipation`

**Arquivo principal:** `src/app/(dashboard)/dashboard/`

---

## Eventos (`/eventos` e `/eventos/grupo/[id]`)

**Antes:** Lista plana de eventos sem hierarquia.

**Alterado:**
- Modelo **evento-mãe (EventGroup) + edições (Event)** — ex: "Oboé" é o grupo, "Oboé Março 2025" é a edição
- Página `/eventos` lista os grupos com card expansível mostrando edições
- Página `/eventos/grupo/[id]` mostra todas as edições de um grupo + participantes + métricas consolidadas
- Página `/eventos/[id]` mostra detalhe de uma edição específica com lista de participantes
- Schema: adicionado `EventGroup` com `edicoes Event[]`; `Event` tem `eventGroupId` opcional

**Arquivos principais:**
- `src/app/(dashboard)/eventos/`
- `src/app/(dashboard)/eventos/grupo/[id]/`
- `src/app/api/eventos/grupos/`

---

## Clientes — Aba Contatos (`/contatos`)

**Antes:** Tabela simples com nome, email, telefone, tags. Filtro por tag. Sem métricas consolidadas.

**Alterado (reescrita completa nesta sessão):**
- Renomeado "Contatos" → "Clientes" na sidebar
- **4 cards de métricas** no topo: Total de Clientes, Receita Total, Ticket Médio, Maior Ticket
- **Painel de filtros expansível** com 6 filtros:
  - Busca textual (nome/email/telefone)
  - Mês de aniversário (Select — Janeiro a Dezembro)
  - Número de eventos (min/max)
  - Origem de conversão (Select dinâmico)
  - Ticket médio (min/max)
  - Evento específico (Select de todos os eventos)
- **Tabela consolidada** com 10 colunas: checkbox, nome + email, aniversário, estado, gasto total, ticket médio, nº de eventos, tags de participação, última participação, origem
- **Seleção múltipla** com checkbox por linha (clique na linha também seleciona)
- **Barra de marketing**: aparece quando há contatos selecionados, botão "Enviar para Marketing" → navega para `/automacoes?contatos=id1,id2,...`
- Query de backend: `$queryRawUnsafe` com SQL dinâmico, HAVING para filtros de agregação, `json_agg` para participações

**Arquivos alterados:**
- `src/app/(dashboard)/contatos/page.tsx` — Server Component, passa filtros como props
- `src/app/(dashboard)/contatos/contatos-cliente.tsx` — Client Component, toda a UI
- `src/lib/queries/contatos.ts` — 3 novas funções: `buscarMetricasClientes`, `listarOrigensContatos`, `buscarClientesConsolidados`

---

## Automações (`/automacoes`)

**Antes:** Wizard de 3 etapas para disparo manual de WhatsApp: seleção de audiência → preview → confirmação. Integrado com API real de envio.

**Alterado (reescrita completa nesta sessão):**
- Substituído por **sistema visual de automações baseadas em regras** (protótipo — sem backend real)
- 4 modelos de automação pré-definidos:
  1. **Aniversariante do Mês** (rose) — gatilho: data de nascimento
  2. **Newsletter Mensal** (blue) — gatilho: periodicidade
  3. **Reativação de Inativos** (amber) — gatilho: +90 dias sem participação
  4. **Pré-Evento** (emerald) — gatilho: X dias antes de evento vinculado
- Cada automação tem status: `ativa`, `pausada`, `rascunho`
- **Visualização de detalhe** ao clicar num card (3 abas):
  - **Configuração**: gatilho, condição, evento vinculado (Select), oferta
  - **Audiência**: mock de contagem + 4 contatos de exemplo
  - **Mensagem**: textarea WhatsApp com preview de bolha + campo de e-mail quando aplicável
- Botões de ação: Salvar Rascunho, Pausar, Ativar — tudo em estado local + `toast.success()`
- **Banner de contatos pré-selecionados**: quando chegam de `/contatos?contatos=ids`, exibe banner no topo

**O que foi removido:** wizard de etapas, integração com API de disparo WhatsApp, seleção de audiência por tag/evento.

**O que permanece no backend (não alterado):**
- `src/app/api/automacoes/disparar/route.ts` — rota de disparo ainda existe
- `src/app/api/automacoes/validar/route.ts` — validação ainda existe
- `src/lib/whatsapp.ts` — cliente WhatsApp ainda existe

**Arquivos alterados:**
- `src/app/(dashboard)/automacoes/page.tsx` — Server Component, lê `searchParams.contatos`
- `src/app/(dashboard)/automacoes/automacoes-cliente.tsx` — Client Component, toda a UI nova
- `src/app/api/automacoes/contatos/route.ts` — adicionado suporte a `?ids=id1,id2,...`

---

## Sidebar

**Alterado:**
- Removido item "Empresas Parceiras" (href `/empresas`) da navegação
- Renomeado label "Contatos" → "Clientes"

**Arquivo:** `src/components/shared/sidebar.tsx`

**Nota:** Os arquivos de `/empresas` ainda existem no filesystem (`src/app/(dashboard)/empresas/`, `src/app/api/empresas/`) mas não há link de navegação.

---

## Banco de Dados — Limpeza e Importação

**Limpeza realizada:**
- Script `scripts/limpar-dados.ts` executado em produção
- Removidos: EventParticipation, ContactTag, ImportLog, Contact, Event, EventGroup, Company
- Preservados: users, accounts, sessions (auth), tags, whatsapp_campaigns

**Importações realizadas:**
- `scripts/importar-oboe.ts`: 3.200 linhas CSV → 2.175 contatos únicos, 3.198 participações (Oboé Março 2025 + Oboé Dezembro 2025)
- `scripts/importar-reveillon.ts`: 21 linhas CSV → 18 contatos novos + 3 já existentes, 21 participações (Réveillon Destino 2025)
- **Total atual no banco: 2.193 contatos**

---

## Schema Prisma — Alterações

- Adicionado model `EventGroup` com campos: `id`, `nome` (unique), `descricao`, `criadoEm`, `atualizadoEm`
- `Event` ganhou campo `eventGroupId String?` + relação `eventGroup EventGroup?`
- `EventParticipation` ganhou campos `tipoIngresso String?` e `valorTicket Float?`
- Schema aplicado via `prisma migrate` no Supabase produção
