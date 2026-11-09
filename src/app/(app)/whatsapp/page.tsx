"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  MessageCircle,
  Paperclip,
  Phone,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { apiFetch } from "@/shared/infrastructure/http/api-client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
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
}

const FUNNEL_STEPS = [
  { id: "primeiro_contato", label: "1. Abordagem", short: "Abordar" },
  { id: "qualificacao", label: "2. Diagnóstico", short: "Qualificar" },
  { id: "apresentacao", label: "3. Mentoria Tech", short: "Apresentar" },
  { id: "objecao_preco", label: "4. Objeção Preço", short: "Objeção" },
  { id: "agendamento_call", label: "5. Call Google Meet", short: "Agendar" },
  { id: "fechamento", label: "6. Fechamento", short: "Fechar" },
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
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [funnelStepIndex, setFunnelStepIndex] = useState(0);

  // Armazenamento de histórico de conversas em memória por lead
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Seleciona o lead passado via URL ou Luísa Buranelo ou o primeiro lead automaticamente
  const defaultLeadId = useMemo(() => {
    if (paramLeadId) return paramLeadId;
    const luisa = leads.find(
      (l) =>
        l.name.toLowerCase().includes("luísa") ||
        l.name.toLowerCase().includes("luisa") ||
        l.email.toLowerCase().includes("luisa"),
    );
    return luisa ? luisa.id : leads[0]?.id || "";
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

  // Mensagens da conversa atual
  const activeMessages: ChatMessage[] = useMemo(() => {
    if (!selectedLead) return [];
    const history = chatHistories[selectedLead.id];
    if (history) {
      return history;
    }
    // Mensagem inicial de acolhimento padrão para o lead
    const firstName = selectedLead.name.split(" ")[0] || "Dev";
    const cargo = selectedLead.jobTitle || "Engenheiro de software";
    return [
      {
        id: "msg_init",
        sender: "sdr",
        text: `Olá, ${firstName}! Tudo bem? Sou do time do Cleiton Silva (Mentoria Tech). Vi seu perfil atuando como ${cargo} e seu interesse no nosso conteúdo sobre aceleração de carreira tech. Posso te fazer uma pergunta rápida sobre seu momento profissional?`,
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

  // Mutação para avançar etapa no funil via backend de IA
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
      // Adiciona mensagem do SDR
      setChatHistories((prev) => {
        const current = prev[leadId] || activeMessages;
        return {
          ...prev,
          [leadId]: [...current, data.sdrMessage],
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
      }, 1400);
    },
  });

  // Envio de mensagem manual digitada pelo usuário
  function handleSendMessage(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedLead) return;

    const userText = inputText.trim();
    setInputText("");

    const newMsg: ChatMessage = {
      id: `msg_manual_${Date.now()}`,
      sender: "sdr",
      text: userText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    };

    setChatHistories((prev) => ({
      ...prev,
      [selectedLead.id]: [...(prev[selectedLead.id] || activeMessages), newMsg],
    }));

    // Dispara resposta de simulação do Lead
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText =
        "Legal, entendi! Como você acha que a mentoria do Cleiton se aplica para mim?";
      if (userText.toLowerCase().includes("preço") || userText.toLowerCase().includes("quanto")) {
        replyText = "Qual seria o valor do investimento para o acompanhamento individual?";
      } else if (
        userText.toLowerCase().includes("reunião") ||
        userText.toLowerCase().includes("meet") ||
        userText.toLowerCase().includes("horário")
      ) {
        replyText = "Amanhã à tarde seria perfeito para mim!";
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

  // Executa o próximo passo do funil de vendas
  function handleTriggerFunnelStep(stepIdx: number) {
    if (!selectedLead || aiSalesMutation.isPending) return;
    setFunnelStepIndex(stepIdx);
    aiSalesMutation.mutate({
      leadId: selectedLead.id,
      stepIndex: stepIdx,
    });
  }

  // Auto-Pilot: simula todo o funil do início ao fim com delay natural
  function handleStartAutoPilot() {
    if (!selectedLead || autoPilotActive) return;
    setAutoPilotActive(true);

    let current = 0;
    const interval = setInterval(() => {
      if (current >= FUNNEL_STEPS.length) {
        clearInterval(interval);
        setAutoPilotActive(false);
        return;
      }
      handleTriggerFunnelStep(current);
      current++;
    }, 3800);
  }

  // Reiniciar conversa do lead atual
  function handleResetChat() {
    if (!selectedLead) return;
    setChatHistories((prev) => {
      const next = { ...prev };
      delete next[selectedLead.id];
      return next;
    });
    setFunnelStepIndex(0);
  }

  // Disparar a mensagem real para o WhatsApp físico do lead
  function handleDispatchToRealWhatsApp() {
    if (!selectedLead?.phone) return;
    const cleanDigits = selectedLead.phone.replace(/\D/g, "");
    const fullNumber = cleanDigits.startsWith("55") ? cleanDigits : `55${cleanDigits}`;
    const lastSdrMsg =
      [...activeMessages].reverse().find((m) => m.sender === "sdr")?.text ||
      `Olá ${selectedLead.name.split(" ")[0]}! Tudo bem? Sou do time do Cleiton Silva (Mentoria Tech).`;

    // Dispara tentativa na API do CRM
    apiFetch("/api/integrations/whatsapp", {
      method: "POST",
      body: {
        to: fullNumber,
        message: lastSdrMsg,
        leadId: selectedLead.id,
      },
    }).catch(() => null);

    // Abre o WhatsApp no celular ou web com a mensagem real direcionada
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(lastSdrMsg)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Barra Superior Informativa do WhatsApp Cloud API */}
      <div className="bg-muted/40 flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-foreground">WhatsApp Business Chat</span>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline-flex dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Meta Cloud API v20.0 Integrada
            </span>
          </div>
        </div>

        {/* Controles de Automação de IA */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={autoPilotActive ? "secondary" : "outline"}
            onClick={handleStartAutoPilot}
            disabled={autoPilotActive || aiSalesMutation.isPending}
            className="gap-1.5 text-caption font-medium"
          >
            <Play className={cn("h-3.5 w-3.5", autoPilotActive && "animate-spin text-primary")} />
            {autoPilotActive ? "Auto-Pilot em Execução…" : "Auto-Pilot Funil Completo"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetChat}
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid Principal: Lista de Contatos à Esquerda + Janela de Chat à Direita */}
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12">
        {/* Coluna da Esquerda: Leads & Conversas (4 colunas no desktop) */}
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
              <span>{filteredLeads.length.toLocaleString("pt-BR")} leads disponíveis</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Planilha Sincronizada
              </span>
            </div>
          </div>

          {/* Lista Scrollável de Leads */}
          <div className="divide-border/60 min-h-0 flex-1 divide-y overflow-y-auto">
            {filteredLeads.slice(0, 150).map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const isLuisa =
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
                    isLuisa && !isSelected && "bg-amber-500/5",
                  )}
                >
                  {/* Avatar com status */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-caption font-semibold",
                        isLuisa
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

                  {/* Detalhes do Lead */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-caption font-semibold text-foreground">
                        {lead.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {lead.funnelStageId === "stage_fechamento"
                          ? "Fechou"
                          : lead.funnelStageId === "stage_proposta"
                            ? "Proposta"
                            : "Qualificando"}
                      </span>
                    </div>

                    <span className="truncate text-[11px] text-muted-foreground">
                      {lead.jobTitle} {lead.company ? `• ${lead.company}` : ""}
                    </span>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-foreground/80 font-mono text-[11px]">
                        {lead.phone || "Sem celular"}
                      </span>
                      {isLuisa && (
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
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        • online
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
                  <button
                    type="button"
                    onClick={handleDispatchToRealWhatsApp}
                    className="shadow-xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-caption font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    title={`Disparar mensagem no WhatsApp real de ${selectedLead.name} (${selectedLead.phone})`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Disparar no WhatsApp Real</span>
                    <span className="sm:hidden">Disparar</span>
                  </button>

                  <Link
                    href={`/calendar`}
                    className="hover:bg-muted inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-caption font-medium text-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">Google Calendar</span>
                  </Link>

                  <span className="bg-primary/10 rounded-lg px-2 py-1 text-caption font-semibold text-primary">
                    {selectedLead.funnelStageId === "stage_fechamento"
                      ? "Fechamento"
                      : selectedLead.funnelStageId === "stage_proposta"
                        ? "Proposta / Call"
                        : "Qualificação"}
                  </span>
                </div>
              </div>

              {/* Barra do Funil de Vendas do Cleiton (Etapas Interativas) */}
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
                        "rounded-lg px-2 py-1 text-[11px] font-medium transition-all",
                        funnelStepIndex === idx
                          ? "shadow-xs bg-primary text-primary-foreground"
                          : "hover:bg-muted bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {step.short}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>IA de Pré-Venda Ativa</span>
                </div>
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
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Cartão de Agendamento do Google Meet se houver */}
                        {msg.meetingUrl && (
                          <div className="mt-2.5 rounded-xl border border-white/20 bg-white/10 p-2.5 text-caption">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold text-white">
                                <Video className="h-4 w-4" />
                                <span>Google Meet 1:1 Agendado</span>
                              </div>
                              <a
                                href={msg.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-white/90"
                              >
                                Acessar Sala
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <span className="mt-1 block text-[11px] text-white/80">
                              Convite sincronizado com o Google Workspace Calendar
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

              {/* Barra de Entrada de Mensagem com WhatsApp Web Styling */}
              <form
                onSubmit={handleSendMessage}
                className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3"
              >
                <button
                  type="button"
                  title="Anexar Proposta ou Material Isca"
                  onClick={() => {
                    setInputText((prev) =>
                      prev
                        ? `${prev} [PDF: Apresentação Mentoria Tech]`
                        : "[PDF: Apresentação Mentoria Tech]",
                    );
                  }}
                  className="hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Mensagem para ${selectedLead.name} via Meta Cloud API…`}
                  className="border-input flex-1 rounded-xl border bg-background px-4 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <Button
                  type="submit"
                  disabled={!inputText.trim() || aiSalesMutation.isPending}
                  className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <MessageCircle className="text-muted-foreground/40 h-12 w-12" />
              <h3 className="text-body font-semibold text-foreground">
                Nenhuma conversa selecionada
              </h3>
              <p className="text-caption">
                Selecione um lead da planilha ao lado para iniciar a pré-venda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
