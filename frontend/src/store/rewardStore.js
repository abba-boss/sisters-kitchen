import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRewardStore = create(
  persist(
    (set, get) => ({
      balance:         0,
      showDailyModal:  false,
      setBalance:      (b) => set({ balance: b }),
      addBalance:      (n) => set({ balance: get().balance + n }),
      removeBalance:   (n) => set({ balance: Math.max(0, get().balance - n) }),
      setShowDailyModal: (v) => set({ showDailyModal: v }),
    }),
    { name: 'sk-rewards', partialize: (s) => ({ balance: s.balance }) }
  )
);
