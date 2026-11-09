"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { apiFetch } from "@/shared/infrastructure/http/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { cn } from "@/shared/ui/cn";

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
}

interface WhatsAppApiStatus {
  status: string;
  provider: string;
  apiVersion: string;
  phoneId: string;
  wabaId: string;
  templates: WhatsAppTemplate[];
}

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const leadsQuery = useLeads(1, 1500);
  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);

  const apiInfoQuery = useQuery({
    queryKey: ["whatsapp-api-info"],
    queryFn: () => apiFetch<WhatsAppApiStatus>("/api/integrations/whatsapp"),
  });
  const apiInfo = apiInfoQuery.data ?? null;

  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("presentation");
  const [message, setMessage] = useState(
    "Olá! Tudo bem? Sou da equipe do Start CRM. Vi seu interesse em acelerar sua operação comercial e gostaria de bater um papo rápido de 10 min. Podemos conversar hoje?",
  );
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId);
  }, [leads, selectedLeadId]);

  function compileTemplate(templateId: string, leadFirstName?: string) {
    const template = apiInfo?.templates.find((t) => t.id === templateId);
    if (!template) return;
    return template.body
      .replace("{{1}}", leadFirstName || "cliente")
      .replace("{{2}}", "amanhã às 14h")
      .replace("{{3}}", "meet.google.com/crm-demo");
  }

  function handleLeadChange(leadId: string) {
    setSelectedLeadId(leadId);
    const chosen = leads.find((l) => l.id === leadId);
    if (chosen) {
      if (chosen.phone) setPhone(chosen.phone);
      const firstName = chosen.name.split(" ")[0] || "";
      const compiled = compileTemplate(selectedTemplateId, firstName);
      if (compiled) setMessage(compiled);
    }
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    if (templateId === "custom") {
      setMessage("");
      return;
    }
    const firstName = selectedLead?.name.split(" ")[0] || "";
    const compiled = compileTemplate(templateId, firstName);
    if (compiled) setMessage(compiled);
  }

  const sendMutation = useMutation({
    mutationFn: (body: { to: string; message: string; leadId?: string }) =>
      apiFetch<{
        success: boolean;
        messageId: string;
        clickToChatUrl: string;
      }>("/api/integrations/whatsapp", {
        method: "POST",
        body,
      }),
    onSuccess: (data) => {
      setSendSuccess(`Mensagem despachada com sucesso! ID: ${data.messageId}`);
      queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
    },
    onError: (err: unknown) => {
      console.error("[whatsapp] Erro ao enviar:", err);
    },
  });

  function handleSendApi(event: FormEvent) {
    event.preventDefault();
    if (!phone || !message) return;
    setSendSuccess(null);
    sendMutation.mutate({
      to: phone,
      message,
      leadId: selectedLeadId || undefined,
    });
  }

  function handleOpenWhatsAppWeb() {
    if (!phone || !message) return;
    const digits = phone.replace(/\D/g, "");
    const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${fullNumber}?text=${text}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              WhatsApp Business API
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Meta Cloud API v20.0 Ativa
            </span>
          </div>
          <p className="text-caption text-muted-foreground sm:text-body">
            Envio de mensagens automatizadas, templates homologados e registro direto no histórico
            comercial.
          </p>
        </div>
      </div>

      {/* Grid de Configuração & Compositor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel Esquerdo: Formulário de Envio (7 colunas) */}
        <div className="shadow-xs flex flex-col gap-5 rounded-2xl bg-card p-6 lg:col-span-7">
          <h2 className="text-body font-bold text-foreground">Disparador de Mensagem</h2>

          <form className="flex flex-col gap-4" onSubmit={handleSendApi}>
            <div>
              <label className="mb-1 block text-caption font-medium text-foreground">
                Selecionar Lead da Base ({leads.length.toLocaleString("pt-BR")} leads)
              </label>
              <Select
                value={selectedLeadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="w-full"
              >
                <option value="">Selecione um lead da planilha...</option>
                {leads.slice(0, 300).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.company ? `— ${l.company}` : ""} ({l.phone || l.email})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Telefone com DDD"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 98888-0000"
                required
              />

              <div>
                <label className="mb-1 block text-caption font-medium text-foreground">
                  Template de Mensagem
                </label>
                <Select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full"
                >
                  <option value="presentation">Apresentação Comercial</option>
                  <option value="meeting_invite">Confirmação de Reunião</option>
                  <option value="proposal_followup">Acompanhamento de Proposta</option>
                  <option value="custom">Mensagem Livre / Customizada</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-caption font-medium text-foreground">
                Conteúdo da Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="border-input w-full rounded-xl border bg-background p-3 text-body text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Digite a mensagem para o lead..."
                required
              />
            </div>

            {sendSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-caption font-medium text-emerald-600 dark:text-emerald-400">
                {sendSuccess}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="submit"
                isLoading={sendMutation.isPending}
                className="shadow-xs rounded-full"
              >
                <Send size={14} />
                Enviar via Cloud API
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenWhatsAppWeb}
                className="shadow-xs rounded-full"
              >
                <MessageCircle size={14} className="text-emerald-500" />
                Abrir no WhatsApp Web
              </Button>
            </div>
          </form>
        </div>

        {/* Painel Direito: Preview do Balão de WhatsApp (5 colunas) */}
        <div className="shadow-xs flex flex-col justify-between rounded-2xl bg-card p-6 lg:col-span-5">
          <div className="border-border/40 flex items-center justify-between border-b pb-3">
            <span className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
              Pré-visualização WhatsApp
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Live Preview
            </span>
          </div>

          {/* Celular / Janela de Chat Mockup */}
          <div className="border-border/50 my-6 rounded-2xl border bg-[#efeae2] p-4 shadow-inner dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {selectedLead ? selectedLead.name.charAt(0) : "S"}
              </div>
              <div className="flex flex-col">
                <span className="text-caption font-bold text-zinc-800 dark:text-zinc-100">
                  {selectedLead ? selectedLead.name : "Lead Selecionado"}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Online</span>
              </div>
            </div>

            {/* Balão de mensagem */}
            <div className="flex justify-end">
              <div className="relative max-w-[85%] rounded-2xl rounded-tr-none bg-[#d9fdd3] p-3 text-caption text-zinc-900 shadow-sm dark:bg-emerald-800/80 dark:text-white">
                <p className="whitespace-pre-line leading-relaxed">
                  {message || "Selecione um lead ou digite uma mensagem para visualizar."}
                </p>
                <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-zinc-500 dark:text-zinc-300">
                  <span>
                    {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <CheckCheck size={12} className="text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-border/40 bg-muted/30 rounded-xl border p-3 text-[11px] text-muted-foreground">
            Todas as mensagens enviadas ficam salvas na linha do tempo do lead em{" "}
            <strong>Interações</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
