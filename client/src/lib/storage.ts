import type { HistoryItem } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'folder-insights-history',
  THEME: 'folder-insights-theme',
  SHELL_PREFERENCE: 'folder-insights-shell',
} as const;

export class StorageService {
  static getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error);
      return [];
    }
  }

  static saveToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
    try {
      const history = this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      // Add to beginning and keep only last 10
      const updatedHistory = [newItem, ...history].slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save to history:', error);
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
      console.warn('Failed to clear history:', error);
    }
  }

  static getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      return (stored as 'light' | 'dark') || 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  static setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      // Update document class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  static getShellPreference(): 'bash' | 'zsh' | 'fish' | 'powershell' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHELL_PREFERENCE);
      return (stored as any) || 'bash';
    } catch (error) {
      return 'bash';
    }
  }

  static setShellPreference(shell: 'bash' | 'zsh' | 'fish' | 'powershell'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHELL_PREFERENCE, shell);
    } catch (error) {
      console.warn('Failed to save shell preference:', error);
    }
  }
}