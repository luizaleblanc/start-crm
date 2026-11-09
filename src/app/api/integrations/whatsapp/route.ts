import { NextResponse } from "next/server";
import {
  leadsRepository,
  leadInteractionsRepository,
} from "@/modules/crm/infrastructure/repositories";
import {
  dispatchViaCloserGateway,
  CLOSER_INSTANCES,
} from "@/modules/crm/infrastructure/closer-whatsapp-gateway";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";

interface SendWhatsAppBody {
  to?: string;
  message?: string;
  leadId?: string;
  closerId?: string;
  template?: "presentation" | "meeting_invite" | "proposal_followup" | "custom";
}

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export const GET = handleRoute(async (request) => {
  requireAuth(request);

  return NextResponse.json({
    status: "connected",
    provider: "API dos Closers (Opção B - In-CRM Gateway)",
    activeCloser: CLOSER_INSTANCES[0],
    closers: CLOSER_INSTANCES,
    apiVersion: "v20.0",
    templates: [
      {
        id: "presentation",
        name: "Apresentação Comercial",
        category: "MARKETING",
        body: "Olá {{1}}! Tudo bem? Sou a Simone, closer da Mentoria Tech do Cleiton Silva. Vi seu interesse em acelerar sua carreira tech e gostaria de bater um papo rápido de 10 min. Podemos conversar hoje?",
      },
      {
        id: "meeting_invite",
        name: "Confirmação de Reunião",
        category: "UTILITY",
        body: "Olá {{1}}! Passando para confirmar nosso alinhamento com o Cleiton Silva agendado para {{2}}. Segue o link de acesso no Google Meet: {{3}}. Caso precise reagendar, avise por aqui!",
      },
      {
        id: "proposal_followup",
        name: "Acompanhamento de Proposta",
        category: "UTILITY",
        body: "Olá {{1}}, como vai? Passando para saber se teve a oportunidade de analisar as condições da Mentoria Tech do Cleiton. Fico à disposição para esclarecer qualquer ponto!",
      },
    ],
  });
});

export const POST = handleRoute(async (request) => {
  requireAuth(request);

  const body = (await request.json()) as SendWhatsAppBody;
  const { to, message, leadId, closerId } = body;

  if (!to || !message) {
    throw new ApiError(400, "Telefone de destino ('to') e mensagem ('message') são obrigatórios");
  }

  const formattedPhone = cleanPhone(to);
  if (formattedPhone.length < 10) {
    throw new ApiError(400, "Número de telefone inválido para envio via WhatsApp");
  }

  // Disparo 100% no CRM via API dos Closers (Opção B)
  const closerResult = await dispatchViaCloserGateway({
    to: formattedPhone,
    message,
    leadId,
    closerId: closerId || "closer_luiza",
  });

  // Se um leadId foi informado, registra automaticamente a interação no CRM
  if (leadId) {
    try {
      await leadInteractionsRepository.create({
        leadId,
        userId: "user_luiza",
        type: "whatsapp",
        notes: `Mensagem enviada via API dos Closers (${closerResult.closer.closerName}): "${message}"`,
      });
    } catch (err) {
      console.warn("[whatsapp] Não foi possível salvar interação do lead:", err);
    }
  }

  return NextResponse.json({
    success: true,
    mode: "closer_api_gateway",
    messageId: closerResult.messageId,
    closer: closerResult.closer,
    to: formattedPhone,
    status: closerResult.status,
    sentAt: closerResult.sentAt,
    provider: closerResult.providerUsed,
  });
});
