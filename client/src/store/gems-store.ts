import { create } from 'zustand';
import { apiFetch } from "@/lib/api";

interface GemsState {
  gems: number;
  isLoading: boolean;
  
  loadGems: () => Promise<void>;
  setGems: (gems: number) => void;
  addGems: (amount: number, description: string, relatedId?: string) => Promise<void>;
  spendGems: (amount: number, description: string, relatedId?: string) => Promise<boolean>;
  resetGems: () => void;
  
  // Transaction and purchase history
  loadTransactions: () => Promise<void>;
  loadPurchases: () => Promise<void>;
  transactions: any[];
  purchases: any[];
}

export const useGemsStore = create<GemsState>((set, get) => ({
  gems: 0,
  isLoading: false,
  transactions: [],
  purchases: [],
  
  loadGems: async () => {
    set({ isLoading: true });
    try {
      const response = await apiFetch('/api/user/gems');
      if (response.ok) {
        const data = await response.json();
        set({ gems: data.gems || 0 });
        
        // Sync with userStore for profile consistency  
        try {
          const { updateUser } = require('./user-store').useUserStore.getState();
          updateUser({ gems: data.gems || 0 });
        } catch (error) {
          console.warn('Failed to sync gems with user store:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load gems:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  setGems: (gems: number) => {
    set({ gems });
  },
  
  addGems: async (amount: number, description: string, relatedId?: string) => {
    const currentGems = get().gems;
    const newGems = currentGems + amount;
    
    // Update locally first for immediate UI feedback
    set({ gems: newGems });
    
    // Sync with userStore for profile consistency
    try {
      const { updateUser } = require('./user-store').useUserStore.getState();
      updateUser({ gems: newGems });
    } catch (error) {
      console.warn('Failed to sync gems with user store:', error);
    }
    
    // Then sync with database
    try {
      await apiFetch('/api/user/gems/add', {
        method: 'POST',
        body: JSON.stringify({ amount, description, relatedId }),
      });
    } catch (error) {
      console.error('Failed to add gems on server:', error);
      // Revert on error
      set({ gems: currentGems });
    }
  },
  
  spendGems: async (amount: number, description: string, relatedId?: string): Promise<boolean> => {
    const currentGems = get().gems;
    
    if (currentGems < amount) {
      return false; // Not enough gems
    }
    
    const newGems = currentGems - amount;
    
    // Update locally first for immediate UI feedback
    set({ gems: newGems });
    
    // Sync with userStore for profile consistency
    try {
      const { updateUser } = require('./user-store').useUserStore.getState();
      updateUser({ gems: newGems });
    } catch (error) {
      console.warn('Failed to sync gems with user store:', error);
    }
    
    // Then sync with database
    try {
      await apiFetch('/api/user/gems/spend', {
        method: 'POST',
        body: JSON.stringify({ amount, description, relatedId }),
      });
      return true;
    } catch (error) {
      console.error('Failed to spend gems on server:', error);
      // Revert on error
      set({ gems: currentGems });
      return false;
    }
  },
  
  loadTransactions: async () => {
    try {
      const response = await apiFetch('/api/user/gems/transactions');
      if (response.ok) {
        const transactions = await response.json();
        set({ transactions });
      }
    } catch (error) {
      console.error('Failed to load gem transactions:', error);
    }
  },
  
  loadPurchases: async () => {
    try {
      const response = await apiFetch('/api/user/gems/purchases');
      if (response.ok) {
        const purchases = await response.json();
        set({ purchases });
      }
    } catch (error) {
      console.error('Failed to load gem purchases:', error);
    }
  },
  
  resetGems: () => {
    set({ gems: 0, transactions: [], purchases: [] });
  },
}));