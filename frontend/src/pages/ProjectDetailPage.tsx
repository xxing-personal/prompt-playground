import { useParams } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EntityCard } from '../components/shared/EntityCard'
import { CreateModal } from '../components/shared/CreateModal'
import { Button } from '../components/ui/Button'
import { useProject, useUseCases, useCreateUseCase } from '../hooks'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project } = useProject(projectId)
  const { data: useCases, isLoading } = useUseCases(projectId)
  const createModal = useCreateUseCase(projectId)

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Projects', href: '/' },
        { label: project?.name || '' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
        <Button onClick={createModal.open}>
          <Plus className="w-4 h-4 mr-2" /> New Use Case
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {useCases?.items.map((useCase) => (
            <EntityCard
              key={useCase.id}
              href={`/use-cases/${useCase.id}`}
              icon={FileText}
              iconColor="text-green-500"
              title={useCase.name}
              description={useCase.description}
              meta={
                <span className="text-xs text-gray-400">
                  {useCase.prompt_count || 0} prompts · {useCase.dataset_count || 0} datasets
                </span>
              }
            />
          ))}
        </div>
      )}

      <CreateModal
        {...createModal}
        title="Create Use Case"
        inputLabel="Use Case Name"
        inputPlaceholder="Customer Support"
      />
    </Layout>
  )
}
