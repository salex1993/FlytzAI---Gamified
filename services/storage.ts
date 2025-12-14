
import { SavedStrategy } from '../types';

const STORAGE_KEY = 'flytz_strategies_v1';

export const storageService = {
  save: (strategy: SavedStrategy): boolean => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      let strategies: SavedStrategy[] = [];
      if (existing) {
        try {
          strategies = JSON.parse(existing);
        } catch (parseError) {
          console.warn("Corrupted storage, resetting.", parseError);
          strategies = [];
        }
      }
      
      // Update if exists (replace), else push new
      const index = strategies.findIndex(s => s.id === strategy.id);
      if (index >= 0) {
        strategies[index] = strategy;
      } else {
        strategies.push(strategy);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
      return true;
    } catch (e) {
      console.error("Failed to save strategy", e);
      return false;
    }
  },

  getAll: (): SavedStrategy[] => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) return [];
      try {
        return JSON.parse(existing);
      } catch (e) {
        return [];
      }
    } catch (e) {
      return [];
    }
  },

  delete: (id: string): boolean => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) return false;
      
      const strategies: SavedStrategy[] = JSON.parse(existing);
      const filtered = strategies.filter(s => s.id !== id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }
};
