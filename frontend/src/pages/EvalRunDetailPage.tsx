import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { StatusBadge } from '../components/shared/StatusBadge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { VirtualizedResultsTable, ResultDetailPanel } from '../components/eval-results'
import { useEvalRun, useEvalResults } from '../hooks'
import type { EvalResult } from '../types'

export function EvalRunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const [selectedResult, setSelectedResult] = useState<EvalResult | null>(null)
  const { data: evalRun, isLoading: runLoading } = useEvalRun(runId)
  const { data: results } = useEvalResults(runId, evalRun?.status === 'completed')

  if (runLoading) {
    return <Layout><div className="text-gray-500">Loading...</div></Layout>
  }

  if (!evalRun) {
    return <Layout><div className="text-gray-500">Eval run not found</div></Layout>
  }

  const summary = evalRun.summary as { pass_rate?: number; avg_score?: number; total_cost_usd?: number; avg_latency_ms?: number } | null

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Evaluations', href: '/evaluations' },
        { label: evalRun.name || `Run ${evalRun.id.slice(0, 8)}` },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {evalRun.name || `Evaluation Run`}
        </h1>
        <StatusBadge status={evalRun.status} className="px-3 py-1 text-sm" />
      </div>

      {/* Summary Cards */}
      {evalRun.status === 'completed' && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {((summary.pass_rate ?? 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Pass Rate</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(summary.avg_score ?? 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(summary.avg_latency_ms ?? 0).toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-500">Avg Latency</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${(summary.total_cost_usd ?? 0).toFixed(4)}
              </div>
              <div className="text-sm text-gray-500">Total Cost</div>
            </div>
          </Card>
        </div>
      )}

      {/* Progress for running */}
      {evalRun.status === 'running' && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${evalRun.progress.percent}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {evalRun.progress.completed} / {evalRun.progress.total}
            </span>
          </div>
        </Card>
      )}

      {/* Results Table */}
      {evalRun.status === 'completed' && results?.items && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Results ({results.items.length})</h2>
            <a href={`/api/v1/eval-runs/${runId}/export.json`} download>
              <Button variant="secondary" size="sm">Export JSON</Button>
            </a>
          </div>
          <VirtualizedResultsTable
            results={results.items}
            onRowClick={setSelectedResult}
          />
        </Card>
      )}

      {/* Result Detail Side Panel */}
      <ResultDetailPanel
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />

      {/* Error message */}
      {evalRun.status === 'failed' && evalRun.error_message && (
        <Card>
          <div className="text-red-600">
            <strong>Error:</strong> {evalRun.error_message}
          </div>
        </Card>
      )}
    </Layout>
  )
}
