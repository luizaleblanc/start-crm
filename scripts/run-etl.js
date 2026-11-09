/**
 * ETL Pipeline — Start CRM Data Cleaning & Deduplication
 *
 * 1. Deduplicação inteligente de Leads (por e-mail, telefone e LinkedIn)
 * 2. Limpeza de nomes (remoção de hashes hexadecimais do LinkedIn, sufixos numéricos e caracteres especiais)
 * 3. Padronização de telefones (+55 (XX) 9XXXX-XXXX) e e-mails (lowercase)
 * 4. Preservação de integridade referencial em deals, ownerships e interactions
 */

const fs = require("fs");
const path = require("path");

const LEADS_FILE = path.join(__dirname, "../src/modules/crm/infrastructure/leads-data.json");
const DEALS_FILE = path.join(__dirname, "../src/modules/crm/infrastructure/deals-data.json");
const OWNERSHIPS_FILE = path.join(
  __dirname,
  "../src/modules/crm/infrastructure/ownerships-data.json",
);
const INTERACTIONS_FILE = path.join(
  __dirname,
  "../src/modules/crm/infrastructure/interactions-data.json",
);

// 1. Carrega dados
const rawLeads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
const rawDeals = JSON.parse(fs.readFileSync(DEALS_FILE, "utf8"));
const rawOwnerships = JSON.parse(fs.readFileSync(OWNERSHIPS_FILE, "utf8"));
const rawInteractions = JSON.parse(fs.readFileSync(INTERACTIONS_FILE, "utf8"));

console.log("--- INICIANDO ETL START CRM ---");
console.log(`Base original de Leads: ${rawLeads.length} registros`);
console.log(`Base original de Negócios (Deals): ${rawDeals.length} registros`);
console.log(`Base original de Ownerships: ${rawOwnerships.length} registros`);
console.log(`Base original de Interações: ${rawInteractions.length} registros\n`);

/**
 * Limpa nomes de leads removendo hashes do LinkedIn e números
 */
function cleanLeadName(raw) {
  if (!raw) return "";
  let name = String(raw);

  // 1. Remove caracteres de controle invisíveis e espaços especiais
  name = name.replace(/[\u200B-\u200D\u200E\u200F\uFEFF]/g, "");

  // 2. Remove emojis e pictogramas
  name = name.replace(/[\p{Extended_Pictographic}\uFE0F\uFE0E]/gu, "");

  name = name.trim();

  // 3. Remove hashes hexadecimais/alfanuméricos típicos de URLs do LinkedIn no final do nome
  // Ex: 'Renato Cardoso 0970531b5' -> 'Renato Cardoso'
  // Ex: 'Manuel Sanchez Padilla 2847b5280' -> 'Manuel Sanchez Padilla'
  // Ex: 'Luiz Felipe B10210223' -> 'Luiz Felipe'
  name = name.replace(/\s+[a-f0-9]{6,15}\b/gi, "");
  name = name.replace(/\s+[a-z][0-9a-f]{6,15}\b/gi, "");
  name = name.replace(/\s+[0-9]+[a-z0-9]{4,15}\b/gi, "");

  // 4. Remove números anexados no final de palavras/sobrenomes
  // Ex: 'Jose Souza1012' -> 'Jose Souza'
  // Ex: 'Ricardo Amorim7' -> 'Ricardo Amorim'
  // Ex: 'Suelen Ferreira87052606' -> 'Suelen Ferreira'
  // Ex: 'Gustavo R13' -> 'Gustavo R'
  name = name.replace(/([a-zA-ZÀ-ÿ]+)\d+\b/g, "$1");

  // 5. Remove números isolados no final
  name = name.replace(/\s+\d+\b/g, "");

  // 6. Limpa pontuações soltas no final
  name = name.replace(/[\s\-\/\,\.]+(?=\s|$)/g, " ").trim();

  // 7. Normaliza múltiplos espaços
  name = name.replace(/\s+/g, " ").trim();

  // 8. Capitaliza primeira letra se estiver minúscula
  if (name.length > 0 && name[0] === name[0].toLowerCase()) {
    name = name[0].toUpperCase() + name.slice(1);
  }

  return name;
}

/**
 * Padroniza telefone no formato E.164 brasileiro legível
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  let clean = digits;
  if (clean.startsWith("55") && clean.length >= 12) {
    clean = clean.slice(2);
  }

  if (clean.length === 11) {
    const ddd = clean.slice(0, 2);
    const part1 = clean.slice(2, 7);
    const part2 = clean.slice(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  if (clean.length === 10) {
    const ddd = clean.slice(0, 2);
    const part1 = clean.slice(2, 6);
    const part2 = clean.slice(6);
    return `+55 (${ddd}) 9${part1}-${part2}`;
  }

  return phone;
}

// Estatísticas do ETL
let namesCleanedCount = 0;
let phonesFormattedCount = 0;
let duplicatesMergedCount = 0;

// Passo 1: Limpeza individual de campos
const cleanedLeads = rawLeads.map((lead) => {
  const originalName = lead.name;
  const newName = cleanLeadName(originalName);
  if (newName !== originalName) {
    namesCleanedCount++;
  }

  const originalPhone = lead.phone;
  const newPhone = formatPhoneNumber(originalPhone);
  if (newPhone !== originalPhone) {
    phonesFormattedCount++;
  }

  return {
    ...lead,
    name: newName,
    phone: newPhone,
    email: lead.email ? lead.email.trim().toLowerCase() : "",
    ownerName: cleanLeadName(lead.ownerName || ""),
  };
});

// Passo 2: Deduplicação e Merge
const idMapping = {}; // de idDuplicado -> idCanonico
const canonicalLeads = [];
const seenKeys = new Map(); // chave -> leadCanonico

function getLeadKey(lead) {
  // Chave primária: email (se existir)
  if (lead.email && lead.email.includes("@")) {
    return `email:${lead.email.toLowerCase().trim()}`;
  }
  // Chave secundária: telefone limpo (se >= 10 dígitos)
  const pDigits = (lead.phone || "").replace(/\D/g, "");
  if (pDigits.length >= 10) {
    return `phone:${pDigits}`;
  }
  // Chave terciária: linkedin
  if (lead.linkedinUrl && lead.linkedinUrl.includes("linkedin.com/in/")) {
    const slug = lead.linkedinUrl.toLowerCase().replace(/\/+$/, "");
    return `linkedin:${slug}`;
  }
  return `id:${lead.id}`;
}

for (const lead of cleanedLeads) {
  const key = getLeadKey(lead);

  if (!seenKeys.has(key)) {
    seenKeys.set(key, lead);
    canonicalLeads.push(lead);
  } else {
    // Lead duplicado encontrado! Fazer merge no lead canônico
    duplicatesMergedCount++;
    const existing = seenKeys.get(key);
    idMapping[lead.id] = existing.id;

    console.log(
      `[MERGE] Lead duplicado "${lead.name}" (${lead.id}) mesclado em "${existing.name}" (${existing.id}) [Chave: ${key}]`,
    );

    // Prioriza dados mais ricos ou atualizados
    if (!existing.phone && lead.phone) existing.phone = lead.phone;
    if (!existing.email && lead.email) existing.email = lead.email;
    if (!existing.jobTitle && lead.jobTitle) existing.jobTitle = lead.jobTitle;
    if (!existing.company && lead.company) existing.company = lead.company;
    if (!existing.city && lead.city) existing.city = lead.city;
    if (!existing.linkedinUrl && lead.linkedinUrl) existing.linkedinUrl = lead.linkedinUrl;

    // Prioriza temperatura mais quente
    const tempPriority = { hot: 3, warm: 2, cold: 1 };
    if ((tempPriority[lead.temperature] || 0) > (tempPriority[existing.temperature] || 0)) {
      existing.temperature = lead.temperature;
    }

    // Maior score
    if ((lead.score || 0) > (existing.score || 0)) {
      existing.score = lead.score;
    }
  }
}

// Passo 3: Atualiza integridade referencial em Ownerships
let ownershipsUpdatedCount = 0;
const seenOwnerships = new Set();
const finalOwnerships = [];

for (const o of rawOwnerships) {
  const targetLeadId = idMapping[o.leadId] || o.leadId;
  const dedupKey = `${o.organizationId}_${o.userId}_${targetLeadId}`;

  if (!seenOwnerships.has(dedupKey)) {
    seenOwnerships.add(dedupKey);
    finalOwnerships.push({
      ...o,
      leadId: targetLeadId,
    });
    if (targetLeadId !== o.leadId) {
      ownershipsUpdatedCount++;
    }
  }
}

// Passo 4: Atualiza integridade referencial em Interações
let interactionsUpdatedCount = 0;
const finalInteractions = rawInteractions.map((i) => {
  const targetLeadId = idMapping[i.leadId] || i.leadId;
  if (targetLeadId !== i.leadId) {
    interactionsUpdatedCount++;
  }
  return {
    ...i,
    leadId: targetLeadId,
  };
});

// Passo 5: Atualiza integridade referencial em Negócios (Deals)
let dealsUpdatedCount = 0;
const finalDeals = rawDeals.map((d) => {
  const targetLeadId = idMapping[d.leadId] || d.leadId;
  let targetTitle = d.title;

  // Atualiza título do negócio caso tivesse o nome antigo com hash/números
  const matchingLead = canonicalLeads.find((l) => l.id === targetLeadId);
  if (matchingLead && d.title.includes("Mentoria Tech —")) {
    targetTitle = `Mentoria Tech — ${matchingLead.name}`;
  }

  if (targetLeadId !== d.leadId || targetTitle !== d.title) {
    dealsUpdatedCount++;
  }

  return {
    ...d,
    leadId: targetLeadId,
    title: targetTitle,
  };
});

// Passo 6: Salva os arquivos atualizados
fs.writeFileSync(LEADS_FILE, JSON.stringify(canonicalLeads, null, 2), "utf8");
fs.writeFileSync(DEALS_FILE, JSON.stringify(finalDeals, null, 2), "utf8");
fs.writeFileSync(OWNERSHIPS_FILE, JSON.stringify(finalOwnerships, null, 2), "utf8");
fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(finalInteractions, null, 2), "utf8");

console.log("\n--- ETL CONCLUÍDO COM SUCESSO ---");
console.log(
  `Leads limpos e tratados: ${canonicalLeads.length} (redução de ${duplicatesMergedCount} duplicatas)`,
);
console.log(`Nomes tratados (hashes/números removidos): ${namesCleanedCount}`);
console.log(`Telefones padronizados: ${phonesFormattedCount}`);
console.log(
  `Ownerships ajustados/deduplicados: ${rawOwnerships.length} -> ${finalOwnerships.length}`,
);
console.log(`Interações remapeadas: ${interactionsUpdatedCount}`);
console.log(`Negócios (Deals) atualizados: ${dealsUpdatedCount}`);
