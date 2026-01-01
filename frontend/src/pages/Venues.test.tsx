import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Venues } from './Venues';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  venuesApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Main Stage Theater',
        slug: 'main-stage-theater',
        venue_type: 'theater',
        status: 'active',
        address: '123 Main Street',
        city: 'Comedy City',
        state: 'CA',
        capacity: 300,
        rental_cost: 500,
        rating_internal: 4,
      },
      {
        id: 2,
        name: 'Underground Club',
        slug: 'underground-club',
        venue_type: 'bar',
        status: 'active',
        address: '456 Side Street',
        city: 'Laugh Town',
        state: 'NY',
        capacity: 100,
        rental_cost: 200,
        rating_internal: 3,
      },
    ]),
    delete: vi.fn().mockResolvedValue({ success: true }),
    create: vi.fn().mockResolvedValue({ id: 3, name: 'New Venue' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Venue' }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

import { venuesApi } from '@/api/endpoints';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('Venues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Venues');
      });
    });

    it('renders Add Venue button', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add venue/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Venues />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('renders status filter dropdown', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('renders all status options', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    });

    it('renders type filter options', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Theater' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Bar' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Gallery' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Outdoor' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Restaurant' })).toBeInTheDocument();
    });
  });

  describe('venues list', () => {
    it('renders venue cards', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('Main Stage Theater')).toBeInTheDocument();
      });

      expect(screen.getByText('Underground Club')).toBeInTheDocument();
    });

    it('displays venue types', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        // "Theater" and "Bar" appear in both filter dropdown and venue cards
        const theaterElements = screen.getAllByText('Theater');
        expect(theaterElements.length).toBeGreaterThanOrEqual(1);
      });

      const barElements = screen.getAllByText('Bar');
      expect(barElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays addresses', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();
      });
    });

    it('displays capacity', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('Capacity: 300')).toBeInTheDocument();
      });
    });

    it('displays rental cost', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('$500 rental')).toBeInTheDocument();
      });
    });

    it('displays status badges', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        const activeBadges = screen.getAllByText('active');
        expect(activeBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('displays rating stars', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        // Rating stars are rendered as ★ characters
        const stars = screen.getAllByText('★');
        expect(stars.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state when no venues', async () => {
      vi.mocked(venuesApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('No venues found. Add your first venue to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('venue card actions', () => {
    it('renders Edit button for each venue', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each venue', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(deleteButtons.length).toBe(2);
      });
    });
  });

  describe('add venue modal', () => {
    it('opens modal when clicking Add Venue', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add venue/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add venue/i }));

      await waitFor(() => {
        expect(screen.getByText('New Venue')).toBeInTheDocument();
      });
    });
  });

  describe('edit venue modal', () => {
    it('opens modal with venue data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('Main Stage Theater')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Venue')).toBeInTheDocument();
      });
    });
  });

  describe('delete venue', () => {
    it('opens delete confirmation when clicking Delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(screen.getByText('Main Stage Theater')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Main Stage Theater"/)).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches venues on mount', async () => {
      renderWithProviders(<Venues />);

      await waitFor(() => {
        expect(venuesApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
