import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import { useCreateModal } from './useCreateModal'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!).then(r => r.data),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  return useCreateModal({
    queryKey: ['projects'],
    mutationFn: (name) => projectsApi.create({ name }),
  })
}
