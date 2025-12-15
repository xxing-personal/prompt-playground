# Frontend Architecture

This document provides a comprehensive overview of the Prompt Playground frontend architecture, built with React, TypeScript, and modern tooling.

## Overview

The frontend is a Single Page Application (SPA) built with:

- **React 18** for UI components
- **TypeScript** for type safety
- **Vite** for fast development and builds
- **TanStack Query** for server state management
- **Tailwind CSS** for styling

## Directory Structure

```
frontend/
├── src/
│   ├── main.tsx                  # Application entry point
│   ├── App.tsx                   # Route definitions
│   ├── index.css                 # Global styles
│   │
│   ├── pages/                    # Page-level components
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── UseCaseDetailPage.tsx
│   │   ├── PromptDetailPage.tsx
│   │   ├── DatasetsPage.tsx
│   │   ├── DatasetDetailPage.tsx
│   │   ├── EvaluationsPage.tsx
│   │   ├── EvalRunDetailPage.tsx
│   │   └── CompareEvalRunsPage.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   ├── shared/               # Reusable feature components
│   │   │   ├── EntityCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── TagEditor.tsx
│   │   │   └── CreateModal.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Layout.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   ├── playground/           # Playground feature
│   │   │   ├── TemplateEditor.tsx
│   │   │   ├── ChatTemplateEditor.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── ModelSettings.tsx
│   │   │   ├── MultiModelSelector.tsx
│   │   │   ├── VariableSidePanel.tsx
│   │   │   ├── DiffEditorPane.tsx
│   │   │   ├── VersionSelector.tsx
│   │   │   ├── EvalModal.tsx
│   │   │   └── ResultsComparisonTable.tsx
│   │   │
│   │   ├── eval-results/         # Evaluation results
│   │   │   ├── VirtualizedResultsTable.tsx
│   │   │   └── ResultDetailPanel.tsx
│   │   │
│   │   ├── prompt-editor/        # Prompt editing
│   │   └── export/               # Export functionality
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── index.ts              # Barrel export
│   │   ├── useProjects.ts
│   │   ├── useUseCases.ts
│   │   ├── usePrompts.ts
│   │   ├── useDatasets.ts
│   │   ├── useEvalRuns.ts
│   │   ├── useCreateModal.ts
│   │   ├── useMultiModelRun.ts
│   │   └── useDiff.ts
│   │
│   ├── services/
│   │   └── api.ts                # Axios API client
│   │
│   ├── stores/                   # Zustand stores
│   │
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   │
│   └── constants/
│       ├── index.ts
│       └── models.ts             # LLM model definitions
│
├── index.html                    # HTML entry
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── Dockerfile                    # Container build
└── nginx.conf                   # Production serving
```

## Application Entry

### Main Entry Point

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

### Routing

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import {
  ProjectsPage,
  ProjectDetailPage,
  UseCaseDetailPage,
  PromptDetailPage,
  DatasetsPage,
  DatasetDetailPage,
  EvaluationsPage,
  EvalRunDetailPage,
  CompareEvalRunsPage,
} from './pages'

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

## Component Architecture

### Component Hierarchy

```
Layout
├── Breadcrumbs
└── Page Content
    ├── Page-specific components
    └── Shared components
        ├── UI components
        └── Feature components
```

### UI Components

Base UI components with consistent styling:

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

```tsx
// components/ui/Card.tsx
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b', className)} {...props} />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props} />
  )
}
```

### Shared Components

Reusable feature components:

```tsx
// components/shared/EntityCard.tsx
import { Card } from '../ui/Card'
import { StatusBadge } from './StatusBadge'

interface EntityCardProps {
  title: string
  description?: string
  status?: string
  stats?: { label: string; value: number }[]
  onClick?: () => void
}

export function EntityCard({
  title,
  description,
  status,
  stats,
  onClick,
}: EntityCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          {status && <StatusBadge status={status} />}
        </div>

        {description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="mt-4 flex gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="text-sm">
                <span className="font-medium">{stat.value}</span>
                <span className="text-gray-500 ml-1">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
```

### Playground Components

Prompt testing components:

```tsx
// components/playground/TemplateEditor.tsx
import { useState } from 'react'

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  variables?: string[]
  readOnly?: boolean
}

export function TemplateEditor({
  value,
  onChange,
  variables = [],
  readOnly = false,
}: TemplateEditorProps) {
  const highlightVariables = (text: string) => {
    // Highlight {{variable}} syntax
    return text.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="text-blue-600 bg-blue-50 px-1 rounded">{{$1}}</span>'
    )
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className="w-full h-64 p-4 font-mono text-sm border rounded-lg resize-none"
        placeholder="Enter your prompt template..."
      />

      {variables.length > 0 && (
        <div className="absolute top-2 right-2 flex gap-1">
          {variables.map(v => (
            <span
              key={v}
              className="px-2 py-1 text-xs bg-gray-100 rounded"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

## State Management

### Server State (TanStack Query)

All API data is managed through TanStack Query:

```tsx
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import { Project, ProjectCreate } from '../types'

export function useProjects(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['projects', options],
    queryFn: () => projectsApi.list(options),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ProjectCreate>) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
```

### Client State (Zustand)

For UI state that doesn't come from the server:

```tsx
// stores/playgroundStore.ts
import { create } from 'zustand'
import { ModelConfig } from '../types'

interface PlaygroundState {
  selectedModels: ModelConfig[]
  variables: Record<string, string>
  isRunning: boolean

  addModel: (model: ModelConfig) => void
  removeModel: (modelId: string) => void
  setVariable: (key: string, value: string) => void
  setIsRunning: (running: boolean) => void
  reset: () => void
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  selectedModels: [],
  variables: {},
  isRunning: false,

  addModel: (model) =>
    set((state) => ({
      selectedModels: [...state.selectedModels, model],
    })),

  removeModel: (modelId) =>
    set((state) => ({
      selectedModels: state.selectedModels.filter((m) => m.id !== modelId),
    })),

  setVariable: (key, value) =>
    set((state) => ({
      variables: { ...state.variables, [key]: value },
    })),

  setIsRunning: (isRunning) => set({ isRunning }),

  reset: () =>
    set({
      selectedModels: [],
      variables: {},
      isRunning: false,
    }),
}))
```

## API Layer

### API Client

Centralized API client with type safety:

```tsx
// services/api.ts
import axios, { AxiosInstance } from 'axios'
import {
  Project, ProjectCreate,
  UseCase, UseCaseCreate,
  Prompt, PromptCreate,
  PromptVersion, PromptVersionCreate,
  Dataset, DatasetCreate,
  DatasetItem, DatasetItemCreate,
  EvalRun, EvalRunCreate,
  EvalResult,
  PlaygroundRequest, PlaygroundResponse,
} from '../types'

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Projects
export const projectsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<Project[]>('/projects', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: ProjectCreate) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: Partial<ProjectCreate>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`).then((r) => r.data),
}

// Use Cases
export const useCasesApi = {
  list: (projectId: string, params?: { page?: number; limit?: number }) =>
    api.get<UseCase[]>(`/projects/${projectId}/use-cases`, { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<UseCase>(`/use-cases/${id}`).then((r) => r.data),

  create: (projectId: string, data: UseCaseCreate) =>
    api.post<UseCase>(`/projects/${projectId}/use-cases`, data)
      .then((r) => r.data),

  update: (id: string, data: Partial<UseCaseCreate>) =>
    api.patch<UseCase>(`/use-cases/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/use-cases/${id}`).then((r) => r.data),
}

// Prompts
export const promptsApi = {
  list: (useCaseId: string, params?: { tags?: string[] }) =>
    api.get<Prompt[]>(`/use-cases/${useCaseId}/prompts`, { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<Prompt>(`/prompts/${id}`).then((r) => r.data),

  create: (useCaseId: string, data: PromptCreate) =>
    api.post<Prompt>(`/use-cases/${useCaseId}/prompts`, data)
      .then((r) => r.data),

  update: (id: string, data: Partial<PromptCreate>) =>
    api.patch<Prompt>(`/prompts/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/prompts/${id}`).then((r) => r.data),

  // Versions
  listVersions: (promptId: string) =>
    api.get<PromptVersion[]>(`/prompts/${promptId}/versions`)
      .then((r) => r.data),

  createVersion: (promptId: string, data: PromptVersionCreate) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions`, data)
      .then((r) => r.data),

  getVersion: (promptId: string, versionNumber: number) =>
    api.get<PromptVersion>(`/prompts/${promptId}/versions/${versionNumber}`)
      .then((r) => r.data),

  promote: (promptId: string, versionNumber: number, label: string) =>
    api.post(`/prompts/${promptId}/versions/${versionNumber}/promote`, { label })
      .then((r) => r.data),

  demote: (promptId: string, versionNumber: number, label: string) =>
    api.post(`/prompts/${promptId}/versions/${versionNumber}/demote`, { label })
      .then((r) => r.data),
}

// Playground
export const playgroundApi = {
  compile: (data: { type: string; text?: string; messages?: any[]; variables: Record<string, string> }) =>
    api.post('/playground/compile', data).then((r) => r.data),

  run: (data: PlaygroundRequest) =>
    api.post<PlaygroundResponse>('/playground/run', data).then((r) => r.data),

  runVersion: (versionId: string, data: { variables: Record<string, string>; model_config: any }) =>
    api.post<PlaygroundResponse>(`/playground/run-version/${versionId}`, data)
      .then((r) => r.data),

  runMulti: (data: PlaygroundRequest & { models: any[] }) =>
    api.post<PlaygroundResponse[]>('/playground/run-multi', data)
      .then((r) => r.data),
}

// Datasets
export const datasetsApi = {
  list: (useCaseId: string) =>
    api.get<Dataset[]>(`/use-cases/${useCaseId}/datasets`).then((r) => r.data),

  get: (id: string) =>
    api.get<Dataset>(`/datasets/${id}`).then((r) => r.data),

  create: (useCaseId: string, data: DatasetCreate) =>
    api.post<Dataset>(`/use-cases/${useCaseId}/datasets`, data)
      .then((r) => r.data),

  update: (id: string, data: Partial<DatasetCreate>) =>
    api.patch<Dataset>(`/datasets/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/datasets/${id}`).then((r) => r.data),

  // Items
  listItems: (datasetId: string, params?: { page?: number; limit?: number }) =>
    api.get<DatasetItem[]>(`/datasets/${datasetId}/items`, { params })
      .then((r) => r.data),

  createItem: (datasetId: string, data: DatasetItemCreate) =>
    api.post<DatasetItem>(`/datasets/${datasetId}/items`, data)
      .then((r) => r.data),

  batchCreateItems: (datasetId: string, items: DatasetItemCreate[]) =>
    api.post<DatasetItem[]>(`/datasets/${datasetId}/items/batch`, { items })
      .then((r) => r.data),

  updateItem: (itemId: string, data: Partial<DatasetItemCreate>) =>
    api.patch<DatasetItem>(`/datasets/items/${itemId}`, data)
      .then((r) => r.data),

  deleteItem: (itemId: string) =>
    api.delete(`/datasets/items/${itemId}`).then((r) => r.data),
}

// Evaluations
export const evaluationsApi = {
  list: (params?: { prompt_version_id?: string; dataset_id?: string; status?: string }) =>
    api.get<EvalRun[]>('/eval-runs', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<EvalRun>(`/eval-runs/${id}`).then((r) => r.data),

  create: (data: EvalRunCreate) =>
    api.post<EvalRun>('/eval-runs', data).then((r) => r.data),

  cancel: (id: string) =>
    api.post(`/eval-runs/${id}/cancel`).then((r) => r.data),

  listResults: (runId: string, params?: { page?: number; limit?: number }) =>
    api.get<EvalResult[]>(`/eval-runs/${runId}/results`, { params })
      .then((r) => r.data),
}

// Exports
export const exportsApi = {
  exportJson: (runId: string) =>
    api.get(`/eval-runs/${runId}/export.json`).then((r) => r.data),

  exportMarkdown: (runId: string) =>
    api.get(`/eval-runs/${runId}/export.md`, { responseType: 'text' })
      .then((r) => r.data),
}
```

## Type Definitions

### Core Types

```tsx
// types/index.ts

// Base types
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Project
export interface Project extends BaseEntity {
  name: string
  description?: string
}

export interface ProjectCreate {
  name: string
  description?: string
}

// Use Case
export interface UseCase extends BaseEntity {
  project_id: string
  name: string
  description?: string
}

export interface UseCaseCreate {
  name: string
  description?: string
}

// Prompt
export interface Prompt extends BaseEntity {
  use_case_id: string
  name: string
  description?: string
  tags: string[]
}

export interface PromptCreate {
  name: string
  description?: string
  tags?: string[]
}

// Prompt Version
export interface PromptVersion {
  id: string
  prompt_id: string
  version_number: number
  type: 'text' | 'chat'
  template_text?: string
  template_messages?: ChatMessage[]
  model_defaults?: ModelDefaults
  variables_schema?: object
  labels: string[]
  created_at: string
  created_by?: string
  commit_message?: string
}

export interface PromptVersionCreate {
  type: 'text' | 'chat'
  template_text?: string
  template_messages?: ChatMessage[]
  model_defaults?: ModelDefaults
  variables_schema?: object
  commit_message?: string
}

// Chat message
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Model configuration
export interface ModelConfig {
  id: string
  label?: string
  provider: string
  model: string
  temperature?: number
  max_tokens?: number
  top_p?: number
}

export interface ModelDefaults {
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
}

// Dataset
export interface Dataset extends BaseEntity {
  use_case_id: string
  name: string
  description?: string
  input_schema?: object
  expected_output_schema?: object
  default_assertions?: Assertion[]
  item_count?: number
}

export interface DatasetCreate {
  name: string
  description?: string
  input_schema?: object
  expected_output_schema?: object
  default_assertions?: Assertion[]
}

// Dataset Item
export interface DatasetItem extends BaseEntity {
  dataset_id: string
  input: Record<string, any>
  expected_output?: Record<string, any>
  metadata?: Record<string, any>
}

export interface DatasetItemCreate {
  input: Record<string, any>
  expected_output?: Record<string, any>
  metadata?: Record<string, any>
}

// Assertion
export interface Assertion {
  type: 'contains' | 'not_contains' | 'equals' | 'regex' | 'json_match' | 'llm_grade'
  value?: string
  path?: string
  criteria?: string
  weight?: number
}

// Evaluation Run
export interface EvalRun {
  id: string
  prompt_version_id: string
  dataset_id: string
  name?: string
  models: ModelConfig[]
  assertions: Assertion[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  progress: EvalProgress
  summary?: EvalSummary
  created_at: string
  started_at?: string
  completed_at?: string
  created_by?: string
}

export interface EvalRunCreate {
  prompt_version_id: string
  dataset_id: string
  name?: string
  models: ModelConfig[]
  assertions?: Assertion[]
}

export interface EvalProgress {
  total: number
  completed: number
  failed: number
  percent: number
}

export interface EvalSummary {
  total_results: number
  pass_count: number
  fail_count: number
  pass_rate: number
  avg_latency_ms: number
  total_tokens: number
  total_cost_usd: number
  by_model: Record<string, ModelSummary>
}

export interface ModelSummary {
  pass_count: number
  fail_count: number
  pass_rate: number
  avg_latency_ms: number
  total_tokens: number
  cost_usd: number
}

// Evaluation Result
export interface EvalResult {
  id: string
  eval_run_id: string
  dataset_item_id: string
  model_id: string
  model_config: ModelConfig
  request?: object
  output: string
  output_json?: object
  grading: EvalGrading
  metrics: EvalMetrics
  created_at: string
}

export interface EvalGrading {
  pass: boolean
  score: number
  reason?: string
  assertions: AssertionResult[]
}

export interface AssertionResult {
  type: string
  pass: boolean
  expected?: string
  actual?: string
  reason?: string
}

export interface EvalMetrics {
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd?: number
  error?: string
}

// Playground
export interface PlaygroundRequest {
  type: 'text' | 'chat'
  template_text?: string
  template_messages?: ChatMessage[]
  variables: Record<string, string>
  model_config: ModelConfig
}

export interface PlaygroundResponse {
  output: string
  model_id: string
  latency_ms: number
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost_usd?: number
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}
```

## Styling

### Tailwind Configuration

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### Utility Classes

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Build Configuration

### Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Performance Optimization

### Virtual Scrolling

For large lists:

```tsx
// components/eval-results/VirtualizedResultsTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualizedResultsTable({ results }: { results: EvalResult[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ResultRow result={results[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Code Splitting

React Router lazy loading:

```tsx
import { lazy, Suspense } from 'react'

const EvalRunDetailPage = lazy(() => import('./pages/EvalRunDetailPage'))

// In routes
<Route
  path="/eval-runs/:runId"
  element={
    <Suspense fallback={<Loading />}>
      <EvalRunDetailPage />
    </Suspense>
  }
/>
```

## Next Steps

- [Components Guide](../frontend/components.md) - Detailed component docs
- [Hooks Reference](../frontend/hooks.md) - Custom hooks documentation
- [Pages & Routes](../frontend/pages-routes.md) - Page documentation

---

*Frontend architecture documentation generated December 2024*
