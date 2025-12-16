import axios from 'axios';
export * from '../types';
import {
  Project,
  UseCase,
  Prompt,
  PromptVersion,
  Dataset,
  DatasetItem,
  EvalRun,
  PaginatedResponse,
  EvalResult,
  ModelConfig,
  AssertionConfig
} from '../types';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const projectsApi = {
  list: (page = 1, limit = 50) =>
    api.get<PaginatedResponse<Project>>(`/projects?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
};

export const useCasesApi = {
  list: (projectId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<UseCase>>(`/projects/${projectId}/use-cases?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get<UseCase>(`/use-cases/${id}`),
  create: (projectId: string, data: { name: string; description?: string }) =>
    api.post<UseCase>(`/projects/${projectId}/use-cases`, data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<UseCase>(`/use-cases/${id}`, data),
  delete: (id: string) =>
    api.delete(`/use-cases/${id}`),
};

export const promptsApi = {
  list: (useCaseId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<Prompt>>(`/use-cases/${useCaseId}/prompts?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get<Prompt>(`/prompts/${id}`),
  create: (useCaseId: string, data: { name: string; description?: string; tags?: string[] }) =>
    api.post<Prompt>(`/use-cases/${useCaseId}/prompts`, data),
  update: (id: string, data: { name?: string; description?: string; tags?: string[] }) =>
    api.patch<Prompt>(`/prompts/${id}`, data),
  delete: (id: string) =>
    api.delete(`/prompts/${id}`),
  listVersions: (promptId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<PromptVersion>>(`/prompts/${promptId}/versions?page=${page}&limit=${limit}`),
  createVersion: (promptId: string, data: Partial<PromptVersion>) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions`, data),
  getVersion: (promptId: string, versionNumber: number) =>
    api.get<PromptVersion>(`/prompts/${promptId}/versions/${versionNumber}`),
  promote: (promptId: string, versionNumber: number, label: string) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions/${versionNumber}/promote`, { label }),
  demote: (promptId: string, versionNumber: number, label: string) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions/${versionNumber}/demote`, { label }),
};

export interface PlaygroundRunConfig {
  templateType: 'text' | 'chat';
  templateText?: string;
  templateMessages?: { role: string; content: string }[];
  variables: Record<string, string>;
  models: Array<{
    id: string;
    model: string;
    provider: string;
    temperature: number;
    maxTokens: number;
    reasoning_effort?: string;
    enabled: boolean;
  }>;
}

export interface PlaygroundRunResultItem {
  modelId: string;
  modelName: string;
  output: string;
  metrics: {
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number | null;
  };
  error?: string;
  completedAt: string;
}

export interface PlaygroundRunData {
  id: string;
  prompt_id: string;
  version_id: string | null;
  config: PlaygroundRunConfig;
  results: PlaygroundRunResultItem[];
  created_at: string;
}

export interface VersionRunResult {
  version_id: string;
  version_number: number;
  output: string | null;
  metrics: {
    latency_ms: number;
    total_tokens: number;
    cost_usd: number | null;
  };
  error: string | null;
}

export const playgroundApi = {
  compile: (data: {
    template_type: string;
    template_text?: string;
    template_messages?: { role: string; content: string }[];
    variables: Record<string, unknown>;
  }) => api.post('/playground/compile', data),
  run: (data: {
    template_type: string;
    template_text?: string;
    template_messages?: { role: string; content: string }[];
    variables: Record<string, unknown>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) => api.post('/playground/run', data),
  runVersion: (versionId: string, data: {
    variables: Record<string, unknown>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) => api.post(`/playground/run-version/${versionId}`, data),
  saveRun: (data: {
    prompt_id: string;
    version_id?: string;
    config: PlaygroundRunConfig;
    results: PlaygroundRunResultItem[];
  }) => api.post<PlaygroundRunData>('/playground/runs', data),
  getRunsByVersion: (versionId: string, limit = 10) =>
    api.get<PlaygroundRunData[]>(`/playground/runs/by-version/${versionId}?limit=${limit}`),
  runVersions: (data: {
    versions: {
      version_id: string;
      model: string;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      reasoning_effort?: string;
    }[];
    variables: Record<string, unknown>;
  }) => api.post<{ results: VersionRunResult[] }>('/playground/run-versions', data),
};

export const datasetsApi = {
  list: (useCaseId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<Dataset>>(`/use-cases/${useCaseId}/datasets?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get<Dataset>(`/datasets/${id}`),
  create: (useCaseId: string, data: { name: string; description?: string }) =>
    api.post<Dataset>(`/use-cases/${useCaseId}/datasets`, data),
  delete: (id: string) =>
    api.delete(`/datasets/${id}`),
  listItems: (datasetId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<DatasetItem>>(`/datasets/${datasetId}/items?page=${page}&limit=${limit}`),
  createItem: (datasetId: string, data: { input: Record<string, unknown>; expected_output?: string }) =>
    api.post<DatasetItem>(`/datasets/${datasetId}/items`, data),
};

export const evalRunsApi = {
  list: (page = 1, limit = 50) =>
    api.get<PaginatedResponse<EvalRun>>(`/eval-runs?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get<EvalRun>(`/eval-runs/${id}`),
  create: (data: {
    name?: string;
    prompt_version_id: string;
    dataset_id: string;
    models: ModelConfig[];
    assertions?: AssertionConfig[];
  }) => api.post<EvalRun>('/eval-runs', data),
  cancel: (id: string) =>
    api.post<EvalRun>(`/eval-runs/${id}/cancel`),
  delete: (id: string) =>
    api.delete(`/eval-runs/${id}`),
  getResults: (id: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<EvalResult>>(`/eval-runs/${id}/results?page=${page}&limit=${limit}`),
  createShareLink: (id: string, expiresInDays = 7) =>
    api.post<{ token: string; url: string; expires_at: string }>(`/eval-runs/${id}/share?expires_in_days=${expiresInDays}`),
  exportJson: (id: string) =>
    api.get(`/eval-runs/${id}/export.json`),
  exportMarkdown: (id: string) =>
    api.get(`/eval-runs/${id}/export.md`),
};
