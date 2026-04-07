import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@stepads.com.br" },
    update: {},
    create: { name: "Admin StepAds", email: "admin@stepads.com.br", password: hash },
  });

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { nome: "VIP" }, update: {}, create: { nome: "VIP", cor: "#F59E0B" } }),
    prisma.tag.upsert({ where: { nome: "Palestrante" }, update: {}, create: { nome: "Palestrante", cor: "#10B981" } }),
    prisma.tag.upsert({ where: { nome: "Fornecedor" }, update: {}, create: { nome: "Fornecedor", cor: "#6366F1" } }),
    prisma.tag.upsert({ where: { nome: "Patrocinador" }, update: {}, create: { nome: "Patrocinador", cor: "#EC4899" } }),
    prisma.tag.upsert({ where: { nome: "Convidado" }, update: {}, create: { nome: "Convidado", cor: "#14B8A6" } }),
  ]);

  // Empresas
  const empresas = await Promise.all([
    prisma.company.upsert({ where: { cnpj: "12.345.678/0001-90" }, update: {}, create: { nome: "Prefeitura de São Paulo", cnpj: "12.345.678/0001-90", email: "eventos@sp.gov.br", telefone: "(11) 3333-4444" } }),
    prisma.company.upsert({ where: { cnpj: "98.765.432/0001-10" }, update: {}, create: { nome: "Instituto Marketing Digital", cnpj: "98.765.432/0001-10", email: "contato@imd.com.br", telefone: "(11) 9999-8888", site: "www.imd.com.br" } }),
    prisma.company.upsert({ where: { cnpj: "55.444.333/0001-22" }, update: {}, create: { nome: "Espaço Cultural Nordeste", cnpj: "55.444.333/0001-22", email: "cultura@ecnordeste.com.br", telefone: "(81) 3232-5555" } }),
  ]);

  // Eventos
  const eventos = await Promise.all([
    prisma.event.upsert({ where: { id: "evento-festa-junina-2024" }, update: {}, create: { id: "evento-festa-junina-2024", nome: "Festa Junina 2024", data: new Date("2024-06-15T18:00:00Z"), local: "Parque da Juventude, São Paulo", tipo: "Cultural", descricao: "Grande festa junina com shows ao vivo.", companyId: empresas[0].id } }),
    prisma.event.upsert({ where: { id: "evento-workshop-marketing-2024" }, update: {}, create: { id: "evento-workshop-marketing-2024", nome: "Workshop Marketing Digital 2024", data: new Date("2024-08-20T09:00:00Z"), local: "Centro de Convenções Rebouças, São Paulo", tipo: "Educacional", descricao: "Workshop intensivo sobre tráfego pago.", companyId: empresas[1].id } }),
    prisma.event.upsert({ where: { id: "evento-conferencia-ecommerce-2024" }, update: {}, create: { id: "evento-conferencia-ecommerce-2024", nome: "Conferência E-commerce Brasil 2024", data: new Date("2024-10-10T08:00:00Z"), local: "Expo Center Norte, São Paulo", tipo: "Conferência", descricao: "Maior conferência de e-commerce da América Latina.", companyId: empresas[1].id } }),
    prisma.event.upsert({ where: { id: "evento-festa-junina-nordeste-2024" }, update: {}, create: { id: "evento-festa-junina-nordeste-2024", nome: "São João do Nordeste 2024", data: new Date("2024-06-23T20:00:00Z"), local: "Campina Grande, Paraíba", tipo: "Cultural", descricao: "A maior festa junina do mundo!", companyId: empresas[2].id } }),
    prisma.event.upsert({ where: { id: "evento-webinar-trafego-2025" }, update: {}, create: { id: "evento-webinar-trafego-2025", nome: "Webinar Tráfego Pago 2025", data: new Date("2025-02-14T19:00:00Z"), local: "Online", tipo: "Webinar", descricao: "Estratégias avançadas de tráfego pago.", companyId: empresas[1].id } }),
  ]);

  // Contatos
  const contatosData = [
    { nome: "Ana Clara Oliveira", email: "anaclara@gmail.com", telefone: "(11) 98765-4321", dataNascimento: new Date("1990-03-15") },
    { nome: "Bruno Ferreira Santos", email: "brunofsantos@hotmail.com", telefone: "(11) 97654-3210", dataNascimento: new Date("1985-07-22") },
    { nome: "Carla Mendes Costa", email: "carlacosta@gmail.com", telefone: "(21) 96543-2109", dataNascimento: new Date("1992-11-08") },
    { nome: "Daniel Lima Rodrigues", email: "dlima.rodrigues@outlook.com", telefone: "(11) 95432-1098", dataNascimento: new Date("1988-04-30") },
    { nome: "Eduarda Pereira Alves", email: "eduarda.alves@gmail.com", telefone: "(31) 94321-0987", dataNascimento: new Date("1995-09-12") },
    { nome: "Felipe Souza Martins", email: "felipesm@gmail.com", telefone: "(11) 93210-9876", dataNascimento: new Date("1987-01-25") },
    { nome: "Gabriela Torres Nunes", email: "gabitorres@gmail.com", telefone: "(41) 92109-8765", dataNascimento: new Date("1993-06-18") },
    { nome: "Henrique Barbosa Lima", email: "hblima@gmail.com", telefone: "(11) 91098-7654", dataNascimento: new Date("1980-12-05") },
    { nome: "Isabella Carvalho Dias", email: "isacarvalho@gmail.com", telefone: "(85) 90987-6543", dataNascimento: new Date("1997-08-27") },
    { nome: "João Pedro Nascimento", email: "joaopnascimento@gmail.com", telefone: "(11) 99876-5432", dataNascimento: new Date("1991-02-14") },
    { nome: "Larissa Gomes Ribeiro", email: "larisribeiro@hotmail.com", telefone: "(21) 98765-4322", dataNascimento: new Date("1989-05-19") },
    { nome: "Marcos Vinícius Araújo", email: "mvaraujo@gmail.com", telefone: "(11) 97654-3211", dataNascimento: new Date("1986-10-31") },
    { nome: "Natália Campos Moreira", email: "natcampos@gmail.com", telefone: "(51) 96543-2108", dataNascimento: new Date("1994-03-07") },
    { nome: "Otávio Silveira Pinto", email: "otaviopinto@gmail.com", telefone: "(11) 95432-1097", dataNascimento: new Date("1982-07-16") },
    { nome: "Patrícia Rocha Freitas", email: "patriciafreitas@gmail.com", telefone: "(81) 94321-0986", dataNascimento: new Date("1996-11-23") },
    { nome: "Rafael Monteiro Cruz", email: "rafaelcruz@gmail.com", telefone: "(11) 93210-9875", dataNascimento: new Date("1990-04-02") },
    { nome: "Sabrina Lopes Azevedo", email: "sabrinazevedo@gmail.com", telefone: "(31) 92109-8764", dataNascimento: new Date("1993-08-14") },
    { nome: "Thiago Andrade Melo", email: "thiagomelo@gmail.com", telefone: "(11) 91098-7653", dataNascimento: new Date("1984-12-28") },
    { nome: "Vanessa Cunha Teixeira", email: "vanessateixeira@gmail.com", telefone: "(71) 90987-6542", dataNascimento: new Date("1998-01-09") },
    { nome: "William Correia Batista", email: "williamcorreia@gmail.com", telefone: "(11) 99876-5431", dataNascimento: new Date("1987-06-20") },
    { nome: "Fernanda Ramos Vieira", email: "fernandaramos@gmail.com", telefone: "(21) 98765-4320", dataNascimento: new Date("1991-09-03") },
    { nome: "Carlos Alberto Sousa", email: "carlossousa@gmail.com", telefone: "(11) 97654-3209", dataNascimento: new Date("1979-03-25") },
    { nome: "Juliana Neves Cardoso", email: "julianacardoso@gmail.com", telefone: "(41) 96543-2107", dataNascimento: new Date("1995-07-11") },
    { nome: "Leonardo Pires Magalhães", email: "leopires@gmail.com", telefone: "(11) 95432-1096", dataNascimento: new Date("1988-02-17") },
    { nome: "Mariana Fonseca Medeiros", email: "marianafonseca@gmail.com", telefone: "(85) 94321-0985", dataNascimento: new Date("1992-10-29") },
  ];

  const contatos = [];
  for (const dados of contatosData) {
    const c = await prisma.contact.upsert({ where: { email: dados.email }, update: {}, create: dados });
    contatos.push(c);
  }

  // Participações
  const participacoes = [
    {ci:0,ei:0},{ci:1,ei:0},{ci:2,ei:0},{ci:3,ei:0},{ci:4,ei:0},{ci:5,ei:0},{ci:6,ei:0},{ci:7,ei:0},{ci:8,ei:0},{ci:9,ei:0},
    {ci:5,ei:1},{ci:6,ei:1},{ci:9,ei:1},{ci:10,ei:1},{ci:11,ei:1},{ci:12,ei:1},{ci:13,ei:1},{ci:14,ei:1},
    {ci:11,ei:2},{ci:12,ei:2},{ci:15,ei:2},{ci:16,ei:2},{ci:17,ei:2},{ci:18,ei:2},{ci:19,ei:2},{ci:20,ei:2},
    {ci:0,ei:3},{ci:2,ei:3},{ci:21,ei:3},{ci:22,ei:3},{ci:23,ei:3},
    {ci:5,ei:4},{ci:9,ei:4},{ci:11,ei:4},{ci:12,ei:4},{ci:24,ei:4},
  ];
  for (const p of participacoes) {
    await prisma.eventParticipation.upsert({
      where: { contactId_eventId: { contactId: contatos[p.ci].id, eventId: eventos[p.ei].id } },
      update: {},
      create: { contactId: contatos[p.ci].id, eventId: eventos[p.ei].id },
    });
  }

  // Tags nos contatos
  await prisma.contactTag.upsert({ where: { contactId_tagId: { contactId: contatos[0].id, tagId: tags[0].id } }, update: {}, create: { contactId: contatos[0].id, tagId: tags[0].id } });
  await prisma.contactTag.upsert({ where: { contactId_tagId: { contactId: contatos[7].id, tagId: tags[1].id } }, update: {}, create: { contactId: contatos[7].id, tagId: tags[1].id } });
  await prisma.contactTag.upsert({ where: { contactId_tagId: { contactId: contatos[13].id, tagId: tags[2].id } }, update: {}, create: { contactId: contatos[13].id, tagId: tags[2].id } });

  // ImportLogs
  await prisma.importLog.createMany({
    data: [
      { nomeArquivo: "participantes-festa-junina-2024.xlsx", eventId: eventos[0].id, totalLinhas: 10, novosContatos: 10, duplicados: 0, erros: 0 },
      { nomeArquivo: "lista-workshop-marketing.xlsx", eventId: eventos[1].id, totalLinhas: 8, novosContatos: 6, duplicados: 2, erros: 0 },
      { nomeArquivo: "conferencia-ecommerce.csv", eventId: eventos[2].id, totalLinhas: 10, novosContatos: 6, duplicados: 2, erros: 2 },
      { nomeArquivo: "sao-joao-nordeste.xlsx", eventId: eventos[3].id, totalLinhas: 5, novosContatos: 3, duplicados: 2, erros: 0 },
      { nomeArquivo: "webinar-trafego-2025.csv", eventId: eventos[4].id, totalLinhas: 5, novosContatos: 1, duplicados: 4, erros: 0 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completo! 25 contatos, 5 eventos, 3 empresas, 5 tags.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
