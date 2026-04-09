# Como Continuar — Guia para a Próxima Conta

## Por onde começar

1. **Leia primeiro:** `HANDOFF.md` → `CHANGES_DONE.md` → `NEXT_STEPS.md` → `PRODUCT_RULES.md`
2. **Leia os arquivos privados:** `docs/handoff-private/ENV_PRIVATE.md` e `ACCESS_PRIVATE.md` para ter acesso operacional
3. **Inspecione o código:** os arquivos mais importantes são:
   - `prisma/schema.prisma` — modelo de dados completo
   - `src/lib/queries/contatos.ts` — queries consolidadas (incluindo SQL raw complexo)
   - `src/app/(dashboard)/contatos/contatos-cliente.tsx` — UI da aba Clientes
   - `src/app/(dashboard)/automacoes/automacoes-cliente.tsx` — UI da aba Automações
   - `src/components/shared/sidebar.tsx` — navegação

---

## Como validar localmente

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev
# Acessa: http://localhost:3000

# Inspecionar banco
npm run db:studio
# Abre Prisma Studio no browser

# Rodar um script de importação
npx tsx scripts/importar-oboe.ts
```

**Requisito:** o arquivo `.env.local` na raiz deve existir com `DATABASE_URL`, `NEXTAUTH_SECRET` e `NEXTAUTH_URL`. Ver `docs/handoff-private/ENV_PRIVATE.md`.

---

## Padrão obrigatório para qualquer código que use Prisma

```typescript
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") }); // SEMPRE .env.local

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
```

**Nunca usar `new PrismaClient()` sem o adapter** — o projeto usa o driver PG nativo e vai falhar sem ele.

---

## O que NÃO fazer sem autorização

1. **`git push origin main`** — nunca sem autorização explícita do usuário
2. **`prisma.QUALQUERCOISA.deleteMany({})`** — banco é produção real
3. **`$executeRaw` ou `$executeRawUnsafe`** com DDL/DELETE — sem confirmação
4. **Alterar o schema Prisma** e rodar `prisma migrate dev` — afeta banco de produção
5. **Fazer deploy manual** via Vercel CLI ou dashboard sem avisar o usuário

---

## Como lidar com alterações locais x produção

- **Código:** editar localmente → testar com `npm run dev` → commitar → perguntar ao usuário se pode fazer push
- **Schema:** editar `prisma/schema.prisma` → `npx prisma migrate dev --name nome-da-migration` → isso aplica em produção (Supabase) — **confirmar com o usuário antes**
- **Dados:** scripts em `scripts/` rodam localmente mas apontam para o banco de produção (Supabase) — **executar apenas com autorização**

---

## Quando parar e aguardar instrução

- Antes de qualquer push para `main`
- Antes de qualquer migração de schema
- Antes de executar scripts que modificam dados em produção
- Quando o usuário disser que vai enviar novas planilhas — aguardar o arquivo antes de criar o script
- Quando uma mudança funcional exigir decisão de produto que não está documentada

---

## Dicas técnicas importantes

### Query SQL dinâmica em contatos.ts
O arquivo `src/lib/queries/contatos.ts` usa `$queryRawUnsafe` com array de parâmetros posicionais. A lógica é:
- `filterParams` cresce dinamicamente com `.push(valor)`
- O índice do parâmetro é `$${filterParams.length}` no momento do push
- A query de count usa `filterParamsSnapshot` (cópia sem LIMIT/OFFSET)
- Se adicionar novos filtros, manter esse padrão rigorosamente

### Select do shadcn/ui retorna `string | null`
```typescript
// CORRETO — evita erro TypeScript
onValueChange={(v) => setState(v === "todos" ? "" : (v ?? ""))}

// ERRADO — TypeScript reclama
onValueChange={(v) => setState(v)}
```

### Next.js 16 — searchParams é uma Promise
```typescript
// Server Component — searchParams é Promise<{...}>
export default async function Page({ searchParams }: { searchParams: Promise<{busca?: string}> }) {
  const params = await searchParams;
  // ...
}
```

### Scripts de importação — parseValor
Para `"R$ 2.000,00"` (com separador de milhar):
```typescript
function parseValor(s: string): number | null {
  const cleaned = s.replace("R$", "").replace(/\s/g, "").replace(".", "").replace(",", ".");
  return isNaN(parseFloat(cleaned)) ? null : parseFloat(cleaned);
}
```
O `.replace(".", "")` remove o separador de milhar **antes** de converter vírgula em ponto.
