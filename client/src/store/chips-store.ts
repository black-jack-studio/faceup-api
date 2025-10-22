import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';
import { syncChipsToUser } from '@/lib/store-sync';

interface ChipsState {
  balance: number;
  isLoading: boolean;
  loadBalance: () => Promise<void>;
  setBalance: (balance: number) => void;
  deductBet: (amount: number) => Promise<void>;
  addWinnings: (amount: number) => Promise<void>;
  setAllInBalance: (amount: number) => Promise<void>;
  resetBalance: () => void;
}

const INITIAL_BALANCE = 0;
const logger = createLogger('COINS_SYNC');

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logger.error('Failed to retrieve Supabase user', error);
    return null;
  }

  const userId = data.user?.id ?? null;
  if (!userId) {
    logger.warn('No authenticated Supabase user found while syncing coins');
  }
  return userId;
}

async function fetchCoins(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('coins')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Failed to load coins from Supabase', error);
    throw error;
  }

  return data?.coins ?? 0;
}

async function persistCoins(userId: string, coins: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ coins })
    .eq('id', userId);

  if (error) {
    logger.error('Failed to persist coins to Supabase', error);
    throw error;
  }
}

export const useChipsStore = create<ChipsState>((set, get) => ({
  balance: INITIAL_BALANCE,
  isLoading: false,

  loadBalance: async () => {
    set({ isLoading: true });

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        set({ balance: INITIAL_BALANCE });
        syncChipsToUser(INITIAL_BALANCE);
        return;
      }

      const coins = await fetchCoins(userId);
      set({ balance: coins });
      syncChipsToUser(coins);
      logger.debug('Loaded coins balance from Supabase', { coins });
    } catch (error) {
      logger.error('Failed to load coin balance', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setBalance: (balance: number) => {
    set({ balance });
    syncChipsToUser(balance);
  },

  deductBet: async (amount: number) => {
    const currentBalance = get().balance;
    const newBalance = Math.max(0, currentBalance - amount);
    set({ balance: newBalance });

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        throw new Error('Cannot deduct bet without authenticated user');
      }

      await persistCoins(userId, newBalance);
      syncChipsToUser(newBalance);
      logger.debug('Deducted bet and synced balance', { amount, newBalance });
    } catch (error) {
      set({ balance: currentBalance });
      syncChipsToUser(currentBalance);
      logger.error('Failed to deduct bet. Restoring previous balance.', error);
      throw error;
    }
  },

  addWinnings: async (amount: number) => {
    const currentBalance = get().balance;
    const newBalance = currentBalance + amount;
    set({ balance: newBalance });

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        throw new Error('Cannot add winnings without authenticated user');
      }

      await persistCoins(userId, newBalance);
      syncChipsToUser(newBalance);
      logger.debug('Added winnings and synced balance', { amount, newBalance });
    } catch (error) {
      set({ balance: currentBalance });
      syncChipsToUser(currentBalance);
      logger.error('Failed to persist winnings. Restoring previous balance.', error);
      throw error;
    }
  },

  setAllInBalance: async (finalBalance: number) => {
    const previousBalance = get().balance;
    set({ balance: finalBalance });

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        throw new Error('Cannot set all-in balance without authenticated user');
      }

      await persistCoins(userId, finalBalance);
      syncChipsToUser(finalBalance);
      logger.info('Applied all-in balance', { finalBalance });
    } catch (error) {
      set({ balance: previousBalance });
      syncChipsToUser(previousBalance);
      logger.error('Failed to apply all-in balance. Restoring previous value.', error);
      throw error;
    }
  },

  resetBalance: () => {
    set({ balance: INITIAL_BALANCE });
    syncChipsToUser(INITIAL_BALANCE);
  },
}));
