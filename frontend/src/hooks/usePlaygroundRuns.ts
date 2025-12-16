import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playgroundApi, type PlaygroundRunData, type PlaygroundRunConfig, type PlaygroundRunResultItem } from '../services/api'
import type { ExecutionResult } from './useMultiModelRun'

export interface RunHistoryEntry {
  id: string
  promptId: string
  versionId: string | null
  timestamp: string
  config: PlaygroundRunConfig
  results: ExecutionResult[]
}

function mapResultItemToExecutionResult(item: PlaygroundRunResultItem): ExecutionResult {
  return {
    modelId: item.modelId,
    modelName: item.modelName,
    output: item.output,
    metrics: {
      latencyMs: item.metrics.latencyMs,
      promptTokens: item.metrics.promptTokens,
      completionTokens: item.metrics.completionTokens,
      totalTokens: item.metrics.totalTokens,
      costUsd: item.metrics.costUsd,
    },
    error: item.error,
    completedAt: new Date(item.completedAt),
  }
}

function mapApiToEntry(data: PlaygroundRunData): RunHistoryEntry {
  return {
    id: data.id,
    promptId: data.prompt_id,
    versionId: data.version_id,
    timestamp: data.created_at,
    config: data.config,
    results: data.results.map(mapResultItemToExecutionResult),
  }
}

export function usePlaygroundRuns(versionId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ['playground-runs', versionId, limit],
    queryFn: async () => {
      if (!versionId) return []
      const response = await playgroundApi.getRunsByVersion(versionId, limit)
      return response.data.map(mapApiToEntry)
    },
    enabled: !!versionId,
    staleTime: 30000,
  })
}

function mapExecutionResultToApiItem(result: ExecutionResult): PlaygroundRunResultItem {
  return {
    modelId: result.modelId,
    modelName: result.modelName,
    output: result.output,
    metrics: {
      latencyMs: result.metrics.latencyMs,
      promptTokens: result.metrics.promptTokens,
      completionTokens: result.metrics.completionTokens,
      totalTokens: result.metrics.totalTokens,
      costUsd: result.metrics.costUsd,
    },
    error: result.error,
    completedAt: result.completedAt.toISOString(),
  }
}

export function useSavePlaygroundRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      promptId: string
      versionId?: string
      config: PlaygroundRunConfig
      results: ExecutionResult[]
    }) => {
      const response = await playgroundApi.saveRun({
        prompt_id: data.promptId,
        version_id: data.versionId,
        config: data.config,
        results: data.results.map(mapExecutionResultToApiItem),
      })
      return mapApiToEntry(response.data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playground-runs', variables.versionId] })
    },
  })
}
