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
  temperature?: "cold" | "warm" | "hot";
  funnelStageId?: string;
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
  stepTimerSeconds?: number;
}

export type FunnelType = "cold" | "warm" | "closing";

export interface FunnelConfig {
  id: FunnelType;
  name: string;
  shortLabel: string;
  description: string;
  targetAudience: string;
  kanbanMatch: string;
  defaultTimerSeconds: number;
  steps: FunnelStepDefinition[];
}

/**
 * Detecta automaticamente o funil recomendado pelo Kanban com base na temperatura e estágio do lead
 */
export function detectFunnelFromKanban(lead: {
  temperature?: string;
  funnelStageId?: string;
}): FunnelType {
  const stage = lead.funnelStageId || "";
  const temp = lead.temperature || "cold";

  if (stage === "stage_fechamento" || temp === "hot") {
    return "closing";
  }
  if (stage === "stage_proposta" || temp === "warm") {
    return "warm";
  }
  return "cold";
}

/**
 * Constrói os 3 funis personalizados por Kanban para a marca Cleiton Silva & Luiza Ferraz:
 * 1. Lead Frio (Aquecimento, Diagnóstico Suave e Roadmap Cleiton)
 * 2. Lead Quente (Aceleração, Método 1:1 Cleiton e Agendamento Meet)
 * 3. Lead em Fechamento (Contorno Objeções, Condições Luiza 12x, Sprint R$ 97 e Won)
 */
export function getFunnelConfigs(lead: LeadContext): Record<FunnelType, FunnelConfig> {
  const firstName = lead.name.split(" ")[0] || "Dev";
  const cargo = lead.jobTitle || "Engenheiro de software";
  const empresa =
    lead.company && lead.company !== "Não informada" ? lead.company : "sua empresa atual";

  return {
    cold: {
      id: "cold",
      name: "Funil 1: Lead Frio (Aquecimento & Diagnóstico)",
      shortLabel: "Lead Frio (Script 1)",
      description:
        "Abordagem consultiva sem pressão, diagnóstico de dor de carreira e áudio do Cleiton sobre o roadmap tech.",
      targetAudience: "Leads em Topo de Funil / Temperatura Fria (cold)",
      kanbanMatch: "Estágios: Novo / Qualificação",
      defaultTimerSeconds: 6,
      steps: [
        {
          stage: "primeiro_contato",
          sdr: `Olá, ${firstName}! Tudo bem? Sou a Luiza Ferraz, closer da Mentoria Tech do Cleiton Silva. Vi seu perfil atuando como ${cargo} em ${empresa}. Estamos mapeando os principais desafios que devs enfrentam para destravar vagas de R$ 15k+. Posso te fazer uma pergunta rápida?`,
          leadResponse: `Oi Luiza! Tudo bem sim. Claro, pode perguntar!`,
          crmAction: "Abordagem consultiva suave via Closer WhatsApp Gateway",
          stepTimerSeconds: 6,
        },
        {
          stage: "qualificacao",
          sdr: `Legal! A maioria dos desenvolvedores que chegam até nós sente que domina o código, mas trava na hora de se posicionar como Sênior ou passar em testes práticos de arquitetura. Você também sente essa barreira atualmente?`,
          leadResponse: `Com certeza! Bato na trave em testes técnicos e sinto que meu currículo não chama atenção das empresas certas.`,
          crmAction: "Diagnóstico confirmado: barreira em entrevistas técnicas e posicionamento",
          stepTimerSeconds: 5,
        },
        {
          stage: "apresentacao",
          sdr: `Ouça este áudio de 38 segundos que o Cleiton Silva (Co-fundador da Mentoria Tech) gravou explicando o roadmap prático para destravar essa transição:`,
          leadResponse: `Muito bom o áudio do Cleiton! Faz total sentido. Como funciona esse direcionamento na prática?`,
          crmAction: "Áudio Roadmap do Cleiton reproduzido — Interesse despertado",
          isAudio: true,
          audioDuration: "0:38",
          audioVoice: "cleiton",
          audioTranscript: `Fala ${firstName}, beleza? Cleiton aqui! Gravei esse áudio porque vejo muitos devs como você, com baita bagagem técnica, mas que ficam presos na mesma faixa salarial porque falta estratégia de posicionamento e arquitetura. Na mentoria eu sento com você 1 a 1, mapeio seus gaps e simulamos entrevistas reais até você fechar uma proposta sênior.`,
          stepTimerSeconds: 7,
        },
        {
          stage: "agendamento_call",
          sdr: `Selecionamos 5 profissionais esta semana para montar esse plano de aceleração individualmente com o Cleiton em 15 minutos pelo Google Meet, 100% sem custo. Fica bom para você amanhã às 15h?`,
          leadResponse: `Com certeza Luiza! Amanhã às 15h está perfeito para mim!`,
          crmAction: "Lead Frio qualificado e avançado para Sessão de Diagnóstico",
          stepTimerSeconds: 5,
        },
        {
          stage: "fechamento",
          sdr: `Perfeito, ${firstName}! Reservei seu horário e o link da sala é https://meet.google.com/crm-mentoria-${lead.id.slice(-6)}. Já atualizei seu cadastro aqui no CRM para Lead Quente!`,
          leadResponse: `Combinado Luiza! Já coloquei na minha agenda e até amanhã!`,
          crmAction: "Transição concluída: Lead avançado para Quente no Kanban",
          stepTimerSeconds: 4,
        },
      ],
    },

    warm: {
      id: "warm",
      name: "Funil 2: Lead Quente (Aceleração & Mentoria Tech)",
      shortLabel: "Lead Quente (Script 2)",
      description:
        "Foco em aceleração rápida, demonstração do método 1:1 com Cleiton, prova social e agendamento da sessão de diagnóstico.",
      targetAudience: "Leads Qualificados / Temperatura Morna ou Quente (warm)",
      kanbanMatch: "Estágios: Qualificação / Proposta",
      defaultTimerSeconds: 4,
      steps: [
        {
          stage: "primeiro_contato",
          sdr: `Fala ${firstName}! Tudo bem? Luiza Ferraz aqui da Mentoria Tech do Cleiton Silva. Vi que você já acompanha nossos conteúdos e tem interesse em acelerar sua carreira para o nível Sênior/Tech Lead. Como está seu plano de carreira para este semestre?`,
          leadResponse: `Oi Luiza! Sim, acompanho o Cleiton e quero muito dar o próximo passo agora, mas preciso de um acompanhamento mais personalizado.`,
          crmAction: "Conexão direta com lead de alto interesse",
          stepTimerSeconds: 4,
        },
        {
          stage: "qualificacao",
          sdr: `Exatamente por isso a Mentoria Tech funciona tão bem! O Cleiton faz acompanhamento 1 a 1 semanal, revisando seu código, arquitetura de sistemas e simulando entrevistas ao vivo. O que você mais precisa destravar: arquitetura ou postura em entrevistas de alto salário?`,
          leadResponse: `Os dois! Principalmente arquitetura corporativa e segurança para negociar propostas acima de R$ 15k.`,
          crmAction: "Necessidade mapeada: Arquitetura corporativa e negociação salarial",
          stepTimerSeconds: 5,
        },
        {
          stage: "apresentacao",
          sdr: `Ouça este áudio rápido do Cleiton Silva detalhando como estruturamos a mentoria para você atingir esse resultado:`,
          leadResponse: `Sensacional Cleiton! Era exatamente esse empurrão que eu precisava. Como podemos agendar para você avaliar meu momento?`,
          crmAction: "Áudio do Mentor Cleiton reproduzido — Validação de autoridade",
          isAudio: true,
          audioDuration: "0:45",
          audioVoice: "cleiton",
          audioTranscript: `Fala ${firstName}! Aqui é o Cleiton Silva. Nosso foco é 100% prático: em até 90 dias você passa por simulações reais de Tech Lead, alinhamento de LinkedIn internacional e revisão do seu portfólio. Nossos mentorados têm média de aumento salarial de 60% logo nos primeiros meses. Quero te conhecer pessoalmente para avaliar sua bagagem!`,
          stepTimerSeconds: 6,
        },
        {
          stage: "agendamento_call",
          sdr: `Perfeito! Já reservei seu horário prioritário na agenda do Cleiton. Segue o link exclusivo da sala no Google Meet: https://meet.google.com/crm-mentoria-${lead.id.slice(-6)}. Amanhã às 15h fica bom?`,
          leadResponse: `Confirmado, Luiza! Amanhã às 15h estarei na sala sem falta.`,
          crmAction: "Reunião Google Meet confirmada e sincronizada na agenda",
          stepTimerSeconds: 4,
        },
        {
          stage: "fechamento",
          sdr: `Ótimo, ${firstName}! Enviei o material preparatório para o seu e-mail e adicionei o evento no Google Calendar. Nos vemos amanhã!`,
          leadResponse: `Tudo pronto Luiza! Até amanhã e muito obrigado!`,
          crmAction: "Lead Quente pronto para proposta final na reunião",
          stepTimerSeconds: 3,
        },
      ],
    },

    closing: {
      id: "closing",
      name: "Funil 3: Lead em Fechamento (Negociação & Condições Luiza)",
      shortLabel: "Fechamento (Script 3)",
      description:
        "Foco em fechamento imediato, superação de objeções de preço e tempo, condições facilitadas em 12x, Sprint de R$ 97 e contrato ganho.",
      targetAudience: "Leads em Negociação / Temperatura Quente (hot)",
      kanbanMatch: "Estágios: Proposta / Fechamento",
      defaultTimerSeconds: 3,
      steps: [
        {
          stage: "primeiro_contato",
          sdr: `Oi ${firstName}! Luiza Ferraz aqui. O Cleiton acabou de me passar o parecer da sua call de diagnóstico e aprovou sua vaga na Mentoria Tech! Ele destacou seu potencial para alcançar vaga Sênior rapidamente. Vamos dar o start na sua mentoria?`,
          leadResponse: `Oi Luiza! A conversa com o Cleiton foi sensacional mesmo! Eu adorei o plano, mas fiquei com um pé atrás em relação ao investimento e como funciona o parcelamento.`,
          crmAction: "Apresentação da aprovação pelo Co-fundador Cleiton Silva",
          stepTimerSeconds: 3,
        },
        {
          stage: "objecao_preco",
          sdr: `Compreendo perfeitamente, ${firstName}! Veja a mentoria como um investimento com ROI imediato: com o aumento salarial de R$ 3k a R$ 6k no primeiro mês após a promoção, a mentoria inteira já se paga. Além disso, facilitamos em até 12x no cartão ou condições especiais para o time do Cleiton.`,
          leadResponse: `Em 12x fica muito mais acessível! Mas e se eu não me adaptar ou quiser testar antes?`,
          crmAction: "Contorno de objeção financeira com análise de ROI",
          stepTimerSeconds: 4,
        },
        {
          stage: "apresentacao",
          sdr: `Ouça este áudio de 36 segundos que gravei para você explicando nossa garantia incondicional e o Sprint inicial de R$ 97:`,
          leadResponse: `Nossa Luiza, com essa garantia de 15 dias e o bônus do Sprint eu fico totalmente tranquilo! Quero fechar a mentoria completa parcelada!`,
          crmAction: "Áudio da Closer Luiza Ferraz — Objeção superada com sucesso",
          isAudio: true,
          audioDuration: "0:36",
          audioVoice: "luiza",
          audioTranscript: `Oi ${firstName}, Luiza aqui! A Mentoria individual do Cleiton é personalizada com suporte direto no WhatsApp e encontros semanais. O investimento é parcelado em até 12x e se paga logo no primeiro mês com o novo salário. E se você quiser começar validando a metodologia agora mesmo, temos o Sprint de R$ 97. Mas se fechar a mentoria completa hoje, o Sprint sai como bônus e você tem 15 dias de garantia total!`,
          stepTimerSeconds: 5,
        },
        {
          stage: "agendamento_call",
          sdr: `Parabéns pela decisão, ${firstName}! Já gerei seu link de matrícula prioritária com a condição especial aprovada pelo Cleiton: https://pay.mentoriatech.com.br/matricula/${lead.id.slice(-6)}. Me avisa assim que concluir para eu liberar seus acessos VIP!`,
          leadResponse: `Prontinho Luiza, acabei de efetuar o pagamento em 12x! Já chegou a nota e a confirmação no meu e-mail!`,
          crmAction: "Link de pagamento gerado e confirmado pelo lead",
          stepTimerSeconds: 4,
        },
        {
          stage: "fechamento",
          sdr: `Show de bola, ${firstName}! Seja muito bem-vindo à Mentoria Tech! Já atualizei seu negócio como GANHO no nosso CRM e o Cleiton já vai te adicionar no grupo VIP exclusivo no WhatsApp. Vamos acelerar juntos!`,
          leadResponse: `Sensacional Luiza! Muito obrigado por todo o suporte no atendimento. Vamos com tudo!`,
          crmAction: "Fechamento 100% Concluído — Negócio Ganho (Won) no CRM",
          stepTimerSeconds: 3,
        },
      ],
    },
  };
}

/**
 * Retorna os passos de um funil específico ou padrão
 */
export function generateFunnelMessages(
  lead: LeadContext,
  funnelType?: FunnelType,
): FunnelStepDefinition[] {
  const configs = getFunnelConfigs(lead);
  const selectedType = funnelType || detectFunnelFromKanban(lead);
  return configs[selectedType]?.steps || configs.cold.steps;
}
