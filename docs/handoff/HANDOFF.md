# StepAds CRM — Handoff Geral

## O que é o projeto

**StepAds CRM** é um sistema de gestão de relacionamento com clientes voltado para **produtoras de eventos**. O objetivo é centralizar a base de público, cruzar participantes entre edições de eventos, e acionar campanhas de marketing (WhatsApp e e-mail) a partir de segmentações inteligentes.

O produto é interno — não é SaaS. Há login com autenticação, e o sistema é acessado pela equipe da produtora.

---

## Stack Principal

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.1 (App Router) — **não é Next.js 14/15 padrão** |
| Runtime | React 19 |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| ORM | Prisma v7 + `@prisma/adapter-pg` (driver PG nativo, obrigatório) |
| Banco de dados | Supabase (PostgreSQL, região sa-east-1) |
| Autenticação | NextAuth v5 beta (`next-auth@^5.0.0-beta.30`) |
| Deploy | Vercel (conectado ao GitHub) |
| Repositório | github.com/studiocode1020/stepads-crm |
| Ícones | lucide-react v1.6 |
| Charts | Recharts |
| Formulários | react-hook-form + zod |
| Toasts | sonner |
| Scripts | `npx tsx scripts/*.ts` |

> **ATENÇÃO:** Este projeto usa Next.js 16, não 14/15. Alguns padrões diferem do que Claude conhece por treino. Antes de escrever código Next.js, leia `node_modules/next/dist/docs/` conforme instruído no `AGENTS.md` do projeto.

---

## Objetivo do CRM

1. **Base unificada de clientes**: importação de planilhas CSV de cada evento, deduplicação por email/telefone, histórico de participações.
2. **Visão por evento**: cada evento tem um EventGroup (marca-mãe, ex: "Oboé") e edições anuais (ex: "Oboé Março 2025"). Clientes são vinculados via `EventParticipation`.
3. **Segmentação estratégica**: filtros por aniversário, ticket médio, número de eventos, origem, estado — para acionar campanhas.
4. **Automações de marketing**: sistema visual de regras (protótipo atual) para WhatsApp e e-mail. Integração real com disparador ainda não implementada.
5. **Relatórios**: visão consolidada de métricas por evento e por cliente.

---

## Contexto de uso

Cliente: produtora de eventos musicais (shows, festas de réveillon, etc.) na Bahia/Brasil. Público principal: jovens adultos. Canais de marketing: WhatsApp e Instagram. O CRM precisa ser simples, visual e direto — não é uma ferramenta técnica para o usuário final.

---

## Páginas Principais

| Rota | Nome na sidebar | Status |
|---|---|---|
| `/dashboard` | Dashboard | Funcional |
| `/eventos` | Eventos | Funcional |
| `/eventos/grupo/[id]` | Detalhe do Grupo | Funcional |
| `/eventos/[id]` | Detalhe do Evento | Funcional |
| `/contatos` | Clientes | Reescrito nesta sessão |
| `/contatos/[id]` | Detalhe do Cliente | Funcional (não alterado) |
| `/automacoes` | Automações | Reescrito nesta sessão (protótipo visual) |
| `/aniversariantes` | Aniversariantes | Funcional |
| `/importar` | Importar | Funcional |
| `/relatorios` | Relatórios | Funcional |
| `/empresas` | (removido da sidebar) | Arquivos existem, não navega |

---

## Estado Atual do Projeto (2026-04-09)

- Código commitado e em produção (último commit: `0d0c4f4`)
- Banco populado: **2.193 contatos**, eventos Oboé (Março + Dezembro 2025) + Réveillon Destino 2025
- Deploy: Vercel, branch `main` = produção
- Automações: **protótipo visual apenas** — nenhum disparo real acontece
- Importação: feita via scripts TypeScript locais (`scripts/`)
