# Frontend Refactoring Plan

## Current State Analysis

### Problem Summary
`App.tsx` is **1044 lines** containing:
- 9 page components in one file
- Layout component
- `AVAILABLE_MODELS` constant
- All routing logic
- Repeated patterns (create modal, breadcrumbs)

### Component Breakdown
| Component | Lines | useState Hooks | Complexity |
|-----------|-------|----------------|------------|
| Layout | 20 | 0 | Low |
| ProjectsPage | 76 | 2 | Low |
| ProjectDetailPage | 90 | 2 | Low |
| UseCaseDetailPage | 104 | 2 | Medium |
| PromptDetailPage | **361** | **13** | **High** |
| EvaluationsPage | 75 | 0 | Low |
| EvalRunDetailPage | 163 | 0 | Medium |
| DatasetsPage | 100 | 2 | Low |

### Key Issues
1. **PromptDetailPage** is massive (361 lines, 13 useState) - needs extraction
2. **Repeated patterns**: Create modal + mutation logic duplicated 5 times
3. **No custom hooks**: All data fetching inline
4. **No shared components**: Breadcrumbs, StatusBadge, EmptyState repeated
5. **Constants embedded**: `AVAILABLE_MODELS` should be in config

---

## Target Architecture

```
src/
├── App.tsx                    # Router only (~30 lines)
├── main.tsx
├── index.css
├── constants/
│   └── models.ts              # AVAILABLE_MODELS
├── types/
│   └── index.ts               # (existing)
├── services/
│   └── api.ts                 # (existing)
├── hooks/
│   ├── useCreateModal.ts      # Generic create modal + mutation
│   ├── useProjects.ts         # Project queries/mutations
│   ├── useUseCases.ts         # UseCase queries/mutations
│   ├── usePrompts.ts          # Prompt queries/mutations
│   ├── useDatasets.ts         # Dataset queries/mutations
│   └── useEvalRuns.ts         # EvalRun queries/mutations
├── components/
│   ├── ui/                    # (existing primitives)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── layout/
│   │   ├── Layout.tsx         # Main layout with nav
│   │   └── Breadcrumbs.tsx    # Reusable breadcrumb component
│   ├── shared/
│   │   ├── StatusBadge.tsx    # Pass/Fail, Running/Completed badges
│   │   ├── EmptyState.tsx     # Empty state with icon + CTA
│   │   ├── EntityCard.tsx     # Reusable card for list items
│   │   └── CreateModal.tsx    # Generic create entity modal
│   └── playground/
│       ├── TemplateEditor.tsx # Template textarea + variable extraction
│       ├── ModelSettings.tsx  # Model, temperature, maxTokens
│       ├── OutputPanel.tsx    # Output display
│       ├── VersionSelector.tsx # Version dropdown
│       └── EvalModal.tsx      # Evaluation run modal
└── pages/
    ├── ProjectsPage.tsx
    ├── ProjectDetailPage.tsx
    ├── UseCaseDetailPage.tsx
    ├── PromptDetailPage.tsx   # Will use playground components
    ├── EvaluationsPage.tsx
    ├── EvalRunDetailPage.tsx
    └── DatasetsPage.tsx
```

---

## Refactoring Steps

### Phase 1: Extract Constants & Types (5 min)

#### Step 1.1: Create `constants/models.ts`
```typescript
// src/constants/models.ts
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' },
] as const

export type ModelId = typeof AVAILABLE_MODELS[number]['id']
```

**Checkpoint**: Import constant in App.tsx, verify app works.

---

### Phase 2: Extract Layout Components (10 min)

#### Step 2.1: Create `components/layout/Layout.tsx`
Extract the `Layout` component (lines 12-31) to its own file.

#### Step 2.2: Create `components/layout/Breadcrumbs.tsx`
```typescript
// src/components/layout/Breadcrumbs.tsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-gray-900">{item.label}</Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
```

**Checkpoint**: Replace 6 hardcoded breadcrumb blocks with `<Breadcrumbs items={[...]} />`.

---

### Phase 3: Extract Shared Components (15 min)

#### Step 3.1: Create `components/shared/StatusBadge.tsx`
```typescript
// src/components/shared/StatusBadge.tsx
const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: keyof typeof STATUS_COLORS }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
      {status}
    </span>
  )
}
```

#### Step 3.2: Create `components/shared/EmptyState.tsx`
```typescript
// src/components/shared/EmptyState.tsx
import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      <div className="text-center py-8">
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">{title}</p>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        {actionLabel && onAction && (
          <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </Card>
  )
}
```

#### Step 3.3: Create `components/shared/EntityCard.tsx`
```typescript
// src/components/shared/EntityCard.tsx
import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'

interface EntityCardProps {
  href: string
  icon: LucideIcon
  iconColor: string
  title: string
  description?: string
  meta?: React.ReactNode
}

export function EntityCard({ href, icon: Icon, iconColor, title, description, meta }: EntityCardProps) {
  return (
    <Link to={href}>
      <Card className="hover:border-blue-500 transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description || 'No description'}</p>
            {meta && <div className="mt-2">{meta}</div>}
          </div>
        </div>
      </Card>
    </Link>
  )
}
```

**Checkpoint**: Replace inline card/empty patterns in all pages.

---

### Phase 4: Extract Custom Hooks (20 min)

#### Step 4.1: Create `hooks/useCreateModal.ts`
Generic hook for create modal pattern (used 5 times):
```typescript
// src/hooks/useCreateModal.ts
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface UseCreateModalOptions<T> {
  queryKey: string[]
  mutationFn: (name: string) => Promise<T>
}

export function useCreateModal<T>({ queryKey, mutationFn }: UseCreateModalOptions<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setIsOpen(false)
      setName('')
    },
  })

  return {
    isOpen,
    name,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setName,
    create: () => mutation.mutate(name),
    isCreating: mutation.isPending,
  }
}
```

#### Step 4.2: Create entity-specific hooks
```typescript
// src/hooks/useProjects.ts
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
```

Similar hooks for: `useUseCases.ts`, `usePrompts.ts`, `useDatasets.ts`, `useEvalRuns.ts`

**Checkpoint**: Pages use hooks instead of inline useQuery/useMutation.

---

### Phase 5: Extract Page Components (25 min)

#### Step 5.1: Create pages directory structure
```
src/pages/
├── index.ts           # Re-exports all pages
├── ProjectsPage.tsx
├── ProjectDetailPage.tsx
├── UseCaseDetailPage.tsx
├── PromptDetailPage.tsx
├── EvaluationsPage.tsx
├── EvalRunDetailPage.tsx
└── DatasetsPage.tsx
```

#### Step 5.2: Extract each page
Start with simple pages (ProjectsPage, EvaluationsPage), then move to complex ones.

**Example: ProjectsPage.tsx (~40 lines)**
```typescript
// src/pages/ProjectsPage.tsx
import { FolderOpen, Plus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { EntityCard } from '../components/shared/EntityCard'
import { CreateModal } from '../components/shared/CreateModal'
import { Button } from '../components/ui/Button'
import { useProjects, useCreateProject } from '../hooks/useProjects'

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
```

**Checkpoint**: Run app after each page extraction to ensure routing works.

---

### Phase 6: Break Down PromptDetailPage (30 min)

This is the most complex page (361 lines, 13 useState). Extract into:

#### Step 6.1: Create `components/playground/TemplateEditor.tsx`
```typescript
// Handles template textarea + variable extraction + inputs
interface TemplateEditorProps {
  template: string
  variables: Record<string, string>
  onChange: (template: string) => void
  onVariableChange: (key: string, value: string) => void
}
```

#### Step 6.2: Create `components/playground/ModelSettings.tsx`
```typescript
// Model selector, temperature slider, max tokens input
interface ModelSettingsProps {
  model: string
  temperature: number
  maxTokens: number
  onModelChange: (model: string) => void
  onTemperatureChange: (temp: number) => void
  onMaxTokensChange: (tokens: number) => void
}
```

#### Step 6.3: Create `components/playground/VersionSelector.tsx`
```typescript
// Version dropdown with selection
interface VersionSelectorProps {
  versions: PromptVersion[]
  selectedId: string | null
  onSelect: (id: string) => void
}
```

#### Step 6.4: Create `components/playground/OutputPanel.tsx`
```typescript
// Output display card
interface OutputPanelProps {
  output: string
  isRunning: boolean
  onRunEval: () => void
  canRunEval: boolean
}
```

#### Step 6.5: Create `components/playground/EvalModal.tsx`
```typescript
// Evaluation run creation modal
interface EvalModalProps {
  isOpen: boolean
  onClose: () => void
  promptName: string
  versionNumber: number
  datasets: Dataset[]
  modelSettings: ModelSettings
  onSubmit: (datasetId: string) => void
  isSubmitting: boolean
}
```

#### Step 6.6: Create `hooks/usePlayground.ts`
Consolidate the 13 useState hooks into a reducer or Zustand store:
```typescript
// src/hooks/usePlayground.ts
import { useState, useCallback } from 'react'

interface PlaygroundState {
  template: string
  variables: Record<string, string>
  output: string
  model: string
  temperature: number
  maxTokens: number
  isRunning: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  selectedVersionId: string | null
}

export function usePlayground(initialTemplate = '') {
  const [state, setState] = useState<PlaygroundState>({
    template: initialTemplate,
    variables: {},
    output: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1024,
    isRunning: false,
    isSaving: false,
    hasUnsavedChanges: false,
    selectedVersionId: null,
  })

  const setTemplate = useCallback((template: string) => {
    setState(s => ({ ...s, template, hasUnsavedChanges: true }))
  }, [])

  const run = useCallback(async () => {
    setState(s => ({ ...s, isRunning: true, output: '' }))
    // ... run logic
    setState(s => ({ ...s, isRunning: false, output: result }))
  }, [state.template, state.variables, state.model])

  // ... other actions

  return { state, setTemplate, run, ... }
}
```

**Checkpoint**: PromptDetailPage should be ~100 lines using composed components.

---

### Phase 7: Simplify App.tsx (5 min)

Final `App.tsx` should be ~30 lines:
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  ProjectsPage,
  ProjectDetailPage,
  UseCaseDetailPage,
  PromptDetailPage,
  EvaluationsPage,
  EvalRunDetailPage,
  DatasetsPage,
} from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/use-cases/:useCaseId" element={<UseCaseDetailPage />} />
        <Route path="/use-cases/:useCaseId/datasets" element={<DatasetsPage />} />
        <Route path="/prompts/:promptId" element={<PromptDetailPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/eval-runs/:runId" element={<EvalRunDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Verification Checkpoints

| Phase | Checkpoint | Command |
|-------|------------|---------|
| 1 | Constants extracted | `npm run dev` - verify models dropdown works |
| 2 | Layout extracted | `npm run dev` - verify nav + layout renders |
| 3 | Shared components | `npm run dev` - verify cards, badges, empty states |
| 4 | Hooks extracted | `npm run dev` - verify CRUD operations work |
| 5 | Pages extracted | `npm run dev` - verify all routes work |
| 6 | Playground broken down | `npm run dev` - verify prompt editor, run, save |
| 7 | Final cleanup | `npm run build` - ensure no errors |

---

## File Size Targets

| File | Current | Target | Notes |
|------|---------|--------|-------|
| App.tsx | 1044 | ~30 | Router only |
| PromptDetailPage.tsx | 361 | ~100 | Uses playground components |
| All other pages | 75-163 | 40-80 | Uses shared components + hooks |
| Total new files | 1 | ~25 | Better maintainability |

---

## Execution Order

1. **Phase 1**: Extract constants (low risk, quick win)
2. **Phase 2**: Extract Layout (foundational)
3. **Phase 3**: Extract shared components (enables page simplification)
4. **Phase 4**: Extract hooks (decouples data from UI)
5. **Phase 5**: Extract simple pages first (ProjectsPage, EvaluationsPage, DatasetsPage)
6. **Phase 5 cont.**: Extract medium pages (ProjectDetailPage, UseCaseDetailPage, EvalRunDetailPage)
7. **Phase 6**: Break down PromptDetailPage (highest complexity)
8. **Phase 7**: Final App.tsx cleanup

Run `npm run dev` after each phase to catch regressions early.
