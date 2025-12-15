# Frontend Components Guide

This document provides a comprehensive reference for all React components in Prompt Playground.

## Component Organization

```
src/components/
├── ui/                    # Base UI primitives
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
│
├── shared/                # Reusable feature components
│   ├── EntityCard.tsx
│   ├── StatusBadge.tsx
│   ├── TagEditor.tsx
│   └── CreateModal.tsx
│
├── layout/                # Page structure components
│   ├── Layout.tsx
│   └── Breadcrumbs.tsx
│
├── playground/            # Prompt testing components
│   ├── TemplateEditor.tsx
│   ├── ChatTemplateEditor.tsx
│   ├── OutputPanel.tsx
│   ├── ModelSettings.tsx
│   ├── MultiModelSelector.tsx
│   ├── VariableSidePanel.tsx
│   ├── DiffEditorPane.tsx
│   ├── VersionSelector.tsx
│   ├── EvalModal.tsx
│   └── ResultsComparisonTable.tsx
│
├── eval-results/          # Evaluation display
│   ├── VirtualizedResultsTable.tsx
│   └── ResultDetailPanel.tsx
│
├── prompt-editor/         # Prompt editing
└── export/                # Export functionality
```

---

## UI Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/Button'

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <PlusIcon className="w-4 h-4 mr-2" />
  Add Item
</Button>

// Loading state
<Button disabled>
  <Spinner className="mr-2" />
  Loading...
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| disabled | `boolean` | `false` | Disabled state |
| className | `string` | | Additional CSS classes |

---

### Card

Container component for grouped content.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

<Card>
  <CardHeader>
    <h3 className="font-medium">Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// With hover effect
<Card className="hover:shadow-md transition-shadow cursor-pointer">
  <CardContent>Clickable card</CardContent>
</Card>
```

---

### Input

Text input with label and error states.

```tsx
import { Input } from '@/components/ui/Input'

// Basic
<Input
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With placeholder
<Input
  label="Email"
  placeholder="user@example.com"
  value={email}
  onChange={handleChange}
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={handleChange}
/>

// Textarea
<Input
  label="Description"
  multiline
  rows={4}
  value={description}
  onChange={handleChange}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | | Input label |
| error | `string` | | Error message |
| multiline | `boolean` | `false` | Use textarea |
| rows | `number` | `3` | Textarea rows |

---

### Modal

Overlay dialog for forms and confirmations.

```tsx
import { Modal } from '@/components/ui/Modal'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Project"
>
  <form onSubmit={handleSubmit}>
    <Input label="Name" />
    <div className="flex gap-2 mt-4">
      <Button type="submit">Create</Button>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
    </div>
  </form>
</Modal>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `boolean` | required | Open state |
| onClose | `() => void` | required | Close handler |
| title | `string` | | Modal title |
| children | `ReactNode` | | Modal content |

---

## Shared Components

### EntityCard

Display card for projects, use cases, prompts, etc.

```tsx
import { EntityCard } from '@/components/shared/EntityCard'

<EntityCard
  title="Customer Support Bot"
  description="AI-powered support assistant"
  status="active"
  stats={[
    { label: "prompts", value: 12 },
    { label: "evals", value: 45 }
  ]}
  onClick={() => navigate(`/projects/${id}`)}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| title | `string` | Card title |
| description | `string` | Optional description |
| status | `string` | Optional status badge |
| stats | `{ label: string; value: number }[]` | Statistics to display |
| onClick | `() => void` | Click handler |

---

### StatusBadge

Colored badge indicating status.

```tsx
import { StatusBadge } from '@/components/shared/StatusBadge'

<StatusBadge status="completed" />
<StatusBadge status="running" />
<StatusBadge status="failed" />
<StatusBadge status="pending" />
```

**Status Colors:**

| Status | Color |
|--------|-------|
| completed | Green |
| running | Blue |
| pending | Yellow |
| failed | Red |
| canceled | Gray |
| production | Purple |
| beta | Orange |
| alpha | Teal |

---

### TagEditor

Editable tag list with add/remove functionality.

```tsx
import { TagEditor } from '@/components/shared/TagEditor'

<TagEditor
  tags={['faq', 'support', 'v1']}
  onChange={(newTags) => setTags(newTags)}
  placeholder="Add tag..."
/>

// Read-only
<TagEditor
  tags={['faq', 'support']}
  readOnly
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| tags | `string[]` | Current tags |
| onChange | `(tags: string[]) => void` | Change handler |
| placeholder | `string` | Input placeholder |
| readOnly | `boolean` | Disable editing |

---

### CreateModal

Pre-built modal for entity creation.

```tsx
import { CreateModal } from '@/components/shared/CreateModal'

<CreateModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Project"
  onSubmit={handleCreate}
  fields={[
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description', multiline: true }
  ]}
/>
```

---

## Layout Components

### Layout

Main application layout with navigation.

```tsx
import { Layout } from '@/components/layout/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        {/* ... */}
      </Routes>
    </Layout>
  )
}
```

Features:
- Sidebar navigation
- Top header
- Main content area
- Responsive design

---

### Breadcrumbs

Navigation breadcrumb trail.

```tsx
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

<Breadcrumbs
  items={[
    { label: 'Projects', href: '/' },
    { label: 'Customer Support', href: '/projects/123' },
    { label: 'FAQ Handler', href: '/prompts/456' },
    { label: 'Version 3' }
  ]}
/>
```

---

## Playground Components

### TemplateEditor

Code editor for text prompt templates.

```tsx
import { TemplateEditor } from '@/components/playground/TemplateEditor'

<TemplateEditor
  value={template}
  onChange={setTemplate}
  variables={['company_name', 'question']}
  readOnly={false}
/>
```

**Features:**
- Syntax highlighting for `{{variables}}`
- Variable extraction
- Line numbers
- Read-only mode

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| value | `string` | Template content |
| onChange | `(value: string) => void` | Change handler |
| variables | `string[]` | Detected variables |
| readOnly | `boolean` | Disable editing |

---

### ChatTemplateEditor

Editor for chat message templates.

```tsx
import { ChatTemplateEditor } from '@/components/playground/ChatTemplateEditor'

<ChatTemplateEditor
  messages={[
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: '{{question}}' }
  ]}
  onChange={setMessages}
/>
```

**Features:**
- Role selection (system, user, assistant)
- Add/remove messages
- Drag-and-drop reordering
- Variable highlighting

---

### OutputPanel

Display LLM response output.

```tsx
import { OutputPanel } from '@/components/playground/OutputPanel'

<OutputPanel
  output={response.output}
  isLoading={isRunning}
  metrics={{
    latency_ms: 450,
    tokens: { prompt: 100, completion: 50, total: 150 },
    cost_usd: 0.003
  }}
  error={error}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| output | `string` | LLM output text |
| isLoading | `boolean` | Loading state |
| metrics | `object` | Response metrics |
| error | `string` | Error message |

---

### ModelSettings

Configuration panel for model parameters.

```tsx
import { ModelSettings } from '@/components/playground/ModelSettings'

<ModelSettings
  config={{
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 500
  }}
  onChange={setConfig}
/>
```

**Features:**
- Model dropdown
- Temperature slider
- Max tokens input
- Top-p slider

---

### MultiModelSelector

Select multiple models for comparison.

```tsx
import { MultiModelSelector } from '@/components/playground/MultiModelSelector'

<MultiModelSelector
  selected={selectedModels}
  onChange={setSelectedModels}
  max={5}
/>
```

**Features:**
- Model search/filter
- Add/remove models
- Per-model configuration
- Model grouping by provider

---

### VariableSidePanel

Side panel for template variable management.

```tsx
import { VariableSidePanel } from '@/components/playground/VariableSidePanel'

<VariableSidePanel
  variables={['company_name', 'question']}
  values={variableValues}
  onChange={setVariableValues}
/>
```

**Features:**
- Auto-detected variables
- Value inputs
- JSON value support
- Variable validation

---

### DiffEditorPane

Side-by-side diff comparison.

```tsx
import { DiffEditorPane } from '@/components/playground/DiffEditorPane'

<DiffEditorPane
  leftContent={versionA.template_text}
  rightContent={versionB.template_text}
  leftTitle="Version 1"
  rightTitle="Version 2"
/>
```

**Features:**
- Split view
- Line-by-line diff
- Addition/deletion highlighting
- Unified diff mode

---

### VersionSelector

Dropdown for selecting prompt versions.

```tsx
import { VersionSelector } from '@/components/playground/VersionSelector'

<VersionSelector
  versions={versions}
  selected={selectedVersion}
  onChange={setSelectedVersion}
/>
```

**Features:**
- Version list with numbers
- Label badges (production, beta)
- Commit message preview
- Quick navigation

---

### EvalModal

Modal for configuring evaluation runs.

```tsx
import { EvalModal } from '@/components/playground/EvalModal'

<EvalModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  promptVersion={version}
  onSubmit={handleStartEval}
/>
```

**Features:**
- Dataset selection
- Model selection
- Assertion configuration
- Validation

---

### ResultsComparisonTable

Compare outputs from multiple models.

```tsx
import { ResultsComparisonTable } from '@/components/playground/ResultsComparisonTable'

<ResultsComparisonTable
  results={[
    { model_id: 'gpt4o', output: '...', metrics: {...} },
    { model_id: 'claude', output: '...', metrics: {...} }
  ]}
/>
```

**Features:**
- Side-by-side outputs
- Metrics comparison
- Diff highlighting
- Copy output

---

## Evaluation Components

### VirtualizedResultsTable

High-performance table for large result sets.

```tsx
import { VirtualizedResultsTable } from '@/components/eval-results/VirtualizedResultsTable'

<VirtualizedResultsTable
  results={evalResults}
  onRowClick={(result) => setSelectedResult(result)}
  selectedId={selectedResult?.id}
/>
```

**Features:**
- Virtual scrolling (1000+ rows)
- Sorting by columns
- Filtering
- Row selection
- Export selection

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| results | `EvalResult[]` | Results array |
| onRowClick | `(result) => void` | Row click handler |
| selectedId | `string` | Selected row ID |

---

### ResultDetailPanel

Detailed view of a single evaluation result.

```tsx
import { ResultDetailPanel } from '@/components/eval-results/ResultDetailPanel'

<ResultDetailPanel
  result={selectedResult}
  onClose={() => setSelectedResult(null)}
/>
```

**Features:**
- Full output display
- Input/expected output
- Assertion results
- Metrics breakdown
- Copy functionality

---

## Component Patterns

### Loading States

```tsx
// Skeleton loading
<Card>
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
</Card>

// Spinner
<div className="flex items-center justify-center p-8">
  <Spinner className="w-8 h-8 text-blue-600" />
</div>
```

### Error States

```tsx
// Error message
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <div className="flex items-center text-red-800">
    <AlertIcon className="w-5 h-5 mr-2" />
    <p>Failed to load data. Please try again.</p>
  </div>
</div>

// With retry
<ErrorState
  message="Failed to load projects"
  onRetry={() => refetch()}
/>
```

### Empty States

```tsx
<div className="text-center py-12">
  <FolderIcon className="w-12 h-12 mx-auto text-gray-400" />
  <h3 className="mt-4 text-lg font-medium text-gray-900">No projects</h3>
  <p className="mt-2 text-gray-500">Get started by creating a new project.</p>
  <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
    Create Project
  </Button>
</div>
```

---

## Styling

### Tailwind CSS Classes

Common utility patterns:

```tsx
// Card styling
className="rounded-lg border bg-white shadow-sm"

// Button primary
className="bg-blue-600 text-white hover:bg-blue-700"

// Input
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"

// Badge
className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
```

### Custom Classes

Using the `cn` utility:

```tsx
import { cn } from '@/lib/utils'

<div
  className={cn(
    'p-4 rounded-lg border',
    isActive && 'border-blue-500 bg-blue-50',
    isError && 'border-red-500 bg-red-50'
  )}
>
```

---

## Related Documentation

- [Frontend Architecture](../architecture/frontend-architecture.md)
- [Hooks Reference](./hooks.md)
- [Pages & Routes](./pages-routes.md)

---

*Component documentation generated December 2024*
