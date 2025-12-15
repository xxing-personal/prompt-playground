export const AVAILABLE_MODELS = [
  // OpenAI
  { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },

  // Anthropic
  { id: 'anthropic/claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic' },
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic' },

  // Google
  { id: 'gemini/gemini-3.0-pro-preview', name: 'Gemini 3.0 Pro', provider: 'google' },
  { id: 'gemini/gemini-3.0-deep-think-preview', name: 'Gemini 3.0 Deep Think', provider: 'google' },
  { id: 'gemini/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
] as const

export type ModelId = typeof AVAILABLE_MODELS[number]['id']
export type ModelInfo = typeof AVAILABLE_MODELS[number]
