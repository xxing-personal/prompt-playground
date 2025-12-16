import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { usePlaygroundRuns, type RunHistoryEntry } from '../../hooks/usePlaygroundRuns'
import type { ModelConfig } from './MultiModelSelector'

interface RunHistoryPanelProps {
  versionId: string | null
  onLoadRun: (entry: RunHistoryEntry) => void
}

export function RunHistoryPanel({ versionId, onLoadRun }: RunHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: entries = [], isLoading } = usePlaygroundRuns(versionId || undefined, 5)

  if (isLoading) {
    return null
  }

  if (entries.length === 0) {
    return null
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const formatModels = (models: ModelConfig[]) => {
    const enabled = models.filter((m) => m.enabled)
    if (enabled.length === 0) return 'No models'
    if (enabled.length === 1) return enabled[0].model.split('/').pop() || enabled[0].model
    return `${enabled.length} models`
  }

  const formatVariables = (variables: Record<string, string>) => {
    const entries = Object.entries(variables)
    if (entries.length === 0) return null
    const preview = entries.slice(0, 2).map(([k, v]) => `${k}=${v.slice(0, 15)}${v.length > 15 ? '...' : ''}`).join(', ')
    return entries.length > 2 ? `${preview}, +${entries.length - 2} more` : preview
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Recent Runs</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {entries.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{formatTimeAgo(entry.timestamp)}</span>
                  <span>•</span>
                  <span>{formatModels(entry.config.models)}</span>
                  <span>•</span>
                  <span className={entry.results.some((r) => r.error) ? 'text-red-500' : 'text-green-600'}>
                    {entry.results.filter((r) => !r.error).length}/{entry.results.length} success
                  </span>
                </div>
                <button
                  onClick={() => onLoadRun(entry)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Load
                </button>
              </div>
              {formatVariables(entry.config.variables) && (
                <div className="text-xs text-slate-400 truncate">
                  Variables: {formatVariables(entry.config.variables)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
