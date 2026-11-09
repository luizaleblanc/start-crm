"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCheck,
  Clock,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  User,
  Users,
  Video,
  Volume2,
  VolumeX,
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

const FUNNEL_STEPS = [
  { id: "primeiro_contato", label: "1. Abordagem", short: "1. Abordar", hasAudio: false },
  { id: "qualificacao", label: "2. Diagnóstico", short: "2. Diagnóstico", hasAudio: false },
  { id: "apresentacao", label: "3. Áudio Cleiton", short: "3. Áudio Cleiton", hasAudio: true },
  { id: "objecao_preco", label: "4. Áudio Luiza", short: "4. Áudio Luiza", hasAudio: true },
  { id: "agendamento_call", label: "5. Google Meet", short: "5. Agendar Call", hasAudio: false },
  { id: "fechamento", label: "6. Fechamento", short: "6. Fechar Venda", hasAudio: false },
];

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

  // Controle de Timer e Auto-Pilot do Funil
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5); // Padrão 5 segundos
  const [countdown, setCountdown] = useState<number | null>(null);
  const [funnelStepIndex, setFunnelStepIndex] = useState(0);

  // Reprodução de áudio de voz oficial
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Armazenamento de histórico de conversas em memória por lead
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Perfil da Usuária: Luiza Ferraz
  const closerProfile = {
    name: "Luiza Ferraz",
    role: "Closer & Co-fundadora",
    phone: "+55 (16) 99968-1670",
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

  // Mensagens da conversa atual (inicia com apenas 1 mensagem sem duplicar)
  const activeMessages: ChatMessage[] = useMemo(() => {
    if (!selectedLead) return [];
    const history = chatHistories[selectedLead.id];
    if (history && history.length > 0) {
      return history;
    }
    const firstName = selectedLead.name.split(" ")[0] || "Dev";
    const cargo = selectedLead.jobTitle || "Engenheiro de software";
    return [
      {
        id: `msg_init_${selectedLead.id}`,
        sender: "sdr",
        text: `Olá, ${firstName}! Tudo bem? Sou a Luiza Ferraz, closer da Mentoria Tech do Cleiton Silva. Vi seu perfil no LinkedIn como ${cargo} e seu interesse no nosso acelerador de carreira tech. Posso te fazer uma pergunta rápida sobre seu momento profissional?`,
        timestamp: "10:30",
        status: "read",
        stage: "primeiro_contato",
      },
    ];
  }, [selectedLead, chatHistories]);

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
      // Fallback de animação se o navegador não suportar síntese de voz
      setPlayingAudioId(msgId);
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  }

  // Mutação para avançar etapa no funil via backend de IA (sem duplicar mensagem)
  const aiSalesMutation = useMutation({
    mutationFn: (vars: { leadId: string; stepIndex: number; userMessage?: string }) =>
      apiFetch<{
        success: boolean;
        stepIndex: number;
        nextStepIndex: number;
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
      const leadId = selectedLead.id;

      setChatHistories((prev) => {
        const current = prev[leadId] || activeMessages;
        // Evita duplicar se a mensagem já estiver no histórico
        const alreadyExists = current.some((m) => m.text.trim() === data.sdrMessage.text.trim());
        const updated = alreadyExists ? current : [...current, data.sdrMessage];
        return {
          ...prev,
          [leadId]: updated,
        };
      });

      // Simula digitação realista do Lead
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatHistories((prev) => {
          const current = prev[leadId] || [];
          return {
            ...prev,
            [leadId]: [...current, data.leadResponse],
          };
        });
        setFunnelStepIndex(data.nextStepIndex);
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
      }, 1300);
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
      [selectedLead.id]: [...(prev[selectedLead.id] || activeMessages), newMsg],
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

    // Resposta de simulação do Lead
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Entendi perfeitamente! Como funciona o acompanhamento do Cleiton?";
      if (userText.toLowerCase().includes("preço") || userText.toLowerCase().includes("quanto")) {
        replyText = "Qual o investimento da mentoria e as formas de parcelamento?";
      } else if (
        userText.toLowerCase().includes("reunião") ||
        userText.toLowerCase().includes("meet") ||
        userText.toLowerCase().includes("horário")
      ) {
        replyText = "Amanhã às 15h fica excelente para mim!";
      }

      const leadReply: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        sender: "lead",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedLead.id]: [...(prev[selectedLead.id] || []), leadReply],
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
    });
  }

  // Iniciar / Pausar Auto-Pilot com Timer configurável
  function toggleAutoPilot() {
    if (autoPilotActive) {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
      setAutoPilotActive(false);
      setCountdown(null);
      return;
    }

    if (!selectedLead) return;
    setAutoPilotActive(true);

    // O Auto-Pilot começa no passo 1 (Diagnóstico) para não duplicar a abordagem inicial
    let currentStep = funnelStepIndex === 0 ? 1 : funnelStepIndex;
    setCountdown(timerSeconds);

    let remaining = timerSeconds;
    autoPilotTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (currentStep >= FUNNEL_STEPS.length) {
          if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
          setAutoPilotActive(false);
          setCountdown(null);
          return;
        }

        handleTriggerFunnelStep(currentStep);
        currentStep += 1;
        remaining = timerSeconds;
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

  // Reiniciar conversa do lead atual
  function handleResetChat() {
    if (!selectedLead) return;
    if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    setAutoPilotActive(false);
    setCountdown(null);
    setChatHistories((prev) => {
      const next = { ...prev };
      delete next[selectedLead.id];
      return next;
    });
    setFunnelStepIndex(0);
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Barra Superior: Perfil Closer Luiza Ferraz + Controles do Funil com Timer */}
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

        {/* Controles de Funil Automático com Timer */}
        <div className="flex items-center gap-2">
          {/* Seletor de Intervalo de Timer */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px]">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Timer:</span>
            <select
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              disabled={autoPilotActive}
              className="bg-transparent font-semibold text-foreground focus:outline-none"
            >
              <option value={3}>3s (Rápido)</option>
              <option value={5}>5s (Padrão)</option>
              <option value={8}>8s (Realista)</option>
              <option value={12}>12s (Cadência)</option>
            </select>
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
                <span>Iniciar Auto-Pilot do Funil</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetChat}
            title="Reiniciar conversa e funil"
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid Principal: Lista de Leads à Esquerda + Janela de Chat à Direita */}
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12">
        {/* Coluna da Esquerda: Leads da Base (4 colunas no desktop) */}
        <div className="flex h-full min-h-0 flex-col border-r border-border md:col-span-4 lg:col-span-4">
          {/* Caixa de Busca */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar lead por nome, cargo ou celular…"
                className="border-input w-full rounded-xl border bg-background py-1.5 pl-8 pr-3 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{filteredLeads.length.toLocaleString("pt-BR")} leads</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                100% no CRM
              </span>
            </div>
          </div>

          {/* Lista Scrollável de Leads */}
          <div className="divide-border/60 min-h-0 flex-1 divide-y overflow-y-auto">
            {filteredLeads.slice(0, 150).map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const isLuiza =
                lead.name.toLowerCase().includes("luiza ferraz") ||
                lead.name.toLowerCase().includes("luísa") ||
                lead.name.toLowerCase().includes("luisa");
              const initials = lead.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <button
                  key={lead.id}
                  onClick={() => {
                    setActiveSelectedLeadId(lead.id);
                    setFunnelStepIndex(0);
                  }}
                  className={cn(
                    "hover:bg-muted/50 flex w-full items-start gap-3 p-3 text-left transition-colors",
                    isSelected && "bg-primary/10 hover:bg-primary/15",
                    isLuiza && !isSelected && "bg-amber-500/5",
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-caption font-semibold",
                        isLuiza
                          ? "bg-amber-500 text-white"
                          : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-caption font-semibold text-foreground">
                        {lead.name}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                        {lead.funnelStageId === "stage_fechamento"
                          ? "Fechou"
                          : lead.funnelStageId === "stage_proposta"
                            ? "Proposta"
                            : "Qualificação"}
                      </span>
                    </div>

                    <span className="truncate text-[11px] text-muted-foreground">
                      {lead.jobTitle} {lead.company ? `• ${lead.company}` : ""}
                    </span>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-foreground/80 font-mono text-[11px]">
                        {lead.phone || "Sem celular"}
                      </span>
                      {isLuiza && (
                        <span className="py-0.2 rounded bg-amber-500/20 px-1.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                          Seu Perfil
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna da Direita: Janela de Chat Ativa (8 colunas no desktop) */}
        <div className="flex h-full min-h-0 flex-col md:col-span-8 lg:col-span-8">
          {selectedLead ? (
            <>
              {/* Header do Chat Ativo */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-caption font-bold text-primary">
                    {selectedLead.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-body font-bold text-foreground">{selectedLead.name}</h2>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        • online no WhatsApp
                      </span>
                    </div>
                    <span className="text-caption text-muted-foreground">
                      {selectedLead.jobTitle} • {selectedLead.company} •{" "}
                      <strong className="font-mono text-foreground">{selectedLead.phone}</strong>
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas de CRM */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/calendar`}
                    className="hover:bg-muted inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-caption font-medium text-foreground"
                  >
                    <Video className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">Google Meet</span>
                  </Link>

                  <span className="bg-primary/10 rounded-lg px-2.5 py-1 text-caption font-semibold text-primary">
                    {selectedLead.funnelStageId === "stage_fechamento"
                      ? "Fechamento"
                      : selectedLead.funnelStageId === "stage_proposta"
                        ? "Proposta / Call"
                        : "Qualificação"}
                  </span>
                </div>
              </div>

              {/* Barra Interativa das 6 Etapas do Funil do Cleiton */}
              <div className="bg-muted/20 flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-border px-4 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] font-bold text-muted-foreground">
                    FUNIL CLEITON:
                  </span>
                  {FUNNEL_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => handleTriggerFunnelStep(idx)}
                      disabled={aiSalesMutation.isPending}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all",
                        funnelStepIndex === idx
                          ? "shadow-xs bg-primary text-primary-foreground"
                          : "hover:bg-muted bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {step.hasAudio && <Mic className="h-3 w-3 text-emerald-500" />}
                      <span>{step.short}</span>
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
                        {/* Mensagem de Áudio Oficial WhatsApp Voice Note */}
                        {msg.isAudio ? (
                          <div className="flex flex-col gap-2 py-1">
                            <span className="text-[11px] font-medium opacity-90">{msg.text}</span>

                            {/* Player de Voz WhatsApp */}
                            <div className="backdrop-blur-xs flex items-center gap-3 rounded-xl bg-black/20 p-2.5">
                              {/* Botão Play / Pause */}
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

                              {/* Barra de Ondas Sonoras e Duração */}
                              <div className="flex flex-1 flex-col gap-1">
                                <div className="flex h-4 items-center gap-0.5">
                                  {[
                                    40, 75, 50, 90, 60, 30, 80, 100, 45, 65, 85, 30, 50, 70, 90, 60,
                                  ].map((h, i) => (
                                    <span
                                      key={i}
                                      style={{ height: `${h}%` }}
                                      className={cn(
                                        "w-1 rounded-full transition-all",
                                        playingAudioId === msg.id
                                          ? "animate-pulse bg-white"
                                          : "bg-white/60",
                                      )}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-white/90">
                                  <span>
                                    {playingAudioId === msg.id
                                      ? "Tocando áudio…"
                                      : `Mensagem de voz • ${msg.audioDuration || "0:38"}`}
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-wider">
                                    {msg.audioVoice === "cleiton"
                                      ? "Cleiton Silva"
                                      : "Luiza Ferraz"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Cartão de Agendamento do Google Meet */}
                        {msg.meetingUrl && (
                          <div className="mt-2.5 rounded-xl border border-white/20 bg-white/10 p-2.5 text-caption">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold text-white">
                                <Video className="h-4 w-4" />
                                <span>Google Meet 1:1 Agendado</span>
                              </div>
                              <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                Confirmado
                              </span>
                            </div>
                            <span className="mt-1 block text-[11px] text-white/80">
                              Reunião sincronizada na agenda comercial do Google Calendar
                            </span>
                          </div>
                        )}

                        {/* Rodapé da mensagem: Horário e Status */}
                        <div
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            isSdr ? "text-white/80" : "text-muted-foreground",
                          )}
                        >
                          <span>{msg.timestamp}</span>
                          {isSdr && (
                            <CheckCheck
                              className={cn(
                                "h-3.5 w-3.5",
                                msg.status === "read" ? "text-sky-300" : "text-white/60",
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Indicador de Digitação do Lead ou da IA */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-caption text-muted-foreground">
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold">
                      {selectedLead.name[0]}
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                      <span className="ml-1 text-[11px]">{selectedLead.name} está digitando…</span>
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
    </div>
  );
}
