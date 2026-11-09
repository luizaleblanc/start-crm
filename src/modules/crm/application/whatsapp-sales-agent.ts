export interface SalesMessage {
  id: string;
  sender: "sdr" | "lead" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  stage?: string;
  meetingUrl?: string;
  isAudio?: boolean;
  audioDuration?: string;
  audioVoice?: "cleiton" | "luiza";
  audioTranscript?: string;
}

export interface FunnelState {
  stage:
    | "primeiro_contato"
    | "qualificacao"
    | "apresentacao"
    | "objecao_preco"
    | "objecao_tempo"
    | "agendamento_call"
    | "fechamento";
  stepIndex: number;
}

export interface LeadContext {
  id: string;
  name: string;
  phone: string;
  jobTitle?: string;
  company?: string;
  city?: string;
  linkedinUrl?: string;
  sourceName?: string;
}

export interface FunnelStepDefinition {
  stage: FunnelState["stage"];
  sdr: string;
  leadResponse: string;
  crmAction?: string;
  isAudio?: boolean;
  audioDuration?: string;
  audioVoice?: "cleiton" | "luiza";
  audioTranscript?: string;
}

/**
 * Funil de Vendas Personalizado — Marca Cleiton Silva (Mentoria Tech):
 * - Closer Responsável: Luiza Ferraz (+55 16 99968-1670)
 * - Mentor Principal: Cleiton Silva
 * - Formato: Mensagens de texto + Áudios de voz gravados (Voice Notes) + Google Meet 1:1
 * - Oferta Principal: Mentoria Tech Individual para transição Sênior / Tech Lead
 * - Downsell: Sprint de Reposicionamento Tech por R$ 97
 */
export function generateFunnelMessages(lead: LeadContext): FunnelStepDefinition[] {
  const firstName = lead.name.split(" ")[0] || "Dev";
  const cargo = lead.jobTitle || "Engenheiro de software";
  const empresa =
    lead.company && lead.company !== "Não informada" ? lead.company : "sua empresa atual";

  return [
    {
      stage: "primeiro_contato",
      sdr: `Olá, ${firstName}! Tudo bem? Sou a Luiza Ferraz, closer da Mentoria Tech do Cleiton Silva. Vi seu perfil no LinkedIn como ${cargo} e seu interesse no nosso acelerador de carreira tech. Posso te fazer uma pergunta rápida sobre seu momento profissional?`,
      leadResponse: `Oi Luiza! Tudo bem sim. Pode perguntar!`,
      crmAction: "Abordagem inicial Luiza Ferraz via Closer WhatsApp Gateway",
    },
    {
      stage: "qualificacao",
      sdr: `Show! Hoje o que está mais travando seu crescimento: a transição técnica para Sênior/Tech Lead, conseguir entrevistas em empresas que pagam R$ 15k+, ou destravar vagas remotas no exterior?`,
      leadResponse: `Com certeza destravar a transição para Sênior e aumentar meu salário. Bato na trave em testes práticos e sinto que não sei me vender na entrevista.`,
      crmAction: "Lead qualificado: transição técnica para Sênior e aumento salarial",
    },
    {
      stage: "apresentacao",
      sdr: `Ouça este áudio rápido que o Cleiton gravou para você explicando como estruturamos seu plano individual:`,
      leadResponse: `Caramba, muito bom o áudio do Cleiton! Faz total sentido. Mas como funciona na prática e qual é o valor do investimento?`,
      crmAction: "Áudio do Cleiton Silva reproduzido — Interesse confirmado",
      isAudio: true,
      audioDuration: "0:42",
      audioVoice: "cleiton",
      audioTranscript: `Fala ${firstName}, beleza? Cleiton aqui! Gravei esse áudio porque vejo muitos devs como você, com baita bagagem técnica, mas que ficam presos na mesma faixa salarial porque falta estratégia de posicionamento e arquitetura. Na mentoria eu sento com você 1 a 1, mapeio seus gaps e simulamos entrevistas reais até você fechar uma proposta sênior.`,
    },
    {
      stage: "objecao_preco",
      sdr: `Ouça este áudio da Luiza Ferraz sobre as condições de entrada:`,
      leadResponse: `Excelente Luiza! Se tem essa sessão de 15 minutos de alinhamento com o Cleiton sem custo, eu topo fazer sim!`,
      crmAction: "Áudio de contorno de preço — Lead aceitou diagnóstico 1:1",
      isAudio: true,
      audioDuration: "0:36",
      audioVoice: "luiza",
      audioTranscript: `Oi ${firstName}, Luiza aqui! A Mentoria individual do Cleiton é personalizada com suporte direto no WhatsApp e encontros semanais. O investimento é parcelado em até 12x e se paga logo no primeiro mês com o novo salário. E se quiser começar testando agora, temos o Sprint de R$ 97. Mas antes de qualquer decisão, o Cleiton faz uma call de 15 minutos com você.`,
    },
    {
      stage: "agendamento_call",
      sdr: `Perfeito, ${firstName}! Reservei seu horário exclusivo com o Cleiton no Google Calendar. Segue o link da nossa sala no Google Meet: https://meet.google.com/crm-mentoria-${lead.id.slice(-6)}. Amanhã às 15h fica bom para você?`,
      leadResponse: `Perfeito, Luiza! Amanhã às 15h está confirmadíssimo. Já coloquei o link do Google Meet na minha agenda!`,
      crmAction: "Reunião Google Meet agendada — Lead avançado para Proposta",
    },
    {
      stage: "fechamento",
      sdr: `Tudo certo, ${firstName}! O convite oficial com o link da call e o material de preparação já estão salvos aqui no CRM. Até amanhã às 15h com o Cleiton!`,
      leadResponse: `Combinado Luiza, muito obrigado pela atenção e até amanhã!`,
      crmAction: "Fechamento concluído com sucesso — Negócio Ganho!",
    },
  ];
}
