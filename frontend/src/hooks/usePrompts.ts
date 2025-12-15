import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptsApi } from '../services/api'
import { useCreateModal } from './useCreateModal'

export function usePrompts(useCaseId: string | undefined) {
  return useQuery({
    queryKey: ['prompts', useCaseId],
    queryFn: () => promptsApi.list(useCaseId!).then(r => r.data),
    enabled: !!useCaseId,
  })
}

export function usePrompt(promptId: string | undefined) {
  return useQuery({
    queryKey: ['prompt', promptId],
    queryFn: () => promptsApi.get(promptId!).then(r => r.data),
    enabled: !!promptId,
  })
}

export function usePromptVersions(promptId: string | undefined) {
  return useQuery({
    queryKey: ['versions', promptId],
    queryFn: () => promptsApi.listVersions(promptId!).then(r => r.data),
    enabled: !!promptId,
  })
}

export function useCreatePrompt(useCaseId: string | undefined) {
  return useCreateModal({
    queryKey: ['prompts', useCaseId || ''],
    mutationFn: (name) => promptsApi.create(useCaseId!, { name }),
  })
}

export function useCreateVersion(promptId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { 
      type: 'text' | 'chat'; 
      template_text?: string; 
      template_messages?: { role: string; content: string }[];
      commit_message: string 
    }) =>
      promptsApi.createVersion(promptId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', promptId] })
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] })
    },
  })
}

export function useUpdatePrompt(promptId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name?: string; description?: string; tags?: string[] }) =>
      promptsApi.update(promptId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] })
    },
  })
}

export function usePromoteVersion(promptId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ versionNumber, label }: { versionNumber: number; label: string }) =>
      promptsApi.promote(promptId!, versionNumber, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', promptId] })
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] })
    },
  })
}

export function useDemoteVersion(promptId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ versionNumber, label }: { versionNumber: number; label: string }) =>
      promptsApi.demote(promptId!, versionNumber, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', promptId] })
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] })
    },
  })
}
