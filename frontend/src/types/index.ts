export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  use_case_count?: number;
}

export interface UseCase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  prompt_count?: number;
  dataset_count?: number;
}

export interface Prompt {
  id: string;
  use_case_id: string;
  name: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  version_count?: number;
  latest_version?: number;
  production_version?: number;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  type: 'text' | 'chat';
  template_text: string | null;
  template_messages: { role: string; content: string }[] | null;
  model_defaults: Record<string, unknown>;
  variables_schema: Record<string, unknown> | null;
  commit_message: string | null;
  created_by: string | null;
  created_at: string;
  labels: string[];
}

export interface Dataset {
  id: string;
  use_case_id: string;
  name: string;
  description: string | null;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DatasetItem {
  id: string;
  dataset_id: string;
  input: Record<string, unknown>;
  expected_output: unknown | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModelConfig {
  id?: string; // Optional if auto-generated
  model: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  [key: string]: unknown; // Allow future extensions
}

export interface AssertionConfig {
  type: string;
  config: Record<string, unknown>;
}

export interface EvalRun {
  id: string;
  name: string | null;
  prompt_version_id: string;
  dataset_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress: { total: number; completed: number; failed: number; percent: number };
  summary: Record<string, unknown> | null;
  error_message?: string | null;
  created_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  share_token?: string | null;
  share_expires_at?: string | null;
  models?: ModelConfig[];     // Populated in detail view
  assertions?: AssertionConfig[]; // Populated in detail view
}

export interface EvalResult {
  id: string;
  eval_run_id: string;
  dataset_item_id: string;
  model_id: string;
  model_config: Record<string, unknown>;
  input: Record<string, unknown>;
  expected_output: unknown | null;
  output: string | null;
  output_json: Record<string, unknown> | null;
  grading: {
    pass: boolean;
    score: number;
    reason: string;
    assertions: {
      type: string;
      pass: boolean;
      score: number;
      reason: string;
      details: unknown;
    }[];
  };
  metrics: {
    latency_ms: number;
    tokens: Record<string, number>;
    cost_usd: number | null;
    retries: number;
    error?: string | null;
  };
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
