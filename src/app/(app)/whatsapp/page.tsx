"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCheck,
  Clock,
  Flame,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Sliders,
  Snowflake,
  Sparkles,
  Target,
  User,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { apiFetch } from "@/shared/infrastructure/http/api-client";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import type { Lead } from "@/modules/crm/domain/entities";
import {
  detectFunnelFromKanban,
  getFunnelConfigs,
  type FunnelConfig,
  type FunnelStepDefinition,
  type FunnelType,
} from "@/modules/crm/application/whatsapp-sales-agent";

interface ChatMessage {
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

const LOCAL_STORAGE_FUNNELS_KEY = "startcrm_custom_funnels_v3";
const LOCAL_STORAGE_TIMERS_KEY = "startcrm_custom_timers_v3";

export default function WhatsAppChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <WhatsAppChatContent />
    </Suspense>
  );
}

function WhatsAppChatContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const paramLeadId = searchParams?.get("leadId");

  const leadsQuery = useLeads(1, 1500);
  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSelectedLeadId, setActiveSelectedLeadId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Perfil da Usuária: Luiza Ferraz
  const closerProfile = {
    name: "Luiza Ferraz",
    role: "Closer & Co-fundadora",
    phone: "+55 (83) 99142-9201",
    instanceId: "closer_luiza",
  };

  // Seleciona o lead passado via URL ou Luiza Ferraz ou o primeiro lead
  const defaultLeadId = useMemo(() => {
    if (paramLeadId) return paramLeadId;
    const luiza = leads.find(
      (l) =>
        l.name.toLowerCase().includes("luiza ferraz") ||
        l.name.toLowerCase().includes("luísa") ||
        l.name.toLowerCase().includes("luisa") ||
        l.email.toLowerCase().includes("luizaa.fq"),
    );
    return luiza ? luiza.id : leads[0]?.id || "";
  }, [leads, paramLeadId]);

  const selectedLeadId = activeSelectedLeadId || defaultLeadId;

  const selectedLead: Lead | undefined = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || leads[0];
  }, [leads, selectedLeadId]);

  // Detecção automática de funil sugerido pelo Kanban
  const kanbanSuggestedFunnel = useMemo<FunnelType>(() => {
    if (!selectedLead) return "cold";
    return detectFunnelFromKanban({
      temperature: selectedLead.temperature,
      funnelStageId: selectedLead.funnelStageId,
    });
  }, [selectedLead]);

  // Memoriza seleção manual de funil por lead (se o usuário escolheu outro diferente do sugerido pelo Kanban)
  const [userSelectedFunnelForLead, setUserSelectedFunnelForLead] = useState<
    Record<string, FunnelType>
  >({});

  // Funil ativo: usa a escolha manual para o lead atual ou a sugestão do Kanban
  const activeFunnelType: FunnelType = useMemo(() => {
    if (!selectedLead) return "cold";
    return userSelectedFunnelForLead[selectedLead.id] || kanbanSuggestedFunnel;
  }, [selectedLead, userSelectedFunnelForLead, kanbanSuggestedFunnel]);

  // Timers personalizados por tipo de funil (em segundos) inicializados do localStorage
  const [funnelTimers, setFunnelTimers] = useState<Record<FunnelType, number>>(() => {
    if (typeof window === "undefined") return { cold: 6, warm: 4, closing: 3 };
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TIMERS_KEY);
      return saved ? JSON.parse(saved) : { cold: 6, warm: 4, closing: 3 };
    } catch {
      return { cold: 6, warm: 4, closing: 3 };
    }
  });

  // Scripts personalizados persistidos no localStorage
  const [customScripts, setCustomScripts] = useState<Record<
    FunnelType,
    FunnelStepDefinition[]
  > | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FUNNELS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal de Personalização de Scripts & Funis
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [editingFunnelType, setEditingFunnelType] = useState<FunnelType>("cold");
  const [tempCustomScripts, setTempCustomScripts] = useState<Record<
    FunnelType,
    FunnelStepDefinition[]
  > | null>(null);
  const [tempCustomTimers, setTempCustomTimers] = useState<Record<FunnelType, number>>({
    cold: 6,
    warm: 4,
    closing: 3,
  });

  // Funil base gerado com os dados do lead atual
  const baseFunnelConfigs = useMemo(() => {
    if (!selectedLead) return null;
    return getFunnelConfigs({
      id: selectedLead.id,
      name: selectedLead.name,
      phone: selectedLead.phone,
      jobTitle: selectedLead.jobTitle,
      company: selectedLead.company,
      city: selectedLead.city,
      linkedinUrl: selectedLead.linkedinUrl,
      temperature: selectedLead.temperature,
      funnelStageId: selectedLead.funnelStageId,
    });
  }, [selectedLead]);

  // Configuração efetiva do funil ativo (mescla padrões com edições personalizadas)
  const currentFunnelConfig: FunnelConfig | null = useMemo(() => {
    if (!baseFunnelConfigs) return null;
    const base = baseFunnelConfigs[activeFunnelType];
    const customizedSteps = customScripts?.[activeFunnelType];
    const customizedTimer = funnelTimers[activeFunnelType] ?? base.defaultTimerSeconds;

    return {
      ...base,
      defaultTimerSeconds: customizedTimer,
      steps: customizedSteps && customizedSteps.length > 0 ? customizedSteps : base.steps,
    };
  }, [baseFunnelConfigs, activeFunnelType, customScripts, funnelTimers]);

  // Controle de Timer e Auto-Pilot do Funil
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const currentTimerSeconds = funnelTimers[activeFunnelType] ?? 5;
  const [countdown, setCountdown] = useState<number | null>(null);
  const [funnelStepIndex, setFunnelStepIndex] = useState(0);

  // Reprodução de áudio de voz oficial
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Armazenamento de histórico de conversas em memória por lead e funil
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de leads filtrados pela busca
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.email?.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term) ||
        l.company?.toLowerCase().includes(term) ||
        l.jobTitle?.toLowerCase().includes(term),
    );
  }, [leads, searchTerm]);

  // Chave de histórico composta por lead e funil
  const chatHistoryKey = useMemo(() => {
    if (!selectedLead) return "";
    return `${selectedLead.id}_${activeFunnelType}`;
  }, [selectedLead, activeFunnelType]);

  // Mensagens da conversa atual (inicia com apenas 1 mensagem sem duplicar)
  const activeMessages: ChatMessage[] = useMemo(() => {
    if (!selectedLead || !currentFunnelConfig) return [];
    const history = chatHistories[chatHistoryKey];
    if (history && history.length > 0) {
      return history;
    }

    const firstStep = currentFunnelConfig.steps[0];
    if (!firstStep) return [];

    return [
      {
        id: `msg_init_${chatHistoryKey}`,
        sender: "sdr",
        text: firstStep.sdr,
        timestamp: "10:30",
        status: "read",
        stage: firstStep.stage,
        isAudio: firstStep.isAudio,
        audioDuration: firstStep.audioDuration,
        audioVoice: firstStep.audioVoice,
        audioTranscript: firstStep.audioTranscript,
      },
    ];
  }, [selectedLead, currentFunnelConfig, chatHistories, chatHistoryKey]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isTyping]);

  // Função de reprodução de áudio via Web Speech Synthesis (PT-BR) com animação
  function playVoiceNote(msgId: string, transcript?: string, voice?: "cleiton" | "luiza") {
    if (playingAudioId === msgId) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    if (!transcript) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.lang = "pt-BR";
      utterance.rate = voice === "cleiton" ? 1.05 : 1.08;
      utterance.pitch = voice === "cleiton" ? 0.95 : 1.15;

      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      setPlayingAudioId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(msgId);
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  }

  // Mutação para avançar etapa no funil via backend de IA
  const aiSalesMutation = useMutation({
    mutationFn: (vars: {
      leadId: string;
      stepIndex: number;
      funnelType: FunnelType;
      userMessage?: string;
    }) =>
      apiFetch<{
        success: boolean;
        stepIndex: number;
        nextStepIndex: number;
        funnelType: FunnelType;
        stage: string;
        sdrMessage: ChatMessage;
        leadResponse: ChatMessage;
        crmAction?: string;
      }>("/api/integrations/whatsapp/ai-sales", {
        method: "POST",
        body: vars,
      }),
    onSuccess: (data) => {
      if (!selectedLead) return;

      // Se houver script personalizado no cliente, usa o texto personalizado
      const customStep = currentFunnelConfig?.steps[data.stepIndex];
      const sdrMsg: ChatMessage = {
        ...data.sdrMessage,
        text: customStep?.sdr || data.sdrMessage.text,
        isAudio: customStep?.isAudio ?? data.sdrMessage.isAudio,
        audioDuration: customStep?.audioDuration ?? data.sdrMessage.audioDuration,
        audioVoice: customStep?.audioVoice ?? data.sdrMessage.audioVoice,
        audioTranscript: customStep?.audioTranscript ?? data.sdrMessage.audioTranscript,
      };

      const leadReply: ChatMessage = {
        ...data.leadResponse,
        text: customStep?.leadResponse || data.leadResponse.text,
      };

      setChatHistories((prev) => {
        const current = prev[chatHistoryKey] || activeMessages;
        const alreadyExists = current.some((m) => m.text.trim() === sdrMsg.text.trim());
        const updated = alreadyExists ? current : [...current, sdrMsg];
        return {
          ...prev,
          [chatHistoryKey]: updated,
        };
      });

      // Simula digitação realista do Lead
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatHistories((prev) => {
          const current = prev[chatHistoryKey] || [];
          return {
            ...prev,
            [chatHistoryKey]: [...current, leadReply],
          };
        });
        setFunnelStepIndex(data.nextStepIndex);
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
      }, 1200);
    },
  });

  // Envio de mensagem manual digitada pelo closer (100% no CRM)
  function handleSendMessage(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedLead) return;

    const userText = inputText.trim();
    setInputText("");

    const newMsg: ChatMessage = {
      id: `msg_closer_${Date.now()}`,
      sender: "sdr",
      text: userText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    };

    setChatHistories((prev) => ({
      ...prev,
      [chatHistoryKey]: [...(prev[chatHistoryKey] || activeMessages), newMsg],
    }));

    // Registra envio direto via API dos Closers sem sair do CRM
    apiFetch("/api/integrations/whatsapp", {
      method: "POST",
      body: {
        to: selectedLead.phone,
        message: userText,
        leadId: selectedLead.id,
      },
    }).catch(() => null);

    // Resposta de simulação do Lead adaptada ao funil
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Entendi perfeitamente! Como funciona o acompanhamento do Cleiton?";
      if (activeFunnelType === "closing") {
        replyText = "Excelente Luiza! Em 12x no cartão fica ótimo e já posso confirmar agora.";
      } else if (activeFunnelType === "cold") {
        replyText = "Legal Luiza, tenho interesse sim em saber como acelerar minha carreira.";
      }

      const leadReply: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        sender: "lead",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [chatHistoryKey]: [...(prev[chatHistoryKey] || []), leadReply],
      }));
    }, 1200);
  }

  // Executa etapa específica do funil
  function handleTriggerFunnelStep(stepIdx: number) {
    if (!selectedLead || aiSalesMutation.isPending) return;
    setFunnelStepIndex(stepIdx);
    aiSalesMutation.mutate({
      leadId: selectedLead.id,
      stepIndex: stepIdx,
      funnelType: activeFunnelType,
    });
  }

  // Iniciar / Pausar Auto-Pilot com Timer personalizável
  function toggleAutoPilot() {
    if (autoPilotActive) {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
      setAutoPilotActive(false);
      setCountdown(null);
      return;
    }

    if (!selectedLead || !currentFunnelConfig) return;
    setAutoPilotActive(true);

    const timer = currentTimerSeconds;
    let currentStep = funnelStepIndex === 0 ? 1 : funnelStepIndex;
    setCountdown(timer);

    let remaining = timer;
    autoPilotTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (currentStep >= currentFunnelConfig.steps.length) {
          if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
          setAutoPilotActive(false);
          setCountdown(null);
          return;
        }

        handleTriggerFunnelStep(currentStep);
        currentStep += 1;
        remaining = timer;
        setCountdown(remaining);
      }
    }, 1000);
  }

  // Limpeza de timers ao desmontar
  useEffect(() => {
    return () => {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    };
  }, []);

  // Reiniciar conversa do lead atual no funil ativo
  function handleResetChat() {
    if (!selectedLead) return;
    if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    setAutoPilotActive(false);
    setCountdown(null);
    setChatHistories((prev) => {
      const next = { ...prev };
      delete next[chatHistoryKey];
      return next;
    });
    setFunnelStepIndex(0);
  }

  // Alterna o funil ativo e memoriza para o lead
  function handleSelectFunnel(type: FunnelType) {
    if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    setAutoPilotActive(false);
    setCountdown(null);
    setFunnelStepIndex(0);
    if (selectedLead) {
      setUserSelectedFunnelForLead((prev) => ({
        ...prev,
        [selectedLead.id]: type,
      }));
    }
  }

  // Atualiza o tempo em segundos do funil ativo
  function handleUpdateActiveTimer(seconds: number) {
    const valid = Math.max(1, Math.min(60, Number(seconds) || 5));
    setFunnelTimers((prev) => {
      const updated = { ...prev, [activeFunnelType]: valid };
      try {
        localStorage.setItem(LOCAL_STORAGE_TIMERS_KEY, JSON.stringify(updated));
      } catch {
        // Ignora
      }
      return updated;
    });
  }

  // Abre o modal de customização com clones dos scripts atuais
  function openCustomizationModal() {
    if (!baseFunnelConfigs) return;
    const initialScripts: Record<FunnelType, FunnelStepDefinition[]> = {
      cold: customScripts?.cold || baseFunnelConfigs.cold.steps,
      warm: customScripts?.warm || baseFunnelConfigs.warm.steps,
      closing: customScripts?.closing || baseFunnelConfigs.closing.steps,
    };
    setTempCustomScripts(JSON.parse(JSON.stringify(initialScripts)));
    setTempCustomTimers({ ...funnelTimers });
    setEditingFunnelType(activeFunnelType);
    setIsCustomizeModalOpen(true);
  }

  // Salva alterações personalizadas no localStorage
  function saveCustomizations() {
    if (!tempCustomScripts) return;
    setCustomScripts(tempCustomScripts);
    setFunnelTimers(tempCustomTimers);
    try {
      localStorage.setItem(LOCAL_STORAGE_FUNNELS_KEY, JSON.stringify(tempCustomScripts));
      localStorage.setItem(LOCAL_STORAGE_TIMERS_KEY, JSON.stringify(tempCustomTimers));
    } catch {
      // Ignora
    }
    setIsCustomizeModalOpen(false);
  }

  // Restaura scripts e timers padrão
  function resetToDefaults() {
    if (!baseFunnelConfigs) return;
    const defaults = {
      cold: baseFunnelConfigs.cold.steps,
      warm: baseFunnelConfigs.warm.steps,
      closing: baseFunnelConfigs.closing.steps,
    };
    const defaultTimers = { cold: 6, warm: 4, closing: 3 };
    setTempCustomScripts(JSON.parse(JSON.stringify(defaults)));
    setTempCustomTimers(defaultTimers);
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* 1. Barra Superior: Perfil Closer Luiza Ferraz + Seletor de Funil Kanban + Timer */}
      <div className="bg-muted/40 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="shadow-xs flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-caption font-bold text-white">
            LF
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-body font-bold text-foreground">{closerProfile.name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                API dos Closers Ativa
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {closerProfile.role} •{" "}
              <strong className="font-mono text-foreground">{closerProfile.phone}</strong>
            </span>
          </div>
        </div>

        {/* Controles de Funil Kanban e Timer Personalizável */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Rápido de Funis por Kanban */}
          <div className="flex items-center rounded-xl border border-border bg-background p-1 text-caption">
            <button
              type="button"
              onClick={() => handleSelectFunnel("cold")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                activeFunnelType === "cold"
                  ? "shadow-xs bg-blue-600 text-white"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Snowflake className="h-3 w-3" />
              <span>Lead Frio</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFunnel("warm")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                activeFunnelType === "warm"
                  ? "shadow-xs bg-amber-600 text-white"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Flame className="h-3 w-3" />
              <span>Lead Quente</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFunnel("closing")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                activeFunnelType === "closing"
                  ? "shadow-xs bg-emerald-600 text-white"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Target className="h-3 w-3" />
              <span>Fechamento</span>
            </button>
          </div>

          {/* Campo de Timer Personalizável em Segundos */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Timer:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={currentTimerSeconds}
              onChange={(e) => handleUpdateActiveTimer(Number(e.target.value))}
              disabled={autoPilotActive}
              className="w-10 rounded border border-border bg-card px-1 py-0.5 text-center font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Digite o tempo desejado em segundos para o timer deste funil"
            />
            <span className="font-semibold text-muted-foreground">s</span>
          </div>

          {/* Botão de Auto-Pilot com Timer */}
          <Button
            size="sm"
            variant={autoPilotActive ? "secondary" : "primary"}
            onClick={toggleAutoPilot}
            disabled={aiSalesMutation.isPending}
            className="shadow-xs gap-1.5 text-caption font-medium"
          >
            {autoPilotActive ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-500" />
                <span>Pausar Auto-Pilot ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Iniciar Auto-Pilot</span>
              </>
            )}
          </Button>

          {/* Botão para Abrir Modal de Personalização dos Scripts */}
          <Button
            size="sm"
            variant="outline"
            onClick={openCustomizationModal}
            title="Personalizar Scripts, Mensagens e Timers dos Funis"
            className="gap-1.5 text-caption font-medium"
          >
            <Sliders className="h-3.5 w-3.5 text-foreground" />
            <span className="hidden sm:inline">Personalizar Funis</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetChat}
            title="Reiniciar conversa e funil atual"
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid Principal: Lista de Leads à Esquerda + Janela de Chat à Direita */}
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12">
        {/* Coluna da Esquerda: Leads da Base */}
        <div className="flex h-full min-h-0 flex-col border-r border-border md:col-span-4 lg:col-span-4">
          {/* Caixa de Busca */}
          <div className="shrink-0 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar lead por nome, telefone ou empresa…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{filteredLeads.length} leads disponíveis</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Kanban Sincronizado
              </span>
            </div>
          </div>

          {/* Lista Rolável de Leads */}
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {filteredLeads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const isLuiza =
                lead.name.toLowerCase().includes("luiza ferraz") ||
                lead.email?.toLowerCase().includes("luizaa.fq");
              const leadTemp = lead.temperature || "cold";

              return (
                <button
                  key={lead.id}
                  onClick={() => {
                    setActiveSelectedLeadId(lead.id);
                    setFunnelStepIndex(0);
                  }}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 p-3.5 text-left transition-colors",
                    isSelected
                      ? "border-l-4 border-l-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15"
                      : "hover:bg-muted/50",
                    isLuiza && !isSelected && "bg-amber-500/5",
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-caption font-bold",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : isLuiza
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {lead.name[0]?.toUpperCase() || "L"}
                    </div>
                    {isLuiza && (
                      <span
                        title="Seu perfil de teste real"
                        className="shadow-xs absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-caption font-bold text-foreground">
                        {lead.name}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          leadTemp === "hot"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : leadTemp === "warm"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                        )}
                      >
                        {leadTemp === "hot" ? "Quente" : leadTemp === "warm" ? "Morno" : "Frio"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{lead.phone || "Sem WhatsApp"}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="truncate text-muted-foreground">
                        {lead.jobTitle || lead.company || "Mentoria Tech"}
                      </span>
                      {isLuiza && (
                        <span className="rounded bg-amber-500/15 px-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          Seu Contato
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna da Direita: Janela de Chat Integrada com o Funil Ativo */}
        <div className="flex h-full min-h-0 flex-col md:col-span-8 lg:col-span-8">
          {selectedLead && currentFunnelConfig ? (
            <>
              {/* Header do Chat com Detecção Inteligente do Kanban */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="shadow-xs flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-caption font-bold text-white">
                      {selectedLead.name[0]?.toUpperCase() || "L"}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-body font-bold text-foreground">{selectedLead.name}</h2>
                      <span className="bg-muted rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {selectedLead.company || "Empresa Tech"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedLead.phone}
                      </span>
                      <span>•</span>
                      <span>{selectedLead.jobTitle || "Engenheiro de software"}</span>
                    </div>
                  </div>
                </div>

                {/* Badge Informativa do Kanban & Sincronização */}
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-muted/80 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <span>Kanban:</span>
                    <strong className="text-foreground">
                      {kanbanSuggestedFunnel === "closing"
                        ? "Fechamento"
                        : kanbanSuggestedFunnel === "warm"
                          ? "Lead Quente"
                          : "Lead Frio"}
                    </strong>
                    {kanbanSuggestedFunnel !== activeFunnelType && (
                      <button
                        type="button"
                        onClick={() => handleSelectFunnel(kanbanSuggestedFunnel)}
                        className="ml-1 text-[10px] font-bold text-emerald-600 underline dark:text-emerald-400"
                        title="Aplicar o funil recomendado pelo estágio deste lead no Kanban"
                      >
                        Sincronizar
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Funil Atual:{" "}
                    <strong className="text-foreground">{currentFunnelConfig.name}</strong>
                  </span>
                </div>
              </div>

              {/* Barra de Passos do Funil Ativo com Botões de Disparo */}
              <div className="bg-muted/30 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] font-bold text-muted-foreground">ETAPAS:</span>
                  {currentFunnelConfig.steps.map((step, idx) => (
                    <button
                      key={`${step.stage}_${idx}`}
                      onClick={() => handleTriggerFunnelStep(idx)}
                      disabled={aiSalesMutation.isPending}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all",
                        funnelStepIndex === idx
                          ? "shadow-xs bg-primary text-primary-foreground"
                          : "hover:bg-muted bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {step.isAudio && <Mic className="h-3 w-3 text-emerald-500" />}
                      <span>
                        {idx + 1}. {step.stage.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>

                {autoPilotActive && countdown !== null && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                    <span>Próximo disparo em {countdown}s…</span>
                  </div>
                )}
              </div>

              {/* Área das Mensagens com Wallpaper Estilo WhatsApp */}
              <div className="bg-dot-pattern dark:bg-muted/10 min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {activeMessages.map((msg) => {
                  const isSdr = msg.sender === "sdr";
                  const isSystem = msg.sender === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="my-2 flex justify-center">
                        <span className="bg-muted/80 rounded-full px-3 py-1 text-[11px] text-muted-foreground">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn("flex w-full flex-col", isSdr ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "shadow-xs max-w-[85%] rounded-2xl px-4 py-2.5 text-body leading-relaxed sm:max-w-[70%]",
                          isSdr
                            ? "rounded-br-none bg-emerald-600 text-white dark:bg-emerald-700"
                            : "rounded-bl-none border border-border bg-card text-foreground",
                        )}
                      >
                        {/* Mensagem de Áudio WhatsApp Voice Note */}
                        {msg.isAudio ? (
                          <div className="flex flex-col gap-2 py-1">
                            <span className="text-[11px] font-medium opacity-90">{msg.text}</span>

                            <div className="backdrop-blur-xs flex items-center gap-3 rounded-xl bg-black/20 p-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  playVoiceNote(msg.id, msg.audioTranscript, msg.audioVoice)
                                }
                                className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 transition-transform active:scale-95"
                              >
                                {playingAudioId === msg.id ? (
                                  <VolumeX className="h-4 w-4 text-emerald-700" />
                                ) : (
                                  <Play className="ml-0.5 h-4 w-4 text-emerald-700" />
                                )}
                              </button>

                              <div className="flex flex-1 flex-col gap-1">
                                <div className="flex h-4 items-center gap-1">
                                  {[40, 70, 30, 90, 50, 80, 60, 100, 45, 65, 85, 40, 55, 75].map(
                                    (h, i) => (
                                      <span
                                        key={i}
                                        style={{ height: `${h}%` }}
                                        className={cn(
                                          "w-1 rounded-full transition-all",
                                          playingAudioId === msg.id
                                            ? "animate-pulse bg-emerald-200"
                                            : "bg-white/60",
                                        )}
                                      />
                                    ),
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-medium text-white/90">
                                  <span>
                                    {playingAudioId === msg.id
                                      ? "Reproduzindo áudio oficial…"
                                      : `Voz de ${msg.audioVoice === "cleiton" ? "Cleiton Silva (Mentor)" : "Luiza Ferraz (Closer)"}`}
                                  </span>
                                  <span className="font-mono">{msg.audioDuration || "0:38"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-line">{msg.text}</p>
                        )}

                        {/* Card Especial de Agendamento Google Meet */}
                        {msg.meetingUrl && (
                          <div className="mt-2.5 rounded-xl border border-white/20 bg-emerald-900/40 p-2.5 text-caption">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 font-bold text-white">
                                <Video className="h-4 w-4" />
                                Sessão 1:1 com Cleiton Silva
                              </span>
                              <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                Confirmado
                              </span>
                            </div>
                            <span className="mt-1 block text-[11px] text-white/80">
                              Reunião sincronizada na agenda comercial do Google Calendar
                            </span>
                          </div>
                        )}

                        {/* Metadados e Checkmarks */}
                        <div
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            isSdr ? "text-emerald-100" : "text-muted-foreground",
                          )}
                        >
                          <span>{msg.timestamp}</span>
                          {isSdr && (
                            <span className="inline-flex items-center">
                              {msg.status === "read" ? (
                                <CheckCheck className="h-3 w-3 text-sky-300" />
                              ) : (
                                <Check className="h-3 w-3 text-emerald-200" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Indicador de Digitação */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-caption text-muted-foreground">
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold">
                      {selectedLead.name[0]}
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Entrada de Mensagem (100% no CRM via API dos Closers) */}
              <form
                onSubmit={handleSendMessage}
                className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3"
              >
                <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                  <span className="hidden sm:inline">Closer: Luiza Ferraz</span>
                </div>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Mensagem para ${selectedLead.name} via API dos Closers…`}
                  className="border-input flex-1 rounded-xl border bg-background px-4 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <Button
                  type="submit"
                  disabled={!inputText.trim() || aiSalesMutation.isPending}
                  className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  title="Enviar mensagem pelo CRM via API dos Closers"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <Users className="text-muted-foreground/40 h-12 w-12" />
              <h3 className="text-body font-semibold text-foreground">Selecione um lead</h3>
              <p className="text-caption">
                Escolha um lead na lista ao lado para iniciar a conversa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Modal de Personalização dos Scripts, Funis e Timers por Kanban */}
      {isCustomizeModalOpen && tempCustomScripts && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-body font-bold text-foreground">
                  Personalizar Scripts e Timers por Kanban
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="hover:bg-muted rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Abas dos 3 Funis */}
            <div className="bg-muted/40 flex border-b border-border px-5 pt-3">
              {(
                [
                  { type: "cold", label: "Lead Frio (Script 1)", icon: Snowflake },
                  { type: "warm", label: "Lead Quente (Script 2)", icon: Flame },
                  { type: "closing", label: "Fechamento (Script 3)", icon: Target },
                ] as const
              ).map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEditingFunnelType(type)}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-2.5 text-caption font-semibold transition-all",
                    editingFunnelType === type
                      ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Corpo do Modal: Configuração do Funil Selecionado */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {/* Timer Padrão do Funil */}
              <div className="bg-muted/30 flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <span className="text-caption font-bold text-foreground">
                    Timer de Cadência do Funil ({editingFunnelType.toUpperCase()}):
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Tempo de espera em segundos entre as etapas no Auto-Pilot.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={tempCustomTimers[editingFunnelType] || 5}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(60, Number(e.target.value) || 5));
                      setTempCustomTimers((prev) => ({ ...prev, [editingFunnelType]: val }));
                    }}
                    className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-caption font-semibold text-muted-foreground">segundos</span>
                </div>
              </div>

              {/* Lista de Etapas do Script */}
              <div className="space-y-3">
                <h4 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
                  Etapas do Script de Vendas ({tempCustomScripts[editingFunnelType].length} etapas)
                </h4>

                {tempCustomScripts[editingFunnelType].map((step, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-xl border border-border bg-background p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-bold text-foreground">
                        Etapa {idx + 1}: {step.stage.replace("_", " ")}
                      </span>
                      {step.isAudio && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <Mic className="h-3 w-3" />
                          Áudio de Voz ({step.audioVoice === "cleiton" ? "Cleiton" : "Luiza"})
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Mensagem da Closer / SDR:
                      </label>
                      <textarea
                        rows={2}
                        value={step.sdr}
                        onChange={(e) => {
                          const newText = e.target.value;
                          setTempCustomScripts((prev) => {
                            if (!prev) return prev;
                            const clone = { ...prev };
                            const steps = [...clone[editingFunnelType]];
                            const targetStep = steps[idx];
                            if (targetStep) {
                              steps[idx] = { ...targetStep, sdr: newText };
                            }
                            clone[editingFunnelType] = steps;
                            return clone;
                          });
                        }}
                        className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Resposta esperada do Lead:
                      </label>
                      <textarea
                        rows={1}
                        value={step.leadResponse}
                        onChange={(e) => {
                          const newText = e.target.value;
                          setTempCustomScripts((prev) => {
                            if (!prev) return prev;
                            const clone = { ...prev };
                            const steps = [...clone[editingFunnelType]];
                            const targetStep = steps[idx];
                            if (targetStep) {
                              steps[idx] = { ...targetStep, leadResponse: newText };
                            }
                            clone[editingFunnelType] = steps;
                            return clone;
                          });
                        }}
                        className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {step.isAudio && (
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Transcrição do Áudio de Voz:
                        </label>
                        <textarea
                          rows={2}
                          value={step.audioTranscript || ""}
                          onChange={(e) => {
                            const newText = e.target.value;
                            setTempCustomScripts((prev) => {
                              if (!prev) return prev;
                              const clone = { ...prev };
                              const steps = [...clone[editingFunnelType]];
                              const targetStep = steps[idx];
                              if (targetStep) {
                                steps[idx] = { ...targetStep, audioTranscript: newText };
                              }
                              clone[editingFunnelType] = steps;
                              return clone;
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-muted/30 flex items-center justify-between border-t border-border px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="text-caption text-muted-foreground hover:text-foreground"
              >
                Restaurar Padrão
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCustomizeModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveCustomizations}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Personalização</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
