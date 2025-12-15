import { useQuery } from '@tanstack/react-query'
import { datasetsApi } from '../services/api'
import { useCreateModal } from './useCreateModal'

export function useDatasets(useCaseId: string | undefined) {
  return useQuery({
    queryKey: ['datasets', useCaseId],
    queryFn: () => datasetsApi.list(useCaseId!).then(r => r.data),
    enabled: !!useCaseId,
  })
}

export function useDataset(datasetId: string | undefined) {
  return useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => datasetsApi.get(datasetId!).then(r => r.data),
    enabled: !!datasetId,
  })
}

export function useCreateDataset(useCaseId: string | undefined) {
  return useCreateModal({
    queryKey: ['datasets', useCaseId || ''],
    mutationFn: (name) => datasetsApi.create(useCaseId!, { name }),
  })
}
