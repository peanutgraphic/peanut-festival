import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Festivals } from './Festivals';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Comedy Festival 2024',
        slug: 'comedy-festival-2024',
        start_date: '2024-06-15',
        end_date: '2024-06-22',
        location: 'Downtown Theater District',
        status: 'active',
      },
      {
        id: 2,
        name: 'Laugh Fest 2024',
        slug: 'laugh-fest-2024',
        start_date: '2024-08-01',
        end_date: '2024-08-07',
        location: 'Central Park',
        status: 'planning',
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 3, name: 'New Festival' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Festival' }),
    delete: vi.fn().mockResolvedValue({ success: true }),
  },
}));

import { festivalsApi } from '@/api/endpoints';

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

describe('Festivals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Festivals');
      });
    });

    it('renders Add Festival button', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add festival/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Festivals />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('festivals table', () => {
    it('renders table headers', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });

      expect(screen.getByText('Dates')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders festival names', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Festival 2024')).toBeInTheDocument();
      });

      expect(screen.getByText('Laugh Fest 2024')).toBeInTheDocument();
    });

    it('renders festival slugs', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('comedy-festival-2024')).toBeInTheDocument();
      });

      expect(screen.getByText('laugh-fest-2024')).toBeInTheDocument();
    });

    it('renders festival locations', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Theater District')).toBeInTheDocument();
      });

      expect(screen.getByText('Central Park')).toBeInTheDocument();
    });

    it('renders status badges', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });

      expect(screen.getByText('planning')).toBeInTheDocument();
    });

    it('shows empty state when no festivals', async () => {
      vi.mocked(festivalsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('No festivals yet. Create your first festival to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('renders Edit button for each festival', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle('Edit');
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Duplicate button for each festival', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        const duplicateButtons = screen.getAllByTitle('Duplicate');
        expect(duplicateButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each festival', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete');
        expect(deleteButtons.length).toBe(2);
      });
    });
  });

  describe('add festival modal', () => {
    it('opens modal when clicking Add Festival', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add festival/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add festival/i }));

      await waitFor(() => {
        expect(screen.getByText('New Festival')).toBeInTheDocument();
      });
    });
  });

  describe('edit festival modal', () => {
    it('opens modal with festival data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Festival 2024')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Festival')).toBeInTheDocument();
      });
    });
  });

  describe('duplicate festival', () => {
    it('calls duplicate API when clicking Duplicate', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Festival 2024')).toBeInTheDocument();
      });

      const duplicateButtons = screen.getAllByTitle('Duplicate');
      await user.click(duplicateButtons[0]);

      await waitFor(() => {
        expect(festivalsApi.create).toHaveBeenCalled();
      });
    });
  });

  describe('delete festival', () => {
    it('opens delete confirmation when clicking Delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Festival 2024')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Comedy Festival 2024"/)).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches festivals on mount', async () => {
      renderWithProviders(<Festivals />);

      await waitFor(() => {
        expect(festivalsApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
