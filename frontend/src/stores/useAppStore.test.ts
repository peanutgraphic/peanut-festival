import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import { act } from '@testing-library/react';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useAppStore.setState({
        activeFestival: null,
        sidebarCollapsed: false,
        modalOpen: null,
        globalLoading: false,
      });
    });
  });

  describe('activeFestival', () => {
    it('starts with null festival', () => {
      expect(useAppStore.getState().activeFestival).toBeNull();
    });

    it('sets active festival', () => {
      const festival = { id: 1, name: 'Test Festival' };
      act(() => {
        useAppStore.getState().setActiveFestival(festival as any);
      });
      expect(useAppStore.getState().activeFestival).toEqual(festival);
    });

    it('clears active festival', () => {
      const festival = { id: 1, name: 'Test Festival' };
      act(() => {
        useAppStore.getState().setActiveFestival(festival as any);
        useAppStore.getState().setActiveFestival(null);
      });
      expect(useAppStore.getState().activeFestival).toBeNull();
    });
  });

  describe('sidebarCollapsed', () => {
    it('starts with sidebar expanded', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });

    it('toggles sidebar to collapsed', () => {
      act(() => {
        useAppStore.getState().toggleSidebar();
      });
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
    });

    it('toggles sidebar back to expanded', () => {
      act(() => {
        useAppStore.getState().toggleSidebar();
        useAppStore.getState().toggleSidebar();
      });
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('modal', () => {
    it('starts with no modal open', () => {
      expect(useAppStore.getState().modalOpen).toBeNull();
    });

    it('opens modal with id', () => {
      act(() => {
        useAppStore.getState().openModal('settings');
      });
      expect(useAppStore.getState().modalOpen).toBe('settings');
    });

    it('closes modal', () => {
      act(() => {
        useAppStore.getState().openModal('settings');
        useAppStore.getState().closeModal();
      });
      expect(useAppStore.getState().modalOpen).toBeNull();
    });

    it('opens different modal', () => {
      act(() => {
        useAppStore.getState().openModal('settings');
        useAppStore.getState().openModal('profile');
      });
      expect(useAppStore.getState().modalOpen).toBe('profile');
    });
  });

  describe('globalLoading', () => {
    it('starts with loading false', () => {
      expect(useAppStore.getState().globalLoading).toBe(false);
    });

    it('sets loading to true', () => {
      act(() => {
        useAppStore.getState().setGlobalLoading(true);
      });
      expect(useAppStore.getState().globalLoading).toBe(true);
    });

    it('sets loading to false', () => {
      act(() => {
        useAppStore.getState().setGlobalLoading(true);
        useAppStore.getState().setGlobalLoading(false);
      });
      expect(useAppStore.getState().globalLoading).toBe(false);
    });
  });
});
