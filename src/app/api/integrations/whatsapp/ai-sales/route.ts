import { NextResponse } from "next/server";
import {
  leadsRepository,
  leadInteractionsRepository,
  meetingsRepository,
} from "@/modules/crm/infrastructure/repositories";
import { generateFunnelMessages } from "@/modules/crm/application/whatsapp-sales-agent";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";

interface AiSalesBody {
  leadId: string;
  stepIndex?: number;
  action?: "next_step" | "handle_price" | "schedule_meeting" | "custom_reply";
  userMessage?: string;
}

export const POST = handleRoute(async (request) => {
  requireAuth(request);

  const body = (await request.json()) as AiSalesBody;
  const { leadId, stepIndex = 0, action = "next_step", userMessage } = body;

  if (!leadId) {
    throw new ApiError(400, "Identificador do lead ('leadId') é obrigatório");
  }

  const lead = await leadsRepository.findById(leadId);
  if (!lead) {
    throw new ApiError(404, "Lead não encontrado");
  }

  const funnel = generateFunnelMessages({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    jobTitle: lead.jobTitle,
    company: lead.company,
    city: lead.city,
    linkedinUrl: lead.linkedinUrl,
  });

  const currentStep = Math.min(Math.max(stepIndex, 0), funnel.length - 1);
  const stepData = funnel[currentStep] || funnel[0];
  if (!stepData) {
    throw new ApiError(500, "Erro ao gerar mensagem do funil");
  }

  // Se agendamento de call, cria a reunião no repositório
  let meetingUrl = "";
  if (stepData.stage === "agendamento_call" || action === "schedule_meeting") {
    meetingUrl = `https://meet.google.com/crm-mentoria-${lead.id.slice(-6)}`;
    try {
      await meetingsRepository.create({
        leadId: lead.id,
        userId: "user_cleiton",
        scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        notes: `Call 1:1 Diagnóstico Carreira Tech com Cleiton Silva (via WhatsApp)`,
      });
      // Atualiza o estágio do lead no funil para Proposta
      await leadsRepository.update(lead.id, {
        funnelStageId: "stage_proposta",
        temperature: "hot",
        score: Math.min((lead.score || 50) + 25, 95),
      });
    } catch (err) {
      console.warn("[ai-sales] Falha ao registrar reunião:", err);
    }
  }

  // Se fechamento, move para stage_fechamento
  if (stepData.stage === "fechamento") {
    try {
      await leadsRepository.update(lead.id, {
        funnelStageId: "stage_fechamento",
        temperature: "hot",
        score: 100,
      });
    } catch (err) {
      console.warn("[ai-sales] Falha ao atualizar para fechamento:", err);
    }
  }

  // Registra no histórico de interações do CRM
  try {
    await leadInteractionsRepository.create({
      leadId: lead.id,
      userId: "user_admin",
      type: "whatsapp",
      notes: `Simulação de IA WhatsApp: SDR enviou etapa [${stepData.stage}]: "${stepData.sdr.slice(0, 100)}..."`,
    });
  } catch (err) {
    console.warn("[ai-sales] Falha ao registrar interação:", err);
  }

  return NextResponse.json({
    success: true,
    stepIndex: currentStep,
    nextStepIndex: currentStep < funnel.length - 1 ? currentStep + 1 : currentStep,
    stage: stepData.stage,
    sdrMessage: {
      id: `msg_sdr_${Date.now()}`,
      sender: "sdr",
      text: userMessage || stepData.sdr,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "read",
      meetingUrl: stepData.stage === "agendamento_call" ? meetingUrl : undefined,
      isAudio: stepData.isAudio,
      audioDuration: stepData.audioDuration,
      audioVoice: stepData.audioVoice,
      audioTranscript: stepData.audioTranscript,
    },
    leadResponse: {
      id: `msg_lead_${Date.now() + 1}`,
      sender: "lead",
      text: stepData.leadResponse,
      timestamp: new Date(Date.now() + 3000).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    crmAction: stepData.crmAction,
  });
});
