export interface SalesMessage {
  id: string;
  sender: "sdr" | "lead" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  stage?: string;
  meetingUrl?: string;
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

/**
 * Roteiro Estratégico de Pré-Venda da Mentoria Tech do Cleiton Silva:
 * - Produto: Mentoria Tech Individual para Desenvolvedores e Engenheiros de Software
 * - Objetivo: Transição para Sênior / Tech Lead, aumento salarial (R$ 12k - 25k) ou vagas remotas
 * - Oferta de Entrada (Downsell): Imersão / Sprint de Carreira R$ 97 para leads com objeção de orçamento
 * - Call Comercial: Sessão Diagnóstica de 15 a 30 min via Google Meet
 */
export function generateFunnelMessages(lead: LeadContext): {
  stage: FunnelState["stage"];
  sdr: string;
  leadResponse: string;
  crmAction?: string;
}[] {
  const firstName = lead.name.split(" ")[0] || "Dev";
  const cargo = lead.jobTitle || "Engenheiro de software";
  const empresa =
    lead.company && lead.company !== "Não informada" ? lead.company : "sua empresa atual";

  return [
    {
      stage: "primeiro_contato",
      sdr: `Olá, ${firstName}! Tudo bem? Sou do time do Cleiton Silva (Mentoria Tech). Vi seu perfil atuando como ${cargo} e seu interesse no nosso conteúdo sobre aceleração de carreira tech. Posso te fazer uma pergunta rápida sobre seu momento profissional?`,
      leadResponse: `Oi! Tudo bem sim. Claro, pode perguntar!`,
      crmAction: "Contato iniciado via Meta Cloud API",
    },
    {
      stage: "qualificacao",
      sdr: `Show! Hoje você sente que o seu maior desafio na carreira é destravar promoção para Sênior/Tech Lead, aumentar sua remuneração para a faixa de R$ 15k+, ou encontrar vagas remotas internacionais?`,
      leadResponse: `Meu maior desafio hoje é realmente destravar essa transição para Sênior e ter uma remuneração melhor. Sinto que bato na trave em entrevistas técnicas e fico preso nas mesmas demandas.`,
      crmAction: "Lead qualificado: interesse em transição Sênior e aumento salarial",
    },
    {
      stage: "apresentacao",
      sdr: `Entendo perfeitamente, ${firstName}. É exatamente esse padrão que o Cleiton trabalha na Mentoria Tech. Ele mapeia seus gaps técnicos de arquitetura e liderança, refaz seu posicionamento no LinkedIn/GitHub e faz simulações reais de entrevistas para você negociar na mesa com segurança. Faz sentido conhecer como funciona esse plano prático individual?`,
      leadResponse: `Faz total sentido! Mas como funciona a mentoria e quanto custa o investimento?`,
      crmAction: "Apresentação concluída — Objeção de preço levantada",
    },
    {
      stage: "objecao_preco",
      sdr: `A Mentoria individual com acompanhamento 1:1 do Cleiton é personalizada, com encontros semanais e suporte direto no WhatsApp. O investimento cabe em até 12x no cartão e se paga já no primeiro aumento salarial que você conquista. E se preferir começar testando, temos também o Sprint de Reposicionamento Tech por apenas R$ 97. Mas antes de qualquer decisão financeira, o Cleiton faz uma call de diagnóstico de 15 minutos sem compromisso.`,
      leadResponse: `Legal! Se tem essa sessão de 15 minutos de diagnóstico gratuita com o Cleiton, eu gostaria muito de fazer!`,
      crmAction: "Objeção contornada — Lead aceitou diagnóstico 1:1",
    },
    {
      stage: "agendamento_call",
      sdr: `Excelente decisão, ${firstName}! Acabei de reservar seu horário na agenda do Cleiton no Google Calendar. Segue o link da nossa sala no Google Meet: https://meet.google.com/crm-mentoria-${lead.id}. Amanhã às 15h fica bom para você?`,
      leadResponse: `Perfeito! Amanhã às 15h está confirmado. Já salvei o link aqui na minha agenda. Obrigado!`,
      crmAction: "Call agendada no Google Calendar / Meet — Lead movido para Proposta",
    },
    {
      stage: "fechamento",
      sdr: `Confirmadíssimo, ${firstName}! O convite oficial com o link do Google Meet acabou de ser enviado para seu e-mail e seu WhatsApp. Até amanhã às 15h com o Cleiton!`,
      leadResponse: `Show de bola, até amanhã!`,
      crmAction: "Oportunidade fechada com sucesso — Negócio ganho!",
    },
  ];
}
