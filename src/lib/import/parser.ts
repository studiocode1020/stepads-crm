import * as XLSX from "xlsx";

export type LinhaImportada = Record<string, string>;

export const parseArquivo = (buffer: Buffer): { colunas: string[]; linhas: LinhaImportada[] } => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const planilha = workbook.Sheets[workbook.SheetNames[0]];
  const dados = XLSX.utils.sheet_to_json<LinhaImportada>(planilha, {
    defval: "",
    raw: false,
  });

  if (dados.length === 0) return { colunas: [], linhas: [] };

  const colunas = Object.keys(dados[0]);
  return { colunas, linhas: dados };
};

export type MapeamentoColunas = {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  observacoes?: string;
};

export type ContatoImportado = {
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
  observacoes?: string;
};

export const mapearContatos = (
  linhas: LinhaImportada[],
  mapeamento: Record<string, string>
): ContatoImportado[] => {
  const result: ContatoImportado[] = [];

  for (const linha of linhas) {
    const nomeCol = Object.entries(mapeamento).find(([, v]) => v === "nome")?.[0];
    if (!nomeCol) continue;
    const nome = (linha[nomeCol] ?? "").trim();
    if (!nome) continue;

    const emailCol = Object.entries(mapeamento).find(([, v]) => v === "email")?.[0];
    const telefoneCol = Object.entries(mapeamento).find(([, v]) => v === "telefone")?.[0];
    const nascCol = Object.entries(mapeamento).find(([, v]) => v === "dataNascimento")?.[0];
    const obsCol = Object.entries(mapeamento).find(([, v]) => v === "observacoes")?.[0];

    const email = emailCol ? (linha[emailCol] ?? "").trim() || undefined : undefined;
    const telefone = telefoneCol ? (linha[telefoneCol] ?? "").trim() || undefined : undefined;
    const observacoes = obsCol ? (linha[obsCol] ?? "").trim() || undefined : undefined;

    let dataNascimento: Date | undefined;
    if (nascCol) {
      const raw = (linha[nascCol] ?? "").trim();
      if (raw) {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) dataNascimento = parsed;
      }
    }

    result.push({ nome, email, telefone, dataNascimento, observacoes });
  }

  return result;
};
