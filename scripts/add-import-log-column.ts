import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Adicionando coluna 'importLogId' na tabela contacts...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "importLogId" TEXT;
  `);
  console.log("✅ contacts.importLogId adicionado");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE contacts
    DROP CONSTRAINT IF EXISTS contacts_import_log_fk;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE contacts
    ADD CONSTRAINT contacts_import_log_fk
    FOREIGN KEY ("importLogId") REFERENCES import_logs(id) ON DELETE SET NULL;
  `);
  console.log("✅ Foreign key adicionada");
}

main()
  .then(() => { console.log("Concluído!"); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
