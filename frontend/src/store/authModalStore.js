import { create } from 'zustand';

export const useAuthModalStore = create((set, get) => ({
  isOpen:    false,
  message:   '',
  onSuccess: null,

  open: (message = 'Sign in to continue', onSuccess = null) =>
    set({ isOpen: true, message, onSuccess }),

  close: () => set({ isOpen: false, message: '', onSuccess: null }),

  complete: (user) => {
    const { onSuccess } = get();
    onSuccess?.(user);
    set({ isOpen: false, message: '', onSuccess: null });
  },
}));
