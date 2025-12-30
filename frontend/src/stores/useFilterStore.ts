import { create } from 'zustand';
import type { PerformerFilters, ShowFilters, VolunteerFilters, VendorFilters, SponsorFilters } from '@/types';

interface FilterState {
  performerFilters: PerformerFilters;
  setPerformerFilters: (filters: Partial<PerformerFilters>) => void;
  resetPerformerFilters: () => void;

  showFilters: ShowFilters;
  setShowFilters: (filters: Partial<ShowFilters>) => void;
  resetShowFilters: () => void;

  volunteerFilters: VolunteerFilters;
  setVolunteerFilters: (filters: Partial<VolunteerFilters>) => void;
  resetVolunteerFilters: () => void;

  vendorFilters: VendorFilters;
  setVendorFilters: (filters: Partial<VendorFilters>) => void;
  resetVendorFilters: () => void;

  sponsorFilters: SponsorFilters;
  setSponsorFilters: (filters: Partial<SponsorFilters>) => void;
  resetSponsorFilters: () => void;
}

const defaultPerformerFilters: PerformerFilters = {};
const defaultShowFilters: ShowFilters = {};
const defaultVolunteerFilters: VolunteerFilters = {};
const defaultVendorFilters: VendorFilters = {};
const defaultSponsorFilters: SponsorFilters = {};

export const useFilterStore = create<FilterState>((set) => ({
  performerFilters: defaultPerformerFilters,
  setPerformerFilters: (filters) =>
    set((state) => ({ performerFilters: { ...state.performerFilters, ...filters } })),
  resetPerformerFilters: () => set({ performerFilters: defaultPerformerFilters }),

  showFilters: defaultShowFilters,
  setShowFilters: (filters) =>
    set((state) => ({ showFilters: { ...state.showFilters, ...filters } })),
  resetShowFilters: () => set({ showFilters: defaultShowFilters }),

  volunteerFilters: defaultVolunteerFilters,
  setVolunteerFilters: (filters) =>
    set((state) => ({ volunteerFilters: { ...state.volunteerFilters, ...filters } })),
  resetVolunteerFilters: () => set({ volunteerFilters: defaultVolunteerFilters }),

  vendorFilters: defaultVendorFilters,
  setVendorFilters: (filters) =>
    set((state) => ({ vendorFilters: { ...state.vendorFilters, ...filters } })),
  resetVendorFilters: () => set({ vendorFilters: defaultVendorFilters }),

  sponsorFilters: defaultSponsorFilters,
  setSponsorFilters: (filters) =>
    set((state) => ({ sponsorFilters: { ...state.sponsorFilters, ...filters } })),
  resetSponsorFilters: () => set({ sponsorFilters: defaultSponsorFilters }),
}));
