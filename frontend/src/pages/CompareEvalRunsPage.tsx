import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { evalRunsApi } from '../services/api'
import { Layout } from '../components/layout/Layout'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { Card } from '../components/ui/Card'

export function CompareEvalRunsPage() {
  const [searchParams] = useSearchParams()
  const runId1 = searchParams.get('run1')
  const runId2 = searchParams.get('run2')

  const { data: run1, isLoading: loading1 } = useQuery({
    queryKey: ['evalRun', runId1],
    queryFn: () => evalRunsApi.get(runId1!).then(r => r.data),
    enabled: !!runId1,
  })

  const { data: run2, isLoading: loading2 } = useQuery({
    queryKey: ['evalRun', runId2],
    queryFn: () => evalRunsApi.get(runId2!).then(r => r.data),
    enabled: !!runId2,
  })

  const summary1 = run1?.summary as { pass_rate?: number; avg_score?: number; avg_latency_ms?: number } | null
  const summary2 = run2?.summary as { pass_rate?: number; avg_score?: number; avg_latency_ms?: number } | null

  const passRateDelta = (summary2?.pass_rate ?? 0) - (summary1?.pass_rate ?? 0)
  const scoreDelta = (summary2?.avg_score ?? 0) - (summary1?.avg_score ?? 0)
  const latencyDelta = (summary2?.avg_latency_ms ?? 0) - (summary1?.avg_latency_ms ?? 0)

  if (!runId1 || !runId2) {
    return (
      <Layout>
        <div className="text-center text-gray-500 py-12">
          Please provide both run1 and run2 query parameters to compare eval runs.
        </div>
      </Layout>
    )
  }

  const isLoading = loading1 || loading2

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Evaluations', href: '/evaluations' },
        { label: 'Compare Runs' },
      ]} />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compare Eval Runs</h1>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Run 1 */}
          <Card>
            <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b">
              Run 1: {run1?.name || runId1?.slice(0, 8)}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pass Rate</span>
                <span className="font-medium">{((summary1?.pass_rate ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Score</span>
                <span className="font-medium">{(summary1?.avg_score ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Latency</span>
                <span className="font-medium">{(summary1?.avg_latency_ms ?? 0).toFixed(0)}ms</span>
              </div>
            </div>
          </Card>

          {/* Delta */}
          <Card className="bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b">
              Change (Run 2 - Run 1)
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pass Rate</span>
                <span className={`font-medium ${passRateDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {passRateDelta >= 0 ? '+' : ''}{(passRateDelta * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Score</span>
                <span className={`font-medium ${scoreDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreDelta >= 0 ? '+' : ''}{scoreDelta.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Latency</span>
                <span className={`font-medium ${latencyDelta <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latencyDelta >= 0 ? '+' : ''}{latencyDelta.toFixed(0)}ms
                </span>
              </div>
            </div>
          </Card>

          {/* Run 2 */}
          <Card>
            <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b">
              Run 2: {run2?.name || runId2?.slice(0, 8)}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pass Rate</span>
                <span className="font-medium">{((summary2?.pass_rate ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Score</span>
                <span className="font-medium">{(summary2?.avg_score ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Latency</span>
                <span className="font-medium">{(summary2?.avg_latency_ms ?? 0).toFixed(0)}ms</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
