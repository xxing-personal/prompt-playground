import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { EvalResult } from '../../types'

interface Props {
  results: EvalResult[]
  onRowClick: (result: EvalResult) => void
}

export function VirtualizedResultsTable({ results, onRowClick }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  if (results.length === 0) {
    return <div className="p-8 text-center text-gray-500">No results found</div>
  }

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm table-fixed">
        <thead className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
          <tr>
            <th className="w-1/4 text-left py-3 px-3 font-medium text-gray-700">Input</th>
            <th className="w-1/4 text-left py-3 px-3 font-medium text-gray-700">Output</th>
            <th className="w-1/6 text-left py-3 px-3 font-medium text-gray-700">Model</th>
            <th className="w-1/12 text-center py-3 px-3 font-medium text-gray-700">Pass</th>
            <th className="w-1/12 text-center py-3 px-3 font-medium text-gray-700">Score</th>
            <th className="w-1/6 text-right py-3 px-3 font-medium text-gray-700">Latency</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
            <td colSpan={6} className="p-0 relative">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const result = results[virtualRow.index]
                return (
                  <div
                    key={result.id}
                    onClick={() => onRowClick(result)}
                    className="absolute left-0 w-full flex items-center border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="w-1/4 py-2 px-3 truncate text-gray-900">
                      {JSON.stringify(result.input).slice(0, 80)}
                    </div>
                    <div className="w-1/4 py-2 px-3 truncate text-gray-600">
                      {result.output?.slice(0, 80) || '-'}
                    </div>
                    <div className="w-1/6 py-2 px-3 truncate text-gray-600">
                      {result.model_id}
                    </div>
                    <div className="w-1/12 py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        result.grading.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.grading.pass ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                    <div className="w-1/12 py-2 px-3 text-center text-gray-600">
                      {result.grading.score.toFixed(2)}
                    </div>
                    <div className="w-1/6 py-2 px-3 text-right text-gray-600">
                      {result.metrics.latency_ms}ms
                    </div>
                  </div>
                )
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
