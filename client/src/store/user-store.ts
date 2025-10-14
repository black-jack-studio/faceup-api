import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@shared/schema';
import { apiRequest, queryClient, invalidateCSRFToken } from '@/lib/queryClient';
import { login as loginRequest, register as registerRequest, logout as logoutRequest } from '@/lib/api';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
  loadUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  addTickets: (amount: number) => void;
  addXP: (amount: number) => void;
  addSeasonXP: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => boolean;
  spendGems: (amount: number) => boolean;
  spendTickets: (amount: number) => boolean;
  checkSubscriptionStatus: () => Promise<void>;
  isPremium: () => boolean;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const userData = await loginRequest({ username, password });

          // Invalidate CSRF token cache after login to force new token fetch
          invalidateCSRFToken();

          set({ 
            user: userData.user, 
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed',
            isLoading: false 
          });
          // Normalize error to ensure errorType is preserved
          const normalizedError = {
            message: error?.message || 'Login failed',
            errorType: error?.errorType,
            status: error?.status ?? 401,
          };
          throw normalizedError;
        }
      },

      register: async (username: string, email: string, password: string, confirmPassword?: string) => {
        set({ isLoading: true, error: null });

        try {
          const userData = await registerRequest({
            username,
            email,
            password,
            confirmPassword: confirmPassword ?? password,
          });

          // Invalidate CSRF token cache after registration to force new token fetch
          invalidateCSRFToken();

          set({ 
            user: userData.user, 
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed',
            isLoading: false 
          });
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ 
          user,
          isLoading: false,
          error: null 
        });
      },

      logout: () => {
        set({ user: null, error: null });
        queryClient.clear();
        // Clear session on server
        logoutRequest().catch(() => {
          // Ignore errors on logout
        });
      },

      loadUser: async () => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        set({ isLoading: true });
        
        try {
          const response = await apiRequest('GET', '/api/user/profile');
          const userData = await response.json();
          
          set({ 
            user: userData,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          // If unauthorized, clear user
          if (error.message.includes('401')) {
            set({ user: null });
          }
          set({ 
            error: error.message,
            isLoading: false 
          });
        }
      },

      initializeAuth: async () => {
        // Check if we have a stored user from localStorage
        const storedUser = get().user;
        
        // If no stored user, no need to check session
        if (!storedUser) {
          set({ isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Try to fetch current user profile to verify session is still valid
          const response = await apiRequest('GET', '/api/user/profile');
          const userData = await response.json();
          
          // Session is valid, update user data
          set({ 
            user: userData,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          // Session is invalid or expired, clear stored user
          if (error.message.includes('401') || error.message.includes('403')) {
            set({ 
              user: null,
              isLoading: false,
              error: null 
            });
            queryClient.clear();
          } else {
            // Other error, keep stored user but show error
            set({ 
              error: error.message,
              isLoading: false 
            });
          }
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        set({
          user: { ...currentUser, ...updates }
        });
        
        // Sync to server
        apiRequest('PATCH', '/api/user/profile', updates).catch((error) => {
          console.error('Failed to sync user updates:', error);
        });
      },

      addCoins: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const newCoins = (currentUser.coins || 0) + amount;
        get().updateUser({ coins: newCoins });
        
        // Synchroniser avec useChipsStore pour l'affichage
        try {
          const { setBalance } = require('./chips-store').useChipsStore.getState();
          setBalance(newCoins);
        } catch (error) {
          console.warn('Failed to sync with chips store:', error);
        }
      },

      addGems: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const newGems = (currentUser.gems || 0) + amount;
        get().updateUser({ gems: newGems });
      },

      addTickets: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const newTickets = (currentUser.tickets || 0) + amount;
        get().updateUser({ tickets: newTickets });
      },

      addXP: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const currentLevel = currentUser.level || 1;
        const currentLevelXP = currentUser.currentLevelXP || 0;
        const totalXP = currentUser.xp || 0;
        
        // Add XP to current level
        let newCurrentLevelXP = currentLevelXP + amount;
        let newLevel = currentLevel;
        
        // Check if we need to level up (500 XP per level)
        while (newCurrentLevelXP >= 500) {
          newCurrentLevelXP -= 500; // Reset to 0 and carry over
          newLevel++;
        }
        
        const newTotalXP = totalXP + amount;
        
        get().updateUser({ 
          xp: newTotalXP,
          currentLevelXP: newCurrentLevelXP,
          level: newLevel 
        });
        
        // Award level-up bonus
        if (newLevel > currentLevel) {
          get().addCoins(1000); // Level up coin bonus
        }
      },

      addSeasonXP: async (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        try {
          // Call API to add season XP
          const response = await apiRequest('POST', '/api/seasons/add-xp', {
            amount
          });
          
          const data = await response.json();
          
          // Update local user state with new season XP
          get().updateUser({ 
            seasonXp: data.seasonXp 
          });
        } catch (error) {
          console.error('Failed to add season XP:', error);
          // Fallback: update locally
          const newSeasonXP = (currentUser.seasonXp || 0) + amount;
          get().updateUser({ seasonXp: newSeasonXP });
        }
      },

      spendCoins: (amount: number): boolean => {
        const currentUser = get().user;
        if (!currentUser || (currentUser.coins || 0) < amount) {
          return false;
        }
        
        const newCoins = (currentUser.coins || 0) - amount;
        get().updateUser({ coins: newCoins });
        
        // Synchroniser avec useChipsStore pour l'affichage
        try {
          const { setBalance } = require('./chips-store').useChipsStore.getState();
          setBalance(newCoins);
        } catch (error) {
          console.warn('Failed to sync with chips store:', error);
        }
        
        return true;
      },

      spendGems: (amount: number): boolean => {
        const currentUser = get().user;
        if (!currentUser || (currentUser.gems || 0) < amount) {
          return false;
        }
        
        const newGems = (currentUser.gems || 0) - amount;
        get().updateUser({ gems: newGems });
        return true;
      },

      spendTickets: (amount: number): boolean => {
        const currentUser = get().user;
        if (!currentUser || (currentUser.tickets || 0) < amount) {
          return false;
        }
        
        const newTickets = (currentUser.tickets || 0) - amount;
        get().updateUser({ tickets: newTickets });
        return true;
      },

      checkSubscriptionStatus: async () => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        try {
          const response = await apiRequest('GET', '/api/subscription/status');
          const data = await response.json();
          
          if (data) {
            get().updateUser({ 
              membershipType: data.isActive ? 'premium' : 'normal',
              subscriptionExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null
            });
          }
        } catch (error) {
          console.error('Failed to check subscription status:', error);
        }
      },

      isPremium: (): boolean => {
        const currentUser = get().user;
        if (!currentUser) return false;
        
        // Si l'utilisateur a un membershipType premium, on le considère comme premium
        // (l'API server-side vérifiera toujours la validité lors des requêtes critiques)
        return currentUser.membershipType === 'premium';
      },
    }),
    {
      name: 'offsuit-user-store',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
