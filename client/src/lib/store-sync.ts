import { createLogger } from '@/lib/logger';

type UserStoreModule = typeof import('@/store/user-store');
type ChipsStoreModule = typeof import('@/store/chips-store');

const logger = createLogger('COINS_SYNC');

function getUserStore(): UserStoreModule['useUserStore'] {
  const module = require('@/store/user-store') as UserStoreModule;
  return module.useUserStore;
}

function getChipsStore(): ChipsStoreModule['useChipsStore'] {
  const module = require('@/store/chips-store') as ChipsStoreModule;
  return module.useChipsStore;
}

export function syncUserCoinsToChips(coins: number): void {
  try {
    const useChipsStore = getChipsStore();
    useChipsStore.setState({ balance: coins });
    logger.debug('Synced user store coins to chips store', { coins });
  } catch (error) {
    logger.warn('Unable to sync user coins to chips store', error);
  }
}

export function syncChipsToUser(coins: number): void {
  try {
    const useUserStore = getUserStore();
    const { updateUser } = useUserStore.getState();
    updateUser({ coins }, { skipServer: true });
    logger.debug('Synced chips store balance to user store', { coins });
  } catch (error) {
    logger.warn('Unable to sync chips balance to user store', error);
  }
}

export async function reloadCoinsBalance(): Promise<void> {
  try {
    const useChipsStore = getChipsStore();
    await useChipsStore.getState().loadBalance();
  } catch (error) {
    logger.warn('Unable to reload coins balance from Supabase', error);
  }
}
