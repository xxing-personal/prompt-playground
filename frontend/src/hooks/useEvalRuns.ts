import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evalRunsApi } from '../services/api'

export function useEvalRuns() {
  return useQuery({
    queryKey: ['evalRuns'],
    queryFn: () => evalRunsApi.list().then(r => r.data),
  })
}

export function useEvalRun(runId: string | undefined) {
  return useQuery({
    queryKey: ['evalRun', runId],
    queryFn: () => evalRunsApi.get(runId!).then(r => r.data),
    enabled: !!runId,
    refetchInterval: (query) => query.state.data?.status === 'running' ? 2000 : false,
  })
}

export function useEvalResults(runId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['evalResults', runId],
    queryFn: () => evalRunsApi.getResults(runId!).then(r => r.data),
    enabled: !!runId && enabled,
  })
}

export function useCreateEvalRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      prompt_version_id: string
      dataset_id: string
      models: Array<{ model: string; temperature: number; max_tokens: number }>
      assertions?: Array<{ type: string; config: Record<string, unknown> }>
    }) => evalRunsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evalRuns'] })
    },
  })
}
