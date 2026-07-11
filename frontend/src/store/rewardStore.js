import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRewardStore = create(
  persist(
    (set, get) => ({
      balance: 0,
      showDailyModal: false,
      lastFetched: null,

      setBalance: (balance) => set({ balance, lastFetched: Date.now() }),
      incrementBalance: (amount) => set({ balance: get().balance + amount }),
      decrementBalance: (amount) => set({ balance: Math.max(0, get().balance - amount) }),
      setShowDailyModal: (v) => set({ showDailyModal: v }),
    }),
    {
      name: 'sk-rewards',
      partialize: (s) => ({ balance: s.balance, lastFetched: s.lastFetched }),
    }
  )
);
