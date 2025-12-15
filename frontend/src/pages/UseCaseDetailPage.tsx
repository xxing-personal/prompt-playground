import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Plus, Database, Search } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EntityCard } from '../components/shared/EntityCard'
import { CreateModal } from '../components/shared/CreateModal'
import { Button } from '../components/ui/Button'
import { useUseCase, usePrompts, useCreatePrompt } from '../hooks'

export function UseCaseDetailPage() {
  const { useCaseId } = useParams<{ useCaseId: string }>()
  const [tagFilter, setTagFilter] = useState('')
  const { data: useCase } = useUseCase(useCaseId)
  const { data: prompts, isLoading } = usePrompts(useCaseId)
  const createModal = useCreatePrompt(useCaseId)

  const filteredPrompts = prompts?.items.filter(p =>
    !tagFilter || p.tags?.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))
  )

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Projects', href: '/' },
        { label: useCase?.name || '' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{useCase?.name}</h1>
        <div className="flex items-center gap-2">
          <Link to={`/use-cases/${useCaseId}/datasets`}>
            <Button variant="secondary">
              <Database className="w-4 h-4 mr-2" /> Datasets
            </Button>
          </Link>
          <Button onClick={createModal.open}>
            <Plus className="w-4 h-4 mr-2" /> New Prompt
          </Button>
        </div>
      </div>

      {/* Tag Filter */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by tag..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-full max-w-xs pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts?.map((prompt) => (
            <EntityCard
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              icon={Play}
              iconColor="text-purple-500"
              title={prompt.name}
              description={prompt.description}
              meta={
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">
                      v{prompt.latest_version || 0}
                    </span>
                    {prompt.production_version && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        PROD v{prompt.production_version}
                      </span>
                    )}
                  </div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prompt.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )
      }

      <CreateModal
        {...createModal}
        title="Create Prompt"
        inputLabel="Prompt Name"
        inputPlaceholder="Summarize Text"
      />
    </Layout >
  )
}
