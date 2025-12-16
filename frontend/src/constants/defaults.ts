/** Default model configuration values */
export const MODEL_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
} as const

/** Default pagination settings */
export const PAGINATION_DEFAULTS = {
  pageSize: 50,
  historyLimit: 5,
} as const

/** API timeout settings (in milliseconds) */
export const TIMEOUT_DEFAULTS = {
  llmRequest: 120000, // 2 minutes
  apiRequest: 30000,  // 30 seconds
} as const

/** Default model ID */
export const DEFAULT_MODEL = 'gpt-4o'
