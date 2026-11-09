const fs = require("fs");
const path = require("path");

const csvPath =
  "C:/Users/luiza/.gemini/antigravity/brain/e4e5e418-88e8-4e4f-8834-3d2338690d7b/.user_uploaded/media_1793804704230_e64682e3.csv";
const content = fs.readFileSync(csvPath, "utf8");

function parseFullCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentVal.trim());
      currentVal = "";
      if (currentRow.some((c) => c !== "")) rows.push(currentRow);
      currentRow = [];
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== "")) rows.push(currentRow);
  }
  return rows;
}

function parseDate(dateStr, timeStr) {
  if (!dateStr && !timeStr) return new Date();

  const ptMonths = {
    janeiro: 0,
    fevereiro: 1,
    março: 2,
    marco: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };

  const ptMatch = (timeStr || "")
    .toLowerCase()
    .match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ptMatch) {
    const day = parseInt(ptMatch[1], 10);
    const month = ptMonths[ptMatch[2]];
    const year = parseInt(ptMatch[3], 10);
    const hour = ptMatch[4] ? parseInt(ptMatch[4], 10) : 12;
    const min = ptMatch[5] ? parseInt(ptMatch[5], 10) : 0;
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day, hour, min));
    }
  }

  const slashMatch = (dateStr || timeStr || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10) - 1;
    const d = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);
    return new Date(Date.UTC(y, m, d, 12, 0));
  }

  const d = new Date(dateStr || timeStr);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

function getSourceId(formName, tipoPost) {
  const f = (formName || "").toLowerCase();
  const tp = (tipoPost || "").toLowerCase();

  if (f.includes("new - mentoria tech")) {
    return "source_new_mentoria";
  } else if (f.includes("mentoria - tech") || f.includes("mentoria tech")) {
    return "source_mentoria";
  } else if (f.includes("post saída itaú") || f.includes("post saida itau")) {
    return "source_post_itau";
  } else if (f.includes("post reprovação") || f.includes("post reprovacao")) {
    return "source_post_reprovacao";
  } else if (tp.includes("amigo") || f.includes("amigo")) {
    return "source_amigo";
  } else if (tp.includes("organico") || tp.includes("orgânico")) {
    return "source_post_itau";
  } else if (tp.includes("google")) {
    return "source_google_ads";
  } else if (f.includes("site") || tp.includes("site")) {
    return "source_site";
  } else {
    return "source_new_mentoria";
  }
}

function getStageAndMetrics(status) {
  const stLower = (status || "").trim().toLowerCase();
  let funnelStageId = "stage_novo";
  let temperature = "warm";
  let score = 30;

  if (stLower === "fechou") {
    funnelStageId = "stage_fechamento";
    temperature = "hot";
    score = 95;
  } else if (stLower === "não fechou" || stLower === "nao fechou") {
    funnelStageId = "stage_fechamento";
    temperature = "cold";
    score = 20;
  } else if (stLower === "agendamento" || stLower === "conversado") {
    funnelStageId = "stage_proposta";
    temperature = "hot";
    score = 80;
  } else if (stLower === "em andamento") {
    funnelStageId = "stage_qualificacao";
    temperature = "warm";
    score = 60;
  } else if (stLower === "convidado" || stLower === "convite enviado") {
    funnelStageId = "stage_novo";
    temperature = "warm";
    score = 40;
  } else if (
    stLower === "lead errado" ||
    stLower === "linkedin quebrado" ||
    stLower === "não respondeu" ||
    stLower === "nao respondeu"
  ) {
    funnelStageId = "stage_novo";
    temperature = "cold";
    score = 10;
  } else {
    funnelStageId = "stage_novo";
    temperature = "warm";
    score = 30;
  }

  return { funnelStageId, temperature, score };
}

function getUserId(responsavel) {
  const r = (responsavel || "").trim().toLowerCase();
  if (r === "cleiton") return "user_cleiton";
  if (r === "si") return "user_si";
  if (r === "elis") return "user_elis";
  if (r === "bruno") return "user_bruno";
  if (r === "luiza") return "user_luiza";
  return "user_admin";
}

const allRows = parseFullCSV(content);
const headerIdx = allRows.findIndex((r) => r.includes("lead_id") && r.includes("Nome"));
const headers = allRows[headerIdx];
const dataRows = allRows.slice(headerIdx + 1);

const leads = [];
const deals = [];
const ownerships = [];
const interactions = [];

dataRows.forEach((r, idx) => {
  const rowObj = {};
  headers.forEach((h, i) => {
    rowObj[h] = r[i] || "";
  });

  const leadId = `lead_${idx + 1}`;
  const nome = (rowObj["Nome"] || "").trim() || `Lead ${idx + 1}`;
  const email = (rowObj["E-mail"] || "").trim().toLowerCase();
  const phone = (
    rowObj["Número de telefone"] ||
    rowObj["Por favor, confirme o número do swu Whats:"] ||
    ""
  ).trim();
  const status = (rowObj["STATUS"] || "").trim();
  const formName = (rowObj["form_name"] || "").trim();
  const tipoPost = (rowObj["TIPO POST"] || "").trim();
  const responsavel = (rowObj["Responsavel"] || "").trim();
  const situacao = (rowObj["Situação"] || "").trim();
  const createdDate = rowObj["created_date"] || "";
  const createdTime = rowObj["created_time"] || "";

  const createdAt = parseDate(createdDate, createdTime);
  const createdAtIso = createdAt.toISOString();

  const sourceId = getSourceId(formName, tipoPost);
  const { funnelStageId, temperature, score } = getStageAndMetrics(status);
  const assignedUserId = getUserId(responsavel);

  leads.push({
    id: leadId,
    organizationId: "org_1",
    name: nome,
    email: email,
    phone: phone,
    sourceId: sourceId,
    funnelStageId: funnelStageId,
    score: score,
    temperature: temperature,
    ativo: true,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
  });

  ownerships.push({
    id: `ownership_${leadId}`,
    leadId: leadId,
    userId: assignedUserId,
    assignedAt: createdAtIso,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
  });

  const stLower = status.toLowerCase();
  if (stLower === "fechou") {
    let valorFechado = 2500;
    if (situacao.includes("1.200") || situacao.includes("1200")) {
      valorFechado = 1200;
    }
    deals.push({
      id: `deal_${leadId}`,
      organizationId: "org_1",
      leadId: leadId,
      title: `Mentoria Tech - ${nome}`,
      value: valorFechado,
      status: "won",
      closedAt: createdAtIso,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    });
  } else if (stLower === "não fechou" || stLower === "nao fechou") {
    deals.push({
      id: `deal_${leadId}`,
      organizationId: "org_1",
      leadId: leadId,
      title: `Mentoria Tech - ${nome}`,
      value: 2500,
      status: "lost",
      closedAt: createdAtIso,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    });
  } else if (stLower === "agendamento" || stLower === "conversado") {
    deals.push({
      id: `deal_${leadId}`,
      organizationId: "org_1",
      leadId: leadId,
      title: `Mentoria Tech - ${nome}`,
      value: 2500,
      status: "open",
      closedAt: null,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    });
  }

  if (situacao) {
    let type = "note";
    const sitLower = situacao.toLowerCase();
    if (
      sitLower.includes("call") ||
      sitLower.includes("reunião") ||
      sitLower.includes("bate papo")
    ) {
      type = "call";
    } else if (sitLower.includes("email") || sitLower.includes("isca")) {
      type = "email";
    } else if (sitLower.includes("whats") || sitLower.includes("whatsapp")) {
      type = "whatsapp";
    }
    interactions.push({
      id: `interaction_${leadId}`,
      leadId: leadId,
      userId: assignedUserId,
      type: type,
      notes: situacao,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    });
  }
});

console.log("Generated leads:", leads.length);
console.log("Generated deals:", deals.length);
console.log("Generated ownerships:", ownerships.length);
console.log("Generated interactions:", interactions.length);

const outDir = path.resolve(__dirname, "../src/modules/crm/infrastructure");
fs.writeFileSync(path.join(outDir, "leads-data.json"), JSON.stringify(leads, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "deals-data.json"), JSON.stringify(deals, null, 2), "utf8");
fs.writeFileSync(
  path.join(outDir, "ownerships-data.json"),
  JSON.stringify(ownerships, null, 2),
  "utf8",
);
fs.writeFileSync(
  path.join(outDir, "interactions-data.json"),
  JSON.stringify(interactions, null, 2),
  "utf8",
);

console.log("Successfully wrote JSON seed files!");
