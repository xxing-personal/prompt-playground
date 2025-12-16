import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { AVAILABLE_MODELS } from '../../constants/models'

export interface ModelConfig {
  id: string
  model: string
  provider: string
  temperature: number
  maxTokens: number
  reasoning_effort?: string
  enabled: boolean
}

interface MultiModelSelectorProps {
  selectedModels: ModelConfig[]
  onChange: (models: ModelConfig[]) => void
}

function generateModelId(): string {
  return `model-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function MultiModelSelector({ selectedModels, onChange }: MultiModelSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addModel = () => {
    const newModel: ModelConfig = {
      id: generateModelId(),
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 1024,
      enabled: true,
      reasoning_effort: undefined,
    }
    onChange([...selectedModels, newModel])
  }

  const removeModel = (id: string) => {
    onChange(selectedModels.filter((m) => m.id !== id))
  }

  const toggleEnabled = (id: string) => {
    onChange(
      selectedModels.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
  }

  const updateModel = (id: string, updates: Partial<ModelConfig>) => {
    onChange(selectedModels.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const enabledCount = selectedModels.filter((m) => m.enabled).length

  return (
    <div className="space-y-4">
      {/* Model List */}
      <div className="space-y-3">
        {selectedModels.map((config) => {
          const modelInfo = AVAILABLE_MODELS.find((m) => m.id === config.model)
          const isExpanded = expandedId === config.id

          return (
            <div
              key={config.id}
              className={`border rounded-xl transition-all duration-200 ${config.enabled
                ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                : 'border-slate-200 bg-slate-50 opacity-80'
                }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleEnabled(config.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${config.enabled ? 'text-slate-900' : 'text-slate-500'
                        }`}
                    >
                      {modelInfo?.name || config.model}
                    </span>
                    {isExpanded && (
                      <span className="text-[10px] text-slate-400">
                        {modelInfo?.provider || config.provider}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isExpanded && (
                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 bg-white/50 px-2 py-0.5 rounded border border-slate-100">
                      <span>t={config.temperature}</span>
                      <span>max={config.maxTokens}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : config.id)}
                    className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => removeModel(config.id)}
                    className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Settings */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-100/50 space-y-3 mt-2">
                  {/* Model Selection */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Model</label>
                    <div className="relative">
                      <select
                        value={config.model}
                        onChange={(e) => {
                          const model = AVAILABLE_MODELS.find((m) => m.id === e.target.value)
                          const isGpt5 = e.target.value.startsWith('gpt-5')
                          updateModel(config.id, {
                            model: e.target.value,
                            provider: model?.provider || 'openai',
                            temperature: isGpt5 ? 1 : config.temperature
                          })
                        }}
                        className="w-full pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 appearance-none"
                      >
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reasoning Effort (for reasoning models) */}
                  {(config.model.startsWith('gpt-5') || config.model.startsWith('o1') || config.model.startsWith('o3')) && (
                    <div className="pt-2 pb-2">
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Reasoning Effort</label>
                      <div className="relative">
                        <select
                          value={config.reasoning_effort || 'medium'}
                          onChange={(e) => updateModel(config.id, { reasoning_effort: e.target.value })}
                          className="w-full pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 appearance-none"
                        >
                          <option value="medium">Medium (Default)</option>
                          <option value="low">Low</option>
                          <option value="high">High</option>
                          {config.model.startsWith('gpt-5') && <option value="minimal">Minimal (Disable Reasoning)</option>}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Temperature</label>
                      <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1 rounded">
                        {config.model.startsWith('gpt-5') ? '1.0 (Fixed)' : config.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.model.startsWith('gpt-5') ? 1 : config.temperature}
                      onChange={(e) =>
                        updateModel(config.id, { temperature: parseFloat(e.target.value) })
                      }
                      disabled={config.model.startsWith('gpt-5')}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${config.model.startsWith('gpt-5') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200 accent-blue-600'
                        }`}
                    />
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Max Tokens</label>
                      <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1 rounded">{config.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4096"
                      step="128"
                      value={config.maxTokens}
                      onChange={(e) =>
                        updateModel(config.id, { maxTokens: parseInt(e.target.value) || 128 })
                      }
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Model Button */}
      <button
        onClick={addModel}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all duration-200 group"
      >
        <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Model
      </button>

      {/* Run Summary */}
      {enabledCount > 0 && (
        <div className="text-[10px] text-slate-400 text-center font-medium">
          Ready to run {enabledCount} model{enabledCount !== 1 ? 's' : ''} parallel
        </div>
      )}
    </div>
  )
}

export function createDefaultModelConfigs(): ModelConfig[] {
  return [
    {
      id: generateModelId(),
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 1024,
      enabled: true,
      reasoning_effort: undefined,
    },
  ]
}
