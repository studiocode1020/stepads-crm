# Contexto de Dados — Banco e Modelo

## Entidades Principais

### Contact
- Representa um cliente final (pessoa física)
- Campos: `nome`, `email` (unique), `telefone` (unique), `dataNascimento`, `genero`, `estado`, `origem`, `observacoes`
- Deduplicação: email é a chave primária de dedup; telefone é fallback
- Relacionamentos: N participações, N tags

### EventGroup
- Marca/série de evento (ex: "Oboé", "Réveillon Destino")
- Campo `nome` é UNIQUE
- Relacionamento: N Events (edições)

### Event
- Edição específica de um grupo (ex: "Oboé Março 2025")
- Campos: `nome`, `data`, `local`, `tipo`, `status`, `capacidade`, `orcamento`, `eventGroupId`
- Status possíveis: `planejamento`, `confirmado`, `realizado`
- Relacionamentos: pertence a 1 EventGroup, N EventParticipations, N ImportLogs

### EventParticipation
- Vínculo entre Contact e Event (muitos-para-muitos com dados extras)
- Campos: `contactId`, `eventId`, `tipoIngresso`, `valorTicket`
- UNIQUE em `(contactId, eventId)` — um contato não pode ter duas participações no mesmo evento
- `valorTicket` é usado para calcular ticket médio e receita total

### Tag + ContactTag
- Tags manuais (ex: "VIP", "Influencer") associadas a contatos
- Foram **preservadas** na limpeza do banco
- Atualmente não há interface para criar/atribuir tags (a UI da aba Clientes exibe apenas as participações como "tags")

### WhatsappCampaign + WhatsappCampaignContact
- Histórico de campanhas de disparo
- **Preservados** na limpeza
- A aba de Automações atual não cria mais registros nessas tabelas

---

## Estado Atual do Banco (2026-04-09)

| Entidade | Quantidade |
|---|---|
| Contact | 2.193 |
| EventGroup | 2 ("Oboé", "Réveillon Destino") |
| Event | 3 ("Oboé Março 2025", "Oboé Dezembro 2025", "Réveillon Destino 2025") |
| EventParticipation | ~3.219 |
| Tag | Preservadas (quantidade não contada) |
| WhatsappCampaign | Preservadas |

---

## O que foi Limpo

Script `scripts/limpar-dados.ts` executou em produção:
- Deletou: EventParticipation, ContactTag, ImportLog, Contact, Event, EventGroup, Company
- Preservou: User, Account, Session (auth), Tag, WhatsappCampaign, WhatsappCampaignContact

---

## Importações Realizadas

### Oboé (scripts/importar-oboe.ts)
- Arquivo 1: `Oboe_2025_marco_base.csv` (~1.600 linhas) → Event "Oboé Março 2025" (10/03/2025)
- Arquivo 2: `Oboe_2025_dezembro_base.csv` (~1.600 linhas) → Event "Oboé Dezembro 2025" (10/12/2025)
- ~1.023 contatos aparecem nos dois eventos (frequentadores recorrentes)
- Resultado: 2.175 contatos únicos, 3.198 participações

### Réveillon Destino (scripts/importar-reveillon.ts)
- Arquivo: `Reveillon_Destino_2025.csv` (21 linhas) → Event "Réveillon Destino 2025" (31/12/2025)
- 18 contatos novos, 3 já existiam (sobreposição com Oboé)
- 21 participações criadas

---

## Colunas dos CSVs de Importação

Estrutura padrão esperada pelos scripts:
```
nome_cliente, email, telefone, genero, estado, origem_conversao, data_nascimento, tipo_ingresso, valor_ticket
```
- `data_nascimento`: formato `DD/MM/YYYY`
- `valor_ticket`: formato `R$ 120,00` ou `R$ 2.000,00` (com separador de milhar)

---

## Cuidados com Integridade Relacional

1. **Nunca deletar EventGroup** sem antes deletar Events e EventParticipations filhos
2. **Nunca deletar Contact** diretamente se tiver participações — o schema tem `onDelete: Cascade` em EventParticipation, mas ContactTag também precisa ser limpo
3. O script `limpar-dados.ts` já tem a ordem correta de deleção
4. **UNIQUE constraint em `(contactId, eventId)`** — re-importar o mesmo CSV vai gerar erros silenciosos (capturados em `catch`) sem criar duplicatas
5. Email e telefone são UNIQUE em Contact — dois CSVs com o mesmo cliente serão deduplicados corretamente
