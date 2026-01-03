import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shows } from './Shows';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  showsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Opening Night Showcase',
        slug: 'opening-night-showcase',
        show_date: '2024-06-15',
        start_time: '19:00',
        venue_name: 'Main Stage Theater',
        capacity: 200,
        ticket_price: 25.0,
        status: 'on_sale',
        featured: true,
      },
      {
        id: 2,
        title: 'Comedy Night Special',
        slug: 'comedy-night-special',
        show_date: '2024-06-16',
        start_time: '20:00',
        venue_name: 'Underground Club',
        capacity: 100,
        ticket_price: 15.0,
        status: 'scheduled',
        featured: false,
      },
    ]),
    delete: vi.fn().mockResolvedValue({ success: true }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  venuesApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the filter store
vi.mock('@/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    showFilters: {},
    setShowFilters: vi.fn(),
  }),
}));

import { showsApi } from '@/api/endpoints';

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

describe('Shows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Shows');
      });
    });

    it('renders Add Show button', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add show/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Shows />);

      // Check for animate-pulse skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('renders status filter dropdown', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('renders all status options', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Scheduled' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'On Sale' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sold Out' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });
  });

  describe('shows list', () => {
    it('renders show cards', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Opening Night Showcase')).toBeInTheDocument();
      });

      expect(screen.getByText('Comedy Night Special')).toBeInTheDocument();
    });

    it('displays show dates', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText(/at 19:00/)).toBeInTheDocument();
      });
    });

    it('displays venue names', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Main Stage Theater')).toBeInTheDocument();
      });

      expect(screen.getByText('Underground Club')).toBeInTheDocument();
    });

    it('displays capacity', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Capacity: 200')).toBeInTheDocument();
      });
    });

    it('displays ticket prices', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('$25.00')).toBeInTheDocument();
      });
    });

    it('displays status badges', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('on_sale')).toBeInTheDocument();
      });

      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });

    it('shows empty state when no shows', async () => {
      vi.mocked(showsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('No shows found. Create your first show to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('show card actions', () => {
    it('renders Edit button for each show', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each show', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(deleteButtons.length).toBe(2);
      });
    });
  });

  describe('add show modal', () => {
    it('opens modal when clicking Add Show', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add show/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add show/i }));

      await waitFor(() => {
        expect(screen.getByText('New Show')).toBeInTheDocument();
      });
    });
  });

  describe('edit show modal', () => {
    it('opens modal with show data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Opening Night Showcase')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Show')).toBeInTheDocument();
      });
    });
  });

  describe('delete show', () => {
    it('opens delete confirmation when clicking Delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Opening Night Showcase')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        // Look for the confirmation message text
        expect(screen.getByText(/Are you sure you want to delete "Opening Night Showcase"/)).toBeInTheDocument();
      });
    });

    it('renders confirm button in delete dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(screen.getByText('Opening Night Showcase')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      // Verify confirm button is present
      expect(screen.getByRole('button', { name: /delete show/i })).toBeInTheDocument();
    });
  });

  describe('API integration', () => {
    it('fetches shows on mount', async () => {
      renderWithProviders(<Shows />);

      await waitFor(() => {
        expect(showsApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
