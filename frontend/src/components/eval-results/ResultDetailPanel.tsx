import { X } from 'lucide-react'
import type { EvalResult } from '../../types'

const formatJson = (obj: Record<string, unknown>): string => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

interface Props {
  result: EvalResult | null
  onClose: () => void
}

export function ResultDetailPanel({ result, onClose }: Props) {
  if (!result) return null

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 overflow-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Result Details</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${
              result.grading.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.grading.pass ? 'Passed' : 'Failed'}
            </span>
            <span className="text-gray-600">Score: {result.grading.score.toFixed(2)}</span>
          </div>
        </div>

        {/* Input */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Input</h4>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40 font-mono border border-gray-100">
            {formatJson(result.input)}
          </pre>
        </div>

        {/* Output */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Actual Output</h4>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-60 whitespace-pre-wrap font-mono border border-gray-100">
            {result.output || 'No output'}
          </pre>
        </div>

        {/* Expected Output */}
        {result.expected_output != null && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Expected Output</h4>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40 font-mono border border-gray-100">
              {typeof result.expected_output === 'string' 
                ? result.expected_output 
                : JSON.stringify(result.expected_output, null, 2) ?? ''}
            </pre>
          </div>
        )}

        {/* Assertions */}
        {result.grading.assertions && result.grading.assertions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Assertions</h4>
            <div className="space-y-2">
              {result.grading.assertions.map((assertion, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  assertion.pass ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{assertion.type}</span>
                    <span className={`text-xs font-medium ${assertion.pass ? 'text-green-600' : 'text-red-600'}`}>
                      {assertion.pass ? 'Pass' : 'Fail'} ({assertion.score.toFixed(2)})
                    </span>
                  </div>
                  {assertion.reason && (
                    <p className="text-sm text-gray-600 mt-1">{assertion.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-lg font-semibold text-gray-900">{result.metrics.latency_ms}ms</div>
              <div className="text-xs text-gray-500">Latency</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-lg font-semibold text-gray-900">${result.metrics.cost_usd?.toFixed(4) || '0.0000'}</div>
              <div className="text-xs text-gray-500">Cost</div>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Model</h4>
          <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
            <span className="font-medium">{result.model_id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
