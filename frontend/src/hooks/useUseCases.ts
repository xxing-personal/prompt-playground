import { useQuery } from '@tanstack/react-query'
import { useCasesApi } from '../services/api'
import { useCreateModal } from './useCreateModal'

export function useUseCases(projectId: string | undefined) {
  return useQuery({
    queryKey: ['useCases', projectId],
    queryFn: () => useCasesApi.list(projectId!).then(r => r.data),
    enabled: !!projectId,
  })
}

export function useUseCase(useCaseId: string | undefined) {
  return useQuery({
    queryKey: ['useCase', useCaseId],
    queryFn: () => useCasesApi.get(useCaseId!).then(r => r.data),
    enabled: !!useCaseId,
  })
}

export function useCreateUseCase(projectId: string | undefined) {
  return useCreateModal({
    queryKey: ['useCases', projectId || ''],
    mutationFn: (name) => useCasesApi.create(projectId!, { name }),
  })
}
