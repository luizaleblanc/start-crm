import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Lead,
  LeadInteraction,
  LeadInteractionType,
  LeadOwnership,
  Meeting,
} from "@/modules/crm/domain/entities";
import { apiFetch } from "@/shared/infrastructure/http/api-client";
import type { PaginatedResult } from "@/shared/domain/pagination";

export function useLeads(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["leads", { page, pageSize }],
    queryFn: () => apiFetch<PaginatedResult<Lead>>(`/api/leads?page=${page}&pageSize=${pageSize}`),
  });
}

export function useLead(leadId: string) {
  return useQuery({
    queryKey: ["leads", leadId],
    queryFn: () => apiFetch<Lead>(`/api/leads/${leadId}`),
    enabled: Boolean(leadId),
  });
}

export function useLeadInteractions(leadId: string) {
  return useQuery({
    queryKey: ["lead-interactions", leadId],
    queryFn: () =>
      apiFetch<PaginatedResult<LeadInteraction>>(
        `/api/lead-interactions?leadId=${leadId}&pageSize=100`,
      ),
    enabled: Boolean(leadId),
  });
}

export function useLeadMeetings(leadId: string) {
  return useQuery({
    queryKey: ["meetings", leadId],
    queryFn: () =>
      apiFetch<PaginatedResult<Meeting>>(`/api/meetings?leadId=${leadId}&pageSize=100`),
    enabled: Boolean(leadId),
  });
}

export function useLeadOwnerships(leadId: string) {
  return useQuery({
    queryKey: ["lead-ownerships", leadId],
    queryFn: () =>
      apiFetch<PaginatedResult<LeadOwnership>>(
        `/api/lead-ownerships?leadId=${leadId}&pageSize=100`,
      ),
    enabled: Boolean(leadId),
  });
}

export function useChangeLeadStage(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (funnelStageId: string) =>
      apiFetch<Lead>(`/api/crm/leads/${leadId}/stage`, {
        method: "PATCH",
        body: { funnelStageId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAssignLead(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<LeadOwnership>(`/api/crm/leads/${leadId}/assign`, {
        method: "POST",
        body: { userId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-ownerships", leadId] });
    },
  });
}

interface AddInteractionInput {
  userId: string;
  type: LeadInteractionType;
  notes: string;
}

export function useAddLeadInteraction(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddInteractionInput) =>
      apiFetch<LeadInteraction>(`/api/crm/leads/${leadId}/interactions`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", leadId] });
    },
  });
}

interface ScheduleMeetingInput {
  userId: string;
  scheduledAt: string;
  notes: string;
}

export function useScheduleMeeting(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleMeetingInput) =>
      apiFetch<Meeting>(`/api/crm/leads/${leadId}/meetings`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", leadId] });
    },
  });
}

export function useDeleteLeadInteraction(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interactionId: string) =>
      apiFetch<void>(`/api/lead-interactions/${interactionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", leadId] });
    },
  });
}

export function useDeleteMeeting(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) =>
      apiFetch<void>(`/api/meetings/${meetingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", leadId] });
    },
  });
}
