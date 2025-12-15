import { useParams } from 'react-router-dom'
import { Database, Plus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EntityCard } from '../components/shared/EntityCard'
import { EmptyState } from '../components/shared/EmptyState'
import { CreateModal } from '../components/shared/CreateModal'
import { Button } from '../components/ui/Button'
import { useUseCase, useDatasets, useCreateDataset } from '../hooks'

export function DatasetsPage() {
  const { useCaseId } = useParams<{ useCaseId: string }>()
  const { data: useCase } = useUseCase(useCaseId)
  const { data: datasets, isLoading } = useDatasets(useCaseId)
  const createModal = useCreateDataset(useCaseId)

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Projects', href: '/' },
        { label: useCase?.name || '', href: `/use-cases/${useCaseId}` },
        { label: 'Datasets' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
        <Button onClick={createModal.open}>
          <Plus className="w-4 h-4 mr-2" />
          New Dataset
        </Button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : datasets?.items.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No datasets yet"
          actionLabel="Create your first dataset"
          onAction={createModal.open}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets?.items.map((dataset) => (
            <EntityCard
              key={dataset.id}
              href={`/datasets/${dataset.id}`}
              icon={Database}
              iconColor="text-gray-400"
              title={dataset.name}
              meta={<span className="text-sm text-gray-500">{dataset.item_count || 0} items</span>}
            />
          ))}
        </div>
      )}

      <CreateModal
        {...createModal}
        title="Create Dataset"
        inputLabel="Dataset Name"
        inputPlaceholder="Test Cases"
      />
    </Layout>
  )
}
