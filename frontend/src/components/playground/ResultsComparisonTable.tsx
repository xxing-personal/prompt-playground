import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle, Clock, Coins } from 'lucide-react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { ExecutionResult } from '../../hooks/useMultiModelRun'

interface ResultsComparisonTableProps {
  results: ExecutionResult[]
  isRunning: boolean
  runningModels: Set<string>
}

export function ResultsComparisonTable({
  results,
  isRunning,
  runningModels,
}: ResultsComparisonTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleCompare = (id: string) => {
    if (!compareIds) {
      setCompareIds([id, ''])
    } else if (compareIds[0] === id) {
      setCompareIds(null)
    } else if (compareIds[1] === '') {
      setCompareIds([compareIds[0], id])
    } else {
      setCompareIds([id, ''])
    }
  }

  if (results.length === 0 && !isRunning) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No results yet. Select models and run to compare outputs.</p>
      </div>
    )
  }

  // Show loading skeletons for models that haven't returned yet
  const pendingModelIds = Array.from(runningModels).filter(
    (id) => !results.find((r) => r.modelId === id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          Output
          {isRunning && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Running</span>}
        </h3>
        {isRunning && (
          <span className="text-xs text-blue-600 animate-pulse font-medium">
            Processing {runningModels.size} requests...
          </span>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `repeat(${Math.min(results.length + pendingModelIds.length, 3) || 1}, minmax(300px, 1fr))` }}>
        {/* Loading skeletons */}
        {pendingModelIds.map((modelId) => (
          <div key={modelId} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-4/6 animate-pulse" />
            </div>
            <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
              <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}

        {results.map((result) => {
          const isExpanded = expandedId === result.modelId
          const isComparing = compareIds?.includes(result.modelId)
          const isLoading = runningModels.has(result.modelId)

          return (
            <div
              key={result.modelId}
              className={`border rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-200 ${result.error
                ? 'border-red-200 bg-red-50/10'
                : isComparing
                  ? 'border-blue-400 ring-2 ring-blue-100 shadow-md transform scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50/80 backdrop-blur border-b border-slate-200/50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">
                    {result.modelName}
                  </span>
                  {isLoading && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Actions visible on hover or always if comparing */}
                  <div className={`flex items-center gap-1 ${isComparing ? 'opacity-100' : ''}`}>
                    <button
                      onClick={() => toggleCompare(result.modelId)}
                      className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wide rounded transition-colors ${isComparing
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200 bg-slate-100'
                        }`}
                    >
                      {isComparing ? 'Vs' : 'Diff'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(result.output, result.modelId)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                      title="Copy output"
                    >
                      {copiedId === result.modelId ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="relative group/output">
                <div
                  className={`p-4 text-sm font-mono leading-relaxed text-slate-700 bg-white ${isExpanded ? '' : 'max-h-[300px] overflow-hidden mask-linear-fade'
                    }`}
                >
                  {result.error ? (
                    <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-xs font-sans">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{result.error}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {result.output || <span className="text-slate-400 italic">No output generated</span>}
                    </div>
                  )}
                </div>

                {/* Expand toggle overlay */}
                {result.output && result.output.length > 300 && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-2 pointer-events-none">
                    <button
                      onClick={() => setExpandedId(result.modelId)}
                      className="pointer-events-auto flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all"
                    >
                      <ChevronDown className="w-3 h-3" /> Show more
                    </button>
                  </div>
                )}
                {isExpanded && result.output && result.output.length > 300 && (
                  <div className="flex justify-center py-2 border-t border-slate-100 bg-slate-50/30">
                    <button
                      onClick={() => setExpandedId(null)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" /> Show less
                    </button>
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5" title="Latency">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {result.metrics.latencyMs}ms
                  </span>
                  <span className="flex items-center gap-1.5" title="Tokens">
                    <span className="w-3 h-3 flex items-center justify-center font-serif italic text-slate-400">T</span>
                    {result.metrics.totalTokens}
                  </span>
                </div>
                {result.metrics.costUsd !== null && (
                  <span className="flex items-center gap-1 text-slate-600" title="Cost">
                    <Coins className="w-3 h-3 text-slate-400" />
                    ${result.metrics.costUsd.toFixed(5)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Diff View */}
      {compareIds && compareIds[1] && (
        <DiffModal
          results={results}
          compareIds={compareIds as [string, string]}
          onClose={() => setCompareIds(null)}
        />
      )}
    </div>
  )
}

interface DiffModalProps {
  results: ExecutionResult[]
  compareIds: [string, string]
  onClose: () => void
}

function DiffModal({ results, compareIds, onClose }: DiffModalProps) {
  const result1 = results.find((r) => r.modelId === compareIds[0])
  const result2 = results.find((r) => r.modelId === compareIds[1])

  if (!result1 || !result2) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Comparing: {result1.modelName} vs {result2.modelName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <ReactDiffViewer
            oldValue={result1.output}
            newValue={result2.output}
            splitView={true}
            leftTitle={result1.modelName}
            rightTitle={result2.modelName}
            useDarkTheme={false}
          />
        </div>
      </div>
    </div>
  )
}
