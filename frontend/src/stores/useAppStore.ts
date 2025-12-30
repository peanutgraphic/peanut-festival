import { create } from 'zustand';
import type { Festival } from '@/types';

interface AppState {
  // Active festival
  activeFestival: Festival | null;
  setActiveFestival: (festival: Festival | null) => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Modal state
  modalOpen: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeFestival: null,
  setActiveFestival: (festival) => set({ activeFestival: festival }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  modalOpen: null,
  openModal: (modalId) => set({ modalOpen: modalId }),
  closeModal: () => set({ modalOpen: null }),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
