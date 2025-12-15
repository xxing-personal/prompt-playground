import { FolderOpen, Plus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { EntityCard } from '../components/shared/EntityCard'
import { CreateModal } from '../components/shared/CreateModal'
import { Button } from '../components/ui/Button'
import { useProjects, useCreateProject } from '../hooks'

export function ProjectsPage() {
  const { data, isLoading } = useProjects()
  const createModal = useCreateProject()

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={createModal.open}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((project) => (
            <EntityCard
              key={project.id}
              href={`/projects/${project.id}`}
              icon={FolderOpen}
              iconColor="text-blue-500"
              title={project.name}
              description={project.description}
              meta={<span className="text-xs text-gray-400">{project.use_case_count || 0} use cases</span>}
            />
          ))}
        </div>
      )}

      <CreateModal
        {...createModal}
        title="Create Project"
        inputLabel="Project Name"
        inputPlaceholder="My Project"
      />
    </Layout>
  )
}
