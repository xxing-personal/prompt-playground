# Pages & Routes

This document describes all pages and routes in Prompt Playground.

## Route Structure

```
/                              → ProjectsPage
/projects/:projectId           → ProjectDetailPage
/use-cases/:useCaseId          → UseCaseDetailPage
/use-cases/:useCaseId/datasets → DatasetsPage
/prompts/:promptId             → PromptDetailPage
/datasets/:datasetId           → DatasetDetailPage
/evaluations                   → EvaluationsPage
/eval-runs/:runId              → EvalRunDetailPage
/compare                       → CompareEvalRunsPage
```

---

## Route Configuration

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/use-cases/:useCaseId" element={<UseCaseDetailPage />} />
          <Route path="/use-cases/:useCaseId/datasets" element={<DatasetsPage />} />
          <Route path="/prompts/:promptId" element={<PromptDetailPage />} />
          <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/eval-runs/:runId" element={<EvalRunDetailPage />} />
          <Route path="/compare" element={<CompareEvalRunsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
```

---

## Page Descriptions

### ProjectsPage (`/`)

The home page displaying all projects.

**Features:**
- Project list with cards
- Create project button
- Search/filter projects
- Project statistics (use cases, prompts, evals)

**Components Used:**
- EntityCard
- CreateModal
- SearchInput

```tsx
// pages/ProjectsPage.tsx
export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map(project => (
          <EntityCard
            key={project.id}
            title={project.name}
            description={project.description}
            onClick={() => navigate(`/projects/${project.id}`)}
          />
        ))}
      </div>

      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Project"
        onSubmit={handleCreate}
      />
    </div>
  )
}
```

---

### ProjectDetailPage (`/projects/:projectId`)

Detail view for a single project.

**Features:**
- Project info header
- Use cases list
- Quick stats
- Edit/delete actions

**Components Used:**
- Breadcrumbs
- EntityCard
- CreateModal

**URL Parameters:**
| Param | Description |
|-------|-------------|
| projectId | Project UUID |

---

### UseCaseDetailPage (`/use-cases/:useCaseId`)

Detail view for a use case with prompts.

**Features:**
- Use case info
- Prompts list with tags
- Tag filtering
- Create prompt action

**Components Used:**
- Breadcrumbs
- EntityCard
- TagEditor
- CreateModal

**URL Parameters:**
| Param | Description |
|-------|-------------|
| useCaseId | Use case UUID |

---

### PromptDetailPage (`/prompts/:promptId`)

The main prompt editing and testing page.

**Features:**
- Tabbed interface (Template, Playground, Versions, Evals)
- Version selector
- Template editor
- Playground for testing
- Version history

**Tabs:**

1. **Template Tab**
   - View/edit current version
   - Create new version
   - Diff comparison

2. **Playground Tab**
   - Template editor
   - Variable panel
   - Model selector
   - Output panel
   - Multi-model comparison

3. **Versions Tab**
   - Version history list
   - Label management
   - Version details

4. **Evals Tab**
   - Evaluation history
   - Quick access to results

**Components Used:**
- TemplateEditor / ChatTemplateEditor
- VariableSidePanel
- ModelSettings
- OutputPanel
- VersionSelector
- DiffEditorPane

**URL Parameters:**
| Param | Description |
|-------|-------------|
| promptId | Prompt UUID |

---

### DatasetsPage (`/use-cases/:useCaseId/datasets`)

List datasets for a use case.

**Features:**
- Dataset cards
- Create dataset
- Item count display

**URL Parameters:**
| Param | Description |
|-------|-------------|
| useCaseId | Use case UUID |

---

### DatasetDetailPage (`/datasets/:datasetId`)

View and manage dataset items.

**Features:**
- Dataset info
- Items table with pagination
- Add/edit/delete items
- Batch import
- Schema display

**Components Used:**
- VirtualizedTable
- CreateModal
- JSONEditor

**URL Parameters:**
| Param | Description |
|-------|-------------|
| datasetId | Dataset UUID |

---

### EvaluationsPage (`/evaluations`)

Global evaluation runs list.

**Features:**
- All eval runs across projects
- Filter by status
- Quick stats
- Navigate to details

**Components Used:**
- StatusBadge
- DataTable

---

### EvalRunDetailPage (`/eval-runs/:runId`)

Detailed evaluation run view.

**Features:**
- Run summary
- Progress indicator (for running)
- Results table
- Per-model breakdown
- Export options
- Result detail panel

**Components Used:**
- VirtualizedResultsTable
- ResultDetailPanel
- StatusBadge
- ExportButtons

**URL Parameters:**
| Param | Description |
|-------|-------------|
| runId | Evaluation run UUID |

---

### CompareEvalRunsPage (`/compare`)

Compare multiple evaluation runs.

**Features:**
- Select runs to compare
- Side-by-side metrics
- Diff visualization

**Query Parameters:**
| Param | Description |
|-------|-------------|
| runs | Comma-separated run IDs |

**Usage:**
```
/compare?runs=run1-id,run2-id,run3-id
```

---

## Navigation Patterns

### Breadcrumb Trail

```tsx
// Example for PromptDetailPage
<Breadcrumbs
  items={[
    { label: 'Projects', href: '/' },
    { label: project.name, href: `/projects/${project.id}` },
    { label: useCase.name, href: `/use-cases/${useCase.id}` },
    { label: prompt.name }
  ]}
/>
```

### Programmatic Navigation

```tsx
import { useNavigate, useParams } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  const { projectId } = useParams()

  // Navigate to page
  navigate(`/projects/${projectId}`)

  // Navigate with state
  navigate('/prompts/123', { state: { fromEval: true } })

  // Navigate back
  navigate(-1)

  // Replace history
  navigate('/projects', { replace: true })
}
```

### Link Component

```tsx
import { Link } from 'react-router-dom'

<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
  {project.name}
</Link>
```

---

## Route Guards

### Protected Routes (Future)

```tsx
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Usage
<Route
  path="/projects"
  element={
    <PrivateRoute>
      <ProjectsPage />
    </PrivateRoute>
  }
/>
```

---

## Page Layout Structure

```tsx
// Common page structure
function SomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[...]} />

      {/* Page header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Page Title</h1>
          <div className="flex gap-2">
            <Button>Action</Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {/* Page content */}
      </main>
    </div>
  )
}
```

---

## Error Boundaries

```tsx
// ErrorBoundary for route errors
<Route
  path="/projects/:projectId"
  element={
    <ErrorBoundary fallback={<ErrorPage />}>
      <ProjectDetailPage />
    </ErrorBoundary>
  }
/>
```

---

## Loading States

```tsx
function ProjectsPage() {
  const { data, isLoading, error } = useProjects()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  return (/* ... */)
}
```

---

## Related Documentation

- [Frontend Architecture](../architecture/frontend-architecture.md)
- [Components Guide](./components.md)
- [Hooks Reference](./hooks.md)

---

*Pages & Routes documentation generated December 2024*
