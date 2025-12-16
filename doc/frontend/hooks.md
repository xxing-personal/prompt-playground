# Hooks Reference

This document provides documentation for all custom React hooks in Prompt Playground.

## Overview

Custom hooks encapsulate data fetching, state management, and reusable logic. They follow these patterns:

- **Data hooks**: Use TanStack Query for server state
- **Mutation hooks**: Handle create/update/delete operations
- **Utility hooks**: Provide reusable functionality

---

## Data Fetching Hooks

### useProjects

Fetch and manage projects.

```tsx
import { useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'

// List projects
const { data: projects, isLoading, error, refetch } = useProjects({
  page: 1,
  limit: 20
})

// Get single project
const { data: project, isLoading } = useProject(projectId)

// Create project
const createMutation = useCreateProject()
await createMutation.mutateAsync({
  name: 'New Project',
  description: 'Description'
})

// Update project
const updateMutation = useUpdateProject(projectId)
await updateMutation.mutateAsync({ name: 'Updated Name' })

// Delete project
const deleteMutation = useDeleteProject()
await deleteMutation.mutateAsync(projectId)
```

**useProjects Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| page | `number` | `1` | Page number |
| limit | `number` | `20` | Items per page |

**Return Values:**

| Field | Type | Description |
|-------|------|-------------|
| data | `Project[]` | Projects array |
| isLoading | `boolean` | Loading state |
| error | `Error` | Error if any |
| refetch | `() => void` | Refetch function |

---

### useUseCases

Fetch use cases for a project.

```tsx
import { useUseCases, useUseCase, useCreateUseCase } from '@/hooks/useUseCases'

// List use cases
const { data: useCases, isLoading } = useUseCases(projectId)

// Get single use case
const { data: useCase } = useUseCase(useCaseId)

// Create use case
const createMutation = useCreateUseCase(projectId)
await createMutation.mutateAsync({
  name: 'FAQ Handler',
  description: 'Handle FAQ questions'
})
```

---

### usePrompts

Fetch and manage prompts.

```tsx
import {
  usePrompts,
  usePrompt,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt
} from '@/hooks/usePrompts'

// List prompts with tag filter
const { data: prompts } = usePrompts(useCaseId, {
  tags: ['faq', 'support']
})

// Get single prompt
const { data: prompt } = usePrompt(promptId)

// Create prompt
const createMutation = useCreatePrompt(useCaseId)
await createMutation.mutateAsync({
  name: 'New Prompt',
  tags: ['test']
})
```

---

### usePromptVersions

Manage prompt versions.

```tsx
import {
  usePromptVersions,
  usePromptVersion,
  useCreateVersion,
  usePromoteVersion,
  useDemoteVersion
} from '@/hooks/usePromptVersions'

// List versions
const { data: versions } = usePromptVersions(promptId)

// Get specific version
const { data: version } = usePromptVersion(promptId, versionNumber)

// Create new version
const createMutation = useCreateVersion(promptId)
await createMutation.mutateAsync({
  type: 'chat',
  template_messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: '{{question}}' }
  ],
  commit_message: 'Added chat template'
})

// Promote version (add label)
const promoteMutation = usePromoteVersion(promptId)
await promoteMutation.mutateAsync({
  versionNumber: 3,
  label: 'production'
})

// Demote version (remove label)
const demoteMutation = useDemoteVersion(promptId)
await demoteMutation.mutateAsync({
  versionNumber: 2,
  label: 'beta'
})
```

---

### useDatasets

Fetch and manage datasets.

```tsx
import {
  useDatasets,
  useDataset,
  useCreateDataset,
  useDatasetItems,
  useCreateDatasetItem,
  useBatchCreateItems
} from '@/hooks/useDatasets'

// List datasets
const { data: datasets } = useDatasets(useCaseId)

// Get dataset with stats
const { data: dataset } = useDataset(datasetId)

// Create dataset
const createMutation = useCreateDataset(useCaseId)
await createMutation.mutateAsync({
  name: 'Test Cases',
  default_assertions: [
    { type: 'not_contains', value: 'error' }
  ]
})

// List items
const { data: items, fetchNextPage, hasNextPage } = useDatasetItems(datasetId, {
  limit: 50
})

// Create single item
const itemMutation = useCreateDatasetItem(datasetId)
await itemMutation.mutateAsync({
  input: { question: 'Test question' },
  expected_output: { contains: ['answer'] }
})

// Batch create items
const batchMutation = useBatchCreateItems(datasetId)
await batchMutation.mutateAsync([
  { input: { q: 'Question 1' } },
  { input: { q: 'Question 2' } },
  { input: { q: 'Question 3' } }
])
```

---

### useEvalRuns

Fetch and manage evaluation runs.

```tsx
import {
  useEvalRuns,
  useEvalRun,
  useCreateEvalRun,
  useCancelEvalRun,
  useEvalResults
} from '@/hooks/useEvalRuns'

// List eval runs with filters
const { data: runs } = useEvalRuns({
  status: 'completed',
  promptVersionId: '...',
  datasetId: '...'
})

// Get single run with polling when running
const { data: run } = useEvalRun(runId, {
  refetchInterval: (data) =>
    data?.status === 'running' ? 2000 : false
})

// Create eval run
const createMutation = useCreateEvalRun()
await createMutation.mutateAsync({
  prompt_version_id: versionId,
  dataset_id: datasetId,
  models: [
    { id: 'gpt4o', model: 'gpt-4o', temperature: 0.7 }
  ],
  assertions: [
    { type: 'not_contains', value: 'error' }
  ]
})

// Cancel running eval
const cancelMutation = useCancelEvalRun()
await cancelMutation.mutateAsync(runId)

// Get results
const { data: results, fetchNextPage } = useEvalResults(runId, {
  limit: 100,
  modelId: 'gpt4o',
  pass: false  // Only failed results
})
```

---

## Playground Hooks

### usePlayground

Handle playground template execution.

```tsx
import { usePlayground } from '@/hooks/usePlayground'

const {
  compile,
  run,
  runVersion,
  runMulti,
  isCompiling,
  isRunning,
  result,
  error
} = usePlayground()

// Compile template (validation)
const compileResult = await compile({
  type: 'text',
  text: 'Hello {{name}}',
  variables: { name: 'World' }
})

// Run single model
const result = await run({
  type: 'text',
  template_text: 'Hello {{name}}',
  variables: { name: 'World' },
  model_config: {
    id: 'test',
    model: 'gpt-4o-mini',
    temperature: 0.7
  }
})

// Run saved version
const result = await runVersion(versionId, {
  variables: { name: 'World' },
  model_config: { id: 'test', model: 'gpt-4o' }
})

// Run multiple models
const results = await runMulti({
  type: 'chat',
  template_messages: [...],
  variables: { ... },
  models: [
    { id: 'gpt4o', model: 'gpt-4o' },
    { id: 'claude', model: 'claude-3-5-sonnet-20241022' }
  ]
})
```

---

### useMultiModelRun

Manage multi-model comparison runs.

```tsx
import { useMultiModelRun } from '@/hooks/useMultiModelRun'

const {
  isRunning,
  runningModels,
  resultsArray,
  runMultiModel,
  clearResults,
  setResults
} = useMultiModelRun()

// Run multiple models
await runMultiModel({
  templateType: 'chat',
  templateText: null,
  templateMessages: [...],
  variables: { name: 'World' },
  models: [
    { id: 'gpt4o', model: 'gpt-4o', temperature: 0.7 },
    { id: 'claude', model: 'claude-3-5-sonnet-20241022', temperature: 0.7 }
  ],
  versionId: '...',
  promptId: '...',
  onComplete: (results) => console.log('Done!', results)
})

// Access results
resultsArray.forEach(r => {
  console.log(`${r.modelId}: ${r.output}`)
})

// Restore results from history
setResults(savedResults)

// Clear results
clearResults()
```

**Return Values:**

| Field | Type | Description |
|-------|------|-------------|
| isRunning | `boolean` | Any model currently running |
| runningModels | `Set<string>` | Set of currently running model IDs |
| resultsArray | `ExecutionResult[]` | Array of all results |
| runMultiModel | `(params) => Promise` | Execute multiple models |
| clearResults | `() => void` | Clear all results |
| setResults | `(results) => void` | Set results (for restoring from history) |

---

## Utility Hooks

### useDiff

Compare two text values.

```tsx
import { useDiff } from '@/hooks/useDiff'

const { diff, additions, deletions, changes } = useDiff(
  'Original text here',
  'Modified text here'
)

// diff: Array of diff hunks
// additions: Number of added lines
// deletions: Number of removed lines
// changes: Total changes
```

---

### useCreateModal

Manage modal open/close state with form handling.

```tsx
import { useCreateModal } from '@/hooks/useCreateModal'

const {
  isOpen,
  open,
  close,
  data,
  setData,
  isSubmitting,
  submit
} = useCreateModal({
  onSubmit: async (data) => {
    await createProject(data)
  }
})

// In component
<Button onClick={open}>Create</Button>

<Modal isOpen={isOpen} onClose={close}>
  <Input
    value={data.name}
    onChange={(e) => setData({ ...data, name: e.target.value })}
  />
  <Button onClick={submit} disabled={isSubmitting}>
    {isSubmitting ? 'Creating...' : 'Create'}
  </Button>
</Modal>
```

---

### useDebounce

Debounce a value for search/filter inputs.

```tsx
import { useDebounce } from '@/hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

// Use debouncedSearch for API calls
const { data } = usePrompts(useCaseId, {
  search: debouncedSearch
})
```

---

### useLocalStorage

Persist state in localStorage.

```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage'

const [theme, setTheme] = useLocalStorage('theme', 'light')

// Value persists across page reloads
setTheme('dark')
```

---

### usePagination

Handle pagination state.

```tsx
import { usePagination } from '@/hooks/usePagination'

const {
  page,
  limit,
  setPage,
  setLimit,
  nextPage,
  prevPage,
  totalPages,
  setTotal
} = usePagination({
  initialPage: 1,
  initialLimit: 20
})

// Set total from API response
useEffect(() => {
  if (data?.total) {
    setTotal(data.total)
  }
}, [data])

// Navigation
<Button onClick={prevPage} disabled={page === 1}>Previous</Button>
<span>Page {page} of {totalPages}</span>
<Button onClick={nextPage} disabled={page === totalPages}>Next</Button>
```

---

## Hook Patterns

### Query Key Management

```tsx
// Query keys are structured hierarchically
const queryKeys = {
  projects: {
    all: ['projects'],
    list: (params) => ['projects', 'list', params],
    detail: (id) => ['projects', 'detail', id]
  },
  prompts: {
    all: ['prompts'],
    list: (useCaseId, params) => ['prompts', 'list', useCaseId, params],
    detail: (id) => ['prompts', 'detail', id],
    versions: (id) => ['prompts', id, 'versions']
  }
}

// Invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
```

### Optimistic Updates

```tsx
const updateMutation = useMutation({
  mutationFn: updateProject,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['projects', id] })

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['projects', id])

    // Optimistically update
    queryClient.setQueryData(['projects', id], (old) => ({
      ...old,
      ...newData
    }))

    return { previousData }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['projects', id], context.previousData)
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['projects', id] })
  }
})
```

### Polling for Running Tasks

```tsx
const { data: evalRun } = useQuery({
  queryKey: ['eval-runs', id],
  queryFn: () => fetchEvalRun(id),
  refetchInterval: (data) => {
    // Poll every 2 seconds while running
    if (data?.status === 'running') return 2000
    // Stop polling when complete
    return false
  }
})
```

### Infinite Scroll

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['dataset-items', datasetId],
  queryFn: ({ pageParam = 0 }) =>
    fetchDatasetItems(datasetId, { skip: pageParam, limit: 50 }),
  getNextPageParam: (lastPage, pages) => {
    const totalLoaded = pages.flatMap(p => p.items).length
    return totalLoaded < lastPage.total ? totalLoaded : undefined
  }
})

// Flatten pages for rendering
const items = data?.pages.flatMap(page => page.items) ?? []

// Load more
<Button
  onClick={() => fetchNextPage()}
  disabled={!hasNextPage || isFetchingNextPage}
>
  {isFetchingNextPage ? 'Loading...' : 'Load More'}
</Button>
```

---

### usePlaygroundRuns

Fetch and save playground run history for a prompt version.

```tsx
import { usePlaygroundRuns, useSavePlaygroundRun } from '@/hooks/usePlaygroundRuns'

// Fetch runs for a version
const { data: runs, isLoading } = usePlaygroundRuns(versionId, 5)

// Save a new run
const saveMutation = useSavePlaygroundRun()
await saveMutation.mutateAsync({
  promptId: '...',
  versionId: '...',
  config: {
    templateType: 'chat',
    templateText: null,
    templateMessages: [...],
    variables: { question: 'Hello' },
    models: ['gpt-4o']
  },
  results: [
    { modelId: 'gpt-4o', output: '...', latencyMs: 450, tokens: {...} }
  ]
})
```

**usePlaygroundRuns Return:**

| Field | Type | Description |
|-------|------|-------------|
| data | `RunHistoryEntry[]` | Array of run history entries |
| isLoading | `boolean` | Loading state |

**RunHistoryEntry Type:**

```tsx
interface RunHistoryEntry {
  id: string
  timestamp: Date
  config: {
    templateType: string
    templateText: string | null
    templateMessages: ChatMessage[] | null
    variables: Record<string, string>
    models: string[]
  }
  results: ExecutionResult[]
}
```

---

## Related Documentation

- [Frontend Architecture](../architecture/frontend-architecture.md)
- [Components Guide](./components.md)
- [API Reference](../api/overview.md)

---

*Hooks documentation updated December 2024*
