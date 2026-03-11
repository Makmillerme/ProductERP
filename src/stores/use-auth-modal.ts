import { create } from "zustand";

type AuthModalState = {
  open: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  toggleAuthModal: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  openAuthModal: () => set({ open: true }),
  closeAuthModal: () => set({ open: false }),
  toggleAuthModal: () => set((s) => ({ open: !s.open })),
}));
