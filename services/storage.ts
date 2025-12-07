import { SavedPrompt, TestRun } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API 请求辅助函数
const apiRequest = async (endpoint: string, options?: RequestInit) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const storageService = {
  // --- Prompts ---
  getSystemPrompts: async (): Promise<SavedPrompt[]> => {
    try {
      return await apiRequest('/api/prompts/system');
    } catch {
      return [];
    }
  },

  getUserPrompts: async (): Promise<SavedPrompt[]> => {
    try {
      return await apiRequest('/api/prompts/user');
    } catch {
      return [];
    }
  },

  // Returns the updated list of prompts to ensure state is in sync
  savePrompt: async (prompt: SavedPrompt): Promise<SavedPrompt[]> => {
    try {
      const endpoint = prompt.type === 'system' ? '/api/prompts/system' : '/api/prompts/user';
      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(prompt),
      });
    } catch (e) {
      console.error("Storage Error", e);
      return [];
    }
  },

  deletePrompt: async (id: string, type: 'system' | 'user'): Promise<SavedPrompt[]> => {
    try {
      const endpoint = type === 'system' ? `/api/prompts/system/${id}` : `/api/prompts/user/${id}`;
      return await apiRequest(endpoint, {
        method: 'DELETE',
      });
    } catch {
      return [];
    }
  },

  updatePromptTitle: async (id: string, type: 'system' | 'user', newTitle: string): Promise<SavedPrompt[]> => {
    try {
      const endpoint = type === 'system' ? `/api/prompts/system/${id}/title` : `/api/prompts/user/${id}/title`;
      return await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
    } catch {
      return [];
    }
  },

  togglePromptFavorite: async (id: string, type: 'system' | 'user'): Promise<SavedPrompt[]> => {
    try {
      const endpoint = type === 'system' ? `/api/prompts/system/${id}/favorite` : `/api/prompts/user/${id}/favorite`;
      return await apiRequest(endpoint, {
        method: 'PATCH',
      });
    } catch {
      return [];
    }
  },

  // --- History ---
  getHistory: async (): Promise<TestRun[]> => {
    try {
      return await apiRequest('/api/history');
    } catch {
      return [];
    }
  },

  saveTestRun: async (run: TestRun): Promise<void> => {
    try {
      await apiRequest('/api/history', {
        method: 'POST',
        body: JSON.stringify(run),
      });
    } catch (e) {
      console.error('Save test run error:', e);
    }
  },
  
  deleteHistoryItem: async (id: string): Promise<TestRun[]> => {
    try {
      return await apiRequest(`/api/history/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return [];
    }
  },

  toggleHistoryFavorite: async (id: string): Promise<TestRun[]> => {
    try {
      return await apiRequest(`/api/history/${id}/favorite`, {
        method: 'PATCH',
      });
    } catch {
      return [];
    }
  },

  // --- Settings ---
  getApiKey: async (): Promise<string> => {
    try {
      const result = await apiRequest('/api/settings/api-key');
      return result.apiKey || '';
    } catch {
      return '';
    }
  },

  saveApiKey: async (key: string): Promise<void> => {
    try {
      await apiRequest('/api/settings/api-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: key }),
      });
    } catch (e) {
      console.error('Save API key error:', e);
    }
  }
};