import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Adicionando coluna 'ordem' nas tabelas event_groups e events...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE event_groups ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
  `);
  console.log("✅ event_groups.ordem adicionado");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
  `);
  console.log("✅ events.ordem adicionado");

  console.log("Concluído!");
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
