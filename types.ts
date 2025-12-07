export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'user';
  createdAt: number;
  isFavorite?: boolean;
}

export interface ModelConfig {
  model: string;
  temperature: number;
  frequency_penalty: number;
  presence_penalty: number;
  thinking: { type: 'enabled' | 'disabled' };
  outputCount: number; // How many parallel requests
}

export interface GenerationResult {
  id: number;
  content: string;
  status: 'idle' | 'loading' | 'streaming' | 'completed' | 'error';
  error?: string;
  duration?: number;
}

export interface TestRun {
  id: string;
  timestamp: number;
  systemPrompt: string;
  userPrompt: string;
  config: ModelConfig;
  results: GenerationResult[];
  isFavorite?: boolean;
}

export const DEFAULT_CONFIG: ModelConfig = {
  model: 'doubao-seed-1-6-251015',
  temperature: 1.0,
  frequency_penalty: 0,
  presence_penalty: 0,
  thinking: { type: 'enabled' },
  outputCount: 4,
};