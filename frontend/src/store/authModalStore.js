import { create } from 'zustand';
export const useAuthModalStore = create((set, get) => ({
  isOpen: false, message: '', onSuccess: null,
  open:     (msg = 'Sign in to continue', onSuccess = null) => set({ isOpen: true, message: msg, onSuccess }),
  close:    () => set({ isOpen: false, message: '', onSuccess: null }),
  complete: (user) => { get().onSuccess?.(user); set({ isOpen: false, message: '', onSuccess: null }); },
}));
