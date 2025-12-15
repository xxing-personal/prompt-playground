import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { EmptyState } from '../components/shared/EmptyState'
import { StatusBadge } from '../components/shared/StatusBadge'
import { Card } from '../components/ui/Card'
import { useEvalRuns } from '../hooks'

export function EvaluationsPage() {
  const { data: evalRuns, isLoading } = useEvalRuns()

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : evalRuns?.items.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No evaluation runs yet"
          description="Create a dataset and run an evaluation from a prompt page"
        />
      ) : (
        <div className="space-y-4">
          {evalRuns?.items.map((run) => (
            <Link key={run.id} to={`/eval-runs/${run.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {run.name || `Eval Run ${run.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(run.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={run.status} />
                    {run.status === 'running' && (
                      <span className="text-sm text-gray-500">
                        {run.progress.percent}%
                      </span>
                    )}
                    {run.status === 'completed' && run.summary && (
                      <span className="text-sm text-gray-500">
                        {((run.summary as { pass_rate?: number }).pass_rate ?? 0) * 100}% pass rate
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
