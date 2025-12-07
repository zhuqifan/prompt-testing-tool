import { SavedPrompt, TestRun } from '../types';

const KEYS = {
  SYSTEM_PROMPTS: 'pel_system_prompts',
  USER_PROMPTS: 'pel_user_prompts',
  HISTORY: 'pel_history',
  API_KEY: 'pel_volc_api_key',
};

export const storageService = {
  // --- Prompts ---
  getSystemPrompts: (): SavedPrompt[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.SYSTEM_PROMPTS) || '[]');
    } catch { return []; }
  },

  getUserPrompts: (): SavedPrompt[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.USER_PROMPTS) || '[]');
    } catch { return []; }
  },

  // Returns the updated list of prompts to ensure state is in sync
  savePrompt: (prompt: SavedPrompt): SavedPrompt[] => {
    try {
      const key = prompt.type === 'system' ? KEYS.SYSTEM_PROMPTS : KEYS.USER_PROMPTS;
      const current = prompt.type === 'system' ? storageService.getSystemPrompts() : storageService.getUserPrompts();
      
      const existsIndex = current.findIndex(p => p.id === prompt.id);
      let updated;
      if (existsIndex >= 0) {
        updated = [...current];
        updated[existsIndex] = prompt;
      } else {
        updated = [prompt, ...current];
      }
      
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Storage Error", e);
      return [];
    }
  },

  deletePrompt: (id: string, type: 'system' | 'user'): SavedPrompt[] => {
    try {
      const key = type === 'system' ? KEYS.SYSTEM_PROMPTS : KEYS.USER_PROMPTS;
      const current = type === 'system' ? storageService.getSystemPrompts() : storageService.getUserPrompts();
      const updated = current.filter(p => p.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) { return []; }
  },

  updatePromptTitle: (id: string, type: 'system' | 'user', newTitle: string): SavedPrompt[] => {
    try {
      const key = type === 'system' ? KEYS.SYSTEM_PROMPTS : KEYS.USER_PROMPTS;
      const current = type === 'system' ? storageService.getSystemPrompts() : storageService.getUserPrompts();
      const updated = current.map(p => p.id === id ? { ...p, title: newTitle } : p);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) { return []; }
  },

  togglePromptFavorite: (id: string, type: 'system' | 'user'): SavedPrompt[] => {
    try {
        const key = type === 'system' ? KEYS.SYSTEM_PROMPTS : KEYS.USER_PROMPTS;
        const current = type === 'system' ? storageService.getSystemPrompts() : storageService.getUserPrompts();
        const updated = current.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
    } catch (e) { return []; }
  },

  // --- History ---
  getHistory: (): TestRun[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    } catch { return []; }
  },

  saveTestRun: (run: TestRun): void => {
    try {
      const current = storageService.getHistory();
      // Check if run already exists to prevent duplicates
      const exists = current.find(r => r.id === run.id);
      if (!exists) {
        const updated = [run, ...current].slice(0, 50);
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      }
    } catch (e) {}
  },
  
  deleteHistoryItem: (id: string): TestRun[] => {
    try {
      const current = storageService.getHistory();
      const updated = current.filter(item => item.id !== id);
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      return updated;
    } catch (e) { return []; }
  },

  toggleHistoryFavorite: (id: string): TestRun[] => {
    try {
        const current = storageService.getHistory();
        const updated = current.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
        return updated;
    } catch (e) { return []; }
  },

  // --- Settings ---
  getApiKey: (): string => {
    try {
      return localStorage.getItem(KEYS.API_KEY) || '';
    } catch { return ''; }
  },

  saveApiKey: (key: string): void => {
    try {
      localStorage.setItem(KEYS.API_KEY, key);
    } catch (e) {}
  }
};