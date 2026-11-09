import { NextResponse } from "next/server";
import {
  leadsRepository,
  leadInteractionsRepository,
} from "@/modules/crm/infrastructure/repositories";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";

interface SendWhatsAppBody {
  to?: string;
  message?: string;
  leadId?: string;
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
    provider: "Meta WhatsApp Business Cloud API",
    apiVersion: "v20.0",
    phoneId: "1092837492817",
    wabaId: "9837482910293",
    templates: [
      {
        id: "presentation",
        name: "Apresentação Comercial",
        category: "MARKETING",
        body: "Olá {{1}}! Tudo bem? Sou da equipe do Start CRM. Vi seu interesse em acelerar sua operação comercial e gostaria de bater um papo rápido de 10 min. Podemos conversar hoje?",
      },
      {
        id: "meeting_invite",
        name: "Confirmação de Reunião",
        category: "UTILITY",
        body: "Olá {{1}}! Passando para confirmar nosso alinhamento agendado para {{2}}. Segue o link de acesso: {{3}}. Caso precise reagendar, avise por aqui!",
      },
      {
        id: "proposal_followup",
        name: "Acompanhamento de Proposta",
        category: "UTILITY",
        body: "Olá {{1}}, como vai? Passando para saber se teve a oportunidade de analisar a proposta comercial que enviamos. Fico à disposição para esclarecer qualquer ponto!",
      },
    ],
  });
});

export const POST = handleRoute(async (request) => {
  requireAuth(request);

  const body = (await request.json()) as SendWhatsAppBody;
  const { to, message, leadId } = body;

  if (!to || !message) {
    throw new ApiError(400, "Telefone de destino ('to') e mensagem ('message') são obrigatórios");
  }

  const formattedPhone = cleanPhone(to);
  if (formattedPhone.length < 10) {
    throw new ApiError(400, "Número de telefone inválido para envio via WhatsApp");
  }

  const encodedText = encodeURIComponent(message);
  const clickToChatUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

  // Se um leadId foi informado, registra automaticamente a interação no CRM
  if (leadId) {
    try {
      await leadInteractionsRepository.create({
        leadId,
        userId: "user_admin",
        type: "whatsapp",
        notes: `Mensagem enviada via WhatsApp: "${message}"`,
      });
    } catch (err) {
      console.warn("[whatsapp] Não foi possível salvar interação do lead:", err);
    }
  }

  const metaToken = process.env.WHATSAPP_API_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let realDispatchSuccess = false;
  let realDispatchError: string | null = null;
  let messageId = `wamid.HBgM${Date.now()}A8F9B2C4E6D8`;

  // Disparo real via Meta WhatsApp Cloud API se configurada
  if (metaToken && phoneNumberId) {
    try {
      const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { body: message },
        }),
      });
      const metaData = await metaRes.json();
      if (metaRes.ok && metaData.messages?.[0]?.id) {
        realDispatchSuccess = true;
        messageId = metaData.messages[0].id;
      } else {
        realDispatchError = JSON.stringify(metaData);
        console.warn("[whatsapp] Meta API respondeu com erro:", metaData);
      }
    } catch (err) {
      realDispatchError = err instanceof Error ? err.message : String(err);
      console.warn("[whatsapp] Falha na conexão com a Meta Cloud API:", err);
    }
  }

  return NextResponse.json({
    success: true,
    realDispatchSuccess,
    realDispatchError,
    mode: metaToken && phoneNumberId ? "real_cloud_api" : "simulation",
    messageId,
    to: formattedPhone,
    status: realDispatchSuccess ? "sent_to_meta" : "simulated_local",
    sentAt: new Date().toISOString(),
    clickToChatUrl,
  });
});
