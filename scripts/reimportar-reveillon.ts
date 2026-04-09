/**
 * Remove os eventos existentes do EventGroup "Réveillon Destino"
 * e reimporta a partir dos dois CSVs sem acento:
 *   - Reveillon_Destino_2024_sem_acento.csv  (1000 linhas)
 *   - Reveillon_Destino_2025_sem_acento.csv  (2000 linhas)
 *
 * Execução: npx tsx scripts/reimportar-reveillon.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL não configurada");

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function parseCSV(filepath: string): Record<string, string>[] {
  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? "").trim()]));
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseBRDate(s: string): Date | null {
  if (!s) return null;
  const [day, month, year] = s.split("/");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

function parseValor(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace("R$", "").replace(/\s/g, "").replace(".", "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ─── Importação de um arquivo ────────────────────────────────────────────────

async function importarArquivo(
  rows: Record<string, string>[],
  eventoId: string
) {
  let novosContatos = 0;
  let contatosExistentes = 0;
  let novasParticipacoes = 0;
  let dupParticipacao = 0;

  for (const row of rows) {
    const nome = row["nome_cliente"]?.trim();
    const email = row["email"]?.trim().toLowerCase() || null;
    const telefone = row["telefone"]?.trim() || null;
    const genero = row["genero"]?.trim() || null;
    const estado = row["estado"]?.trim() || null;
    const origem = row["origem_conversao"]?.trim() || null;
    const dataNascimento = parseBRDate(row["data_nascimento"]);
    const tipoIngresso = row["tipo_ingresso"]?.trim() || null;
    const valorTicket = parseValor(row["valor_ticket"]);

    if (!nome) continue;

    let contato = null;
    if (email) contato = await prisma.contact.findUnique({ where: { email } });
    if (!contato && telefone) contato = await prisma.contact.findUnique({ where: { telefone } });

    if (!contato) {
      try {
        contato = await prisma.contact.create({
          data: { nome, email, telefone, genero, estado, origem, dataNascimento },
        });
        novosContatos++;
      } catch {
        if (email) contato = await prisma.contact.findUnique({ where: { email } });
        if (!contato && telefone) contato = await prisma.contact.findUnique({ where: { telefone } });
        if (!contato) continue;
        contatosExistentes++;
      }
    } else {
      // Atualiza campos NULL com dados do CSV (não sobrescreve dados existentes)
      const updateData: Record<string, unknown> = {};
      if (!contato.genero && genero) updateData.genero = genero;
      if (!contato.estado && estado) updateData.estado = estado;
      if (!contato.origem && origem) updateData.origem = origem;
      if (!contato.dataNascimento && dataNascimento) updateData.dataNascimento = dataNascimento;
      if (Object.keys(updateData).length > 0) {
        contato = await prisma.contact.update({ where: { id: contato.id }, data: updateData });
      }
      contatosExistentes++;
    }

    try {
      await prisma.eventParticipation.create({
        data: { contactId: contato.id, eventId: eventoId, tipoIngresso, valorTicket },
      });
      novasParticipacoes++;
    } catch {
      dupParticipacao++;
    }
  }

  return { novosContatos, contatosExistentes, novasParticipacoes, dupParticipacao };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function reimportar() {
  console.log("🎆 Reimportação Réveillon Destino — início\n");

  // 1. Encontrar ou criar EventGroup
  let grupo = await prisma.eventGroup.findFirst({ where: { nome: "Réveillon Destino" } });
  if (!grupo) {
    grupo = await prisma.eventGroup.create({
      data: { nome: "Réveillon Destino", descricao: "Réveillon Destino — edições anuais" },
    });
    console.log(`✅ EventGroup criado: "${grupo.nome}" (${grupo.id})`);
  } else {
    console.log(`ℹ️  EventGroup encontrado: "${grupo.nome}" (${grupo.id})`);
  }

  // 2. Remover eventos existentes do grupo (participações são deletadas em cascade)
  const eventosExistentes = await prisma.event.findMany({
    where: { eventGroupId: grupo.id },
    select: { id: true, nome: true },
  });

  if (eventosExistentes.length > 0) {
    for (const ev of eventosExistentes) {
      const deletadas = await prisma.eventParticipation.deleteMany({ where: { eventId: ev.id } });
      await prisma.event.delete({ where: { id: ev.id } });
      console.log(`🗑️  Removido: "${ev.nome}" (${deletadas.count} participações)`);
    }
  } else {
    console.log("ℹ️  Nenhum evento anterior encontrado no grupo");
  }

  // 3. Criar eventos novos
  const evento2024 = await prisma.event.create({
    data: {
      nome: "Réveillon Destino 2024",
      data: new Date(2024, 11, 27, 22, 0, 0), // 27/12/2024
      eventGroupId: grupo.id,
      status: "realizado",
      tipo: "Réveillon",
    },
  });
  console.log(`\n✅ Event criado: "${evento2024.nome}"`);

  const evento2025 = await prisma.event.create({
    data: {
      nome: "Réveillon Destino 2025",
      data: new Date(2025, 11, 31, 22, 0, 0), // 31/12/2025
      eventGroupId: grupo.id,
      status: "confirmado",
      tipo: "Réveillon",
    },
  });
  console.log(`✅ Event criado: "${evento2025.nome}"`);

  // 4. Importar 2024
  const BASE_PATH = "c:/Users/User/OneDrive/Desktop/step-crm";
  console.log("\n📂 Processando: Réveillon Destino 2024");
  const rows2024 = parseCSV(`${BASE_PATH}/Reveillon_Destino_2024_sem_acento.csv`);
  console.log(`   ${rows2024.length} linhas encontradas`);
  const r2024 = await importarArquivo(rows2024, evento2024.id);
  console.log(`   ➕ Contatos novos    : ${r2024.novosContatos}`);
  console.log(`   ↩️  Já existentes     : ${r2024.contatosExistentes}`);
  console.log(`   🎟️  Participações     : ${r2024.novasParticipacoes}`);
  if (r2024.dupParticipacao > 0) console.log(`   ⚠️  Duplicadas       : ${r2024.dupParticipacao}`);

  // 5. Importar 2025
  console.log("\n📂 Processando: Réveillon Destino 2025");
  const rows2025 = parseCSV(`${BASE_PATH}/Reveillon_Destino_2025_sem_acento.csv`);
  console.log(`   ${rows2025.length} linhas encontradas`);
  const r2025 = await importarArquivo(rows2025, evento2025.id);
  console.log(`   ➕ Contatos novos    : ${r2025.novosContatos}`);
  console.log(`   ↩️  Já existentes     : ${r2025.contatosExistentes}`);
  console.log(`   🎟️  Participações     : ${r2025.novasParticipacoes}`);
  if (r2025.dupParticipacao > 0) console.log(`   ⚠️  Duplicadas       : ${r2025.dupParticipacao}`);

  // 6. Totais
  const totalContatosDB = await prisma.contact.count();
  console.log("\n═══════════════════════════════════════");
  console.log("✅ Reimportação concluída");
  console.log(`   Contatos novos (total)  : ${r2024.novosContatos + r2025.novosContatos}`);
  console.log(`   Participações criadas   : ${r2024.novasParticipacoes + r2025.novasParticipacoes}`);
  console.log(`   Total de contatos no DB : ${totalContatosDB}`);
  console.log("═══════════════════════════════════════");
}

reimportar()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
