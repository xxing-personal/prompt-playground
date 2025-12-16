import { useState, useMemo } from 'react'
import { Play, Loader2, Clock, AlertCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import Markdown from 'react-markdown'
import type { PromptVersion } from '../../types'
import { playgroundApi, type VersionRunResult } from '../../services/api'
import { AVAILABLE_MODELS } from '../../constants/models'

interface Props {
  oldVersion: PromptVersion
  newVersion: PromptVersion
  variables: Record<string, string>
  model: string
  temperature: number
  maxTokens: number
}

export function VersionOutputComparison({
  oldVersion,
  newVersion,
  variables: initialVariables,
  model: initialModel,
  temperature: initialTemperature,
  maxTokens: initialMaxTokens,
}: Props) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<VersionRunResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Local state for editable settings
  const [selectedModel, setSelectedModel] = useState(initialModel)
  const [temperature, setTemperature] = useState(initialTemperature)
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens)
  const [localVariables, setLocalVariables] = useState<Record<string, string>>(initialVariables)

  // Extract variables from both versions' templates
  const requiredVariables = useMemo(() => {
    const varRegex = /\{\{(\w+)\}\}/g
    const vars = new Set<string>()
    
    const oldText = oldVersion.template_text || 
      (oldVersion.template_messages ? JSON.stringify(oldVersion.template_messages) : '')
    const newText = newVersion.template_text || 
      (newVersion.template_messages ? JSON.stringify(newVersion.template_messages) : '')
    
    let match
    while ((match = varRegex.exec(oldText)) !== null) vars.add(match[1])
    while ((match = varRegex.exec(newText)) !== null) vars.add(match[1])
    
    return Array.from(vars)
  }, [oldVersion, newVersion])

  const handleRun = async () => {
    setIsRunning(true)
    setError(null)
    setResults([])

    try {
      const response = await playgroundApi.runVersions({
        versions: [
          {
            version_id: oldVersion.id,
            model: selectedModel,
            temperature,
            max_tokens: maxTokens,
          },
          {
            version_id: newVersion.id,
            model: selectedModel,
            temperature,
            max_tokens: maxTokens,
          },
        ],
        variables: localVariables,
      })
      setResults(response.data.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run versions')
    } finally {
      setIsRunning(false)
    }
  }

  const oldResult = results.find((r) => r.version_id === oldVersion.id)
  const newResult = results.find((r) => r.version_id === newVersion.id)

  return (
    <div className="flex flex-col h-full">
      {/* Run Controls */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
            {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex-1 text-sm text-slate-500 text-center">
            {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel} | T: {temperature} | Max: {maxTokens}
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Both Versions
              </>
            )}
          </button>
        </div>

        {/* Expandable Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                ))}
              </select>
            </div>

            {/* Model Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="32000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Variables */}
            {requiredVariables.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Template Variables
                </label>
                <div className="space-y-2">
                  {requiredVariables.map((varName) => (
                    <div key={varName} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 w-24 truncate">{`{{${varName}}}`}</span>
                      <input
                        type="text"
                        value={localVariables[varName] || ''}
                        onChange={(e) => setLocalVariables(prev => ({ ...prev, [varName]: e.target.value }))}
                        placeholder={`Enter ${varName}...`}
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Results Side by Side */}
      <div className="flex-1 overflow-hidden">
        {results.length === 0 && !isRunning ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Click "Run Both Versions" to compare outputs</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 h-full divide-x divide-slate-200">
            {/* Old Version Output */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-4 py-2 bg-red-50/50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Version {oldVersion.version_number}
                  </span>
                  {oldResult && !oldResult.error && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {oldResult.metrics.latency_ms}ms
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {isRunning && !oldResult ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : oldResult?.error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {oldResult.error}
                  </div>
                ) : oldResult?.output ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <Markdown>{oldResult.output}</Markdown>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No output</span>
                )}
              </div>
            </div>

            {/* New Version Output */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-4 py-2 bg-green-50/50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Version {newVersion.version_number}
                  </span>
                  {newResult && !newResult.error && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {newResult.metrics.latency_ms}ms
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {isRunning && !newResult ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : newResult?.error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {newResult.error}
                  </div>
                ) : newResult?.output ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <Markdown>{newResult.output}</Markdown>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No output</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
