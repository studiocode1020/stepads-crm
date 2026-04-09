# Próximos Passos

## Prioridade Alta — O que atacar primeiro

### 1. Automações — Integração Real
A aba de Automações é atualmente um **protótipo visual** sem backend. Os próximos passos são:
- Conectar os modelos de automação a uma fila de disparo real
- Implementar o modelo "Aniversariante do Mês" com cron job (envio no 1º dia de cada mês)
- Implementar o modelo "Pré-Evento" vinculado a um evento real do banco
- A infraestrutura de disparo WhatsApp já existe em `src/lib/whatsapp.ts` e `src/app/api/automacoes/disparar/route.ts` — pode ser reutilizada

### 2. Novas planilhas / importações
O usuário mencionou que enviará novas planilhas/tabelas. O fluxo esperado:
- Inspecionar estrutura da nova planilha (colunas podem variar)
- Adaptar ou criar novo script em `scripts/`
- Executar localmente com `npx tsx scripts/nome-do-script.ts`
- Verificar deduplicação (email → telefone → catch)

### 3. Detalhe do Cliente (`/contatos/[id]`)
- Página existe mas não foi atualizada para refletir o novo modelo consolidado
- Deve mostrar: histórico de participações (com EventGroup + edição), ticket por evento, tags, timeline

### 4. Relatórios (`/relatorios`)
- Página existe mas pode estar desatualizada com os novos campos (`valorTicket`, `EventGroup`)
- Verificar se os queries de relatório usam os campos corretos

### 5. Página de Empresas
- Os arquivos existem (`/empresas`) mas estão fora da navegação
- Decisão pendente: remover completamente os arquivos ou reintegrar com novo propósito

---

## Depende de Novas Planilhas / Tabelas do Usuário

- Qualquer nova importação de público de eventos
- Possível adição de campos novos no schema (ex: cidade separada de estado, CPF, Instagram)
- Possível novo EventGroup e edições futuras

---

## Pontos de Atenção para a Próxima Conta

1. **Nunca fazer push sem autorização explícita do usuário**
2. Automações são protótipo — não prometer funcionalidade real sem implementar
3. O banco é produção real no Supabase — qualquer `deleteMany` ou `$executeRaw` é irreversível
4. Scripts de importação devem ser testados localmente antes de executar em produção
5. `parseValor` no script de Réveillon tem `.replace(".", "")` extra para lidar com separador de milhar `"R$ 2.000,00"` — manter isso em futuros scripts
6. O `$queryRawUnsafe` em `src/lib/queries/contatos.ts` usa array de parâmetros posicionais (`$1, $2...`) — cuidado com a ordem ao adicionar novos filtros

---

## Sugestões de Melhorias Futuras (não urgentes)

- Paginação real na tabela de Clientes (atualmente LIMIT/OFFSET já está no backend, mas o frontend não tem botão de próxima página)
- Exportação CSV filtrada na aba Clientes
- Dashboard por EventGroup (ver performance de cada marca ao longo das edições)
- Notificações de aniversariantes por WhatsApp (automação prioritária)
