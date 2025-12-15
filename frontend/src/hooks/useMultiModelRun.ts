import { useState, useCallback } from 'react'
import { ModelConfig } from '../components/playground/MultiModelSelector'

export interface ExecutionResult {
  modelId: string
  modelName: string
  output: string
  metrics: {
    latencyMs: number
    promptTokens: number
    completionTokens: number
    totalTokens: number
    costUsd: number | null
  }
  error?: string
  completedAt: Date
}

interface MultiModelRunState {
  isRunning: boolean
  runningModels: Set<string>
  results: Map<string, ExecutionResult>
}

interface RunParams {
  templateType: 'text' | 'chat'
  templateText?: string
  templateMessages?: { role: string; content: string }[]
  variables: Record<string, string>
  models: ModelConfig[]
}

export function useMultiModelRun() {
  const [state, setState] = useState<MultiModelRunState>({
    isRunning: false,
    runningModels: new Set(),
    results: new Map(),
  })

  const runSingleModel = async (
    params: Omit<RunParams, 'models'> & { model: ModelConfig }
  ): Promise<ExecutionResult> => {
    const startTime = Date.now()

    try {
      const response = await fetch('/api/v1/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: params.templateType,
          template_text: params.templateText,
          template_messages: params.templateMessages,
          variables: params.variables,
          model: params.model.model,
          temperature: params.model.temperature,
          max_tokens: params.model.maxTokens,
          reasoning_effort: params.model.reasoning_effort,
        }),

      })

      const data = await response.json()
      const latencyMs = Date.now() - startTime

      if (data.error) {
        return {
          modelId: params.model.id,
          modelName: params.model.model,
          output: '',
          metrics: { latencyMs, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: null },
          error: data.error,
          completedAt: new Date(),
        }
      }

      return {
        modelId: params.model.id,
        modelName: params.model.model,
        output: data.output || '',
        metrics: {
          latencyMs,
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          costUsd: data.usage?.cost_usd || null,
        },
        completedAt: new Date(),
      }
    } catch (err) {
      return {
        modelId: params.model.id,
        modelName: params.model.model,
        output: '',
        metrics: { latencyMs: Date.now() - startTime, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: null },
        error: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date(),
      }
    }
  }

  const runMultiModel = useCallback(async (params: RunParams) => {
    const enabledModels = params.models.filter((m) => m.enabled)

    if (enabledModels.length === 0) {
      return
    }

    // Clear previous results and set running state
    setState({
      isRunning: true,
      runningModels: new Set(enabledModels.map((m) => m.id)),
      results: new Map(),
    })

    // Run all models in parallel
    const promises = enabledModels.map(async (model) => {
      const result = await runSingleModel({ ...params, model })

      // Update state as each model completes
      setState((prev) => {
        const newRunning = new Set(prev.runningModels)
        newRunning.delete(model.id)

        const newResults = new Map(prev.results)
        newResults.set(model.id, result)

        return {
          isRunning: newRunning.size > 0,
          runningModels: newRunning,
          results: newResults,
        }
      })

      return result
    })

    await Promise.all(promises)
  }, [])

  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      runningModels: new Set(),
      results: new Map(),
    })
  }, [])

  return {
    ...state,
    runMultiModel,
    clearResults,
    resultsArray: Array.from(state.results.values()),
  }
}
