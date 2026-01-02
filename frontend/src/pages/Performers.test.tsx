import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Performers } from './Performers';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  performersApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'John Comedian',
        email: 'john@comedy.com',
        performance_type: 'Stand-up',
        application_status: 'pending',
        application_date: '2024-05-01',
        photo_url: null,
        notification_sent: false,
      },
      {
        id: 2,
        name: 'Jane Improv',
        email: 'jane@improv.com',
        performance_type: 'Improv',
        application_status: 'accepted',
        application_date: '2024-04-15',
        photo_url: 'https://example.com/photo.jpg',
        notification_sent: false,
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 3, name: 'New Performer' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Performer' }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    review: vi.fn().mockResolvedValue({ success: true }),
    notify: vi.fn().mockResolvedValue({ success: true }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the filter store
vi.mock('@/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    performerFilters: {},
    setPerformerFilters: vi.fn(),
  }),
}));

import { performersApi } from '@/api/endpoints';

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

describe('Performers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Performers');
      });
    });

    it('renders Add Performer button', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add performer/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Performers />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('renders search input', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search performers...')).toBeInTheDocument();
      });
    });

    it('renders status filter dropdown', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('renders all status options', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Under Review' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Accepted' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Rejected' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Waitlisted' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Confirmed' })).toBeInTheDocument();
    });
  });

  describe('performers table', () => {
    it('renders table headers', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('Performer')).toBeInTheDocument();
      });

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders performer names', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('John Comedian')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Improv')).toBeInTheDocument();
    });

    it('renders performer emails', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('john@comedy.com')).toBeInTheDocument();
      });

      expect(screen.getByText('jane@improv.com')).toBeInTheDocument();
    });

    it('renders performance types', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('Stand-up')).toBeInTheDocument();
      });

      expect(screen.getByText('Improv')).toBeInTheDocument();
    });

    it('renders status badges', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
      });

      expect(screen.getByText('accepted')).toBeInTheDocument();
    });

    it('renders avatar with initials for performers without photo', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });

    it('shows empty state when no performers', async () => {
      vi.mocked(performersApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('No performers found.')).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('filters performers by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('John Comedian')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search performers...');
      await user.type(searchInput, 'John');

      expect(screen.getByText('John Comedian')).toBeInTheDocument();
      expect(screen.queryByText('Jane Improv')).not.toBeInTheDocument();
    });

    it('filters performers by email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('John Comedian')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search performers...');
      await user.type(searchInput, 'improv.com');

      expect(screen.queryByText('John Comedian')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Improv')).toBeInTheDocument();
    });
  });

  describe('review actions', () => {
    it('shows Accept button for pending performers', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Accept')).toBeInTheDocument();
      });
    });

    it('shows Reject button for pending performers', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Reject')).toBeInTheDocument();
      });
    });

    it('shows Under Review button for pending performers', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Mark as Under Review')).toBeInTheDocument();
      });
    });

    it('calls review API when clicking Accept', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Accept')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Accept'));

      await waitFor(() => {
        expect(performersApi.review).toHaveBeenCalled();
        const calls = vi.mocked(performersApi.review).mock.calls[0];
        expect(calls[0]).toBe(1);
        expect(calls[1]).toBe('accepted');
      });
    });
  });

  describe('notification', () => {
    it('shows notification button for accepted performers', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Send Notification')).toBeInTheDocument();
      });
    });

    it('calls notify API when clicking notification button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByTitle('Send Notification')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Send Notification'));

      await waitFor(() => {
        expect(performersApi.notify).toHaveBeenCalled();
        expect(vi.mocked(performersApi.notify).mock.calls[0][0]).toBe(2);
      });
    });
  });

  describe('edit and delete', () => {
    it('renders Edit button for each performer', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle('Edit');
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each performer', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete');
        expect(deleteButtons.length).toBe(2);
      });
    });

    it('opens delete confirmation when clicking Delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByText('John Comedian')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "John Comedian"/)).toBeInTheDocument();
      });
    });
  });

  describe('add performer modal', () => {
    it('opens modal when clicking Add Performer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add performer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add performer/i }));

      await waitFor(() => {
        expect(screen.getByText('New Performer')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches performers on mount', async () => {
      renderWithProviders(<Performers />);

      await waitFor(() => {
        expect(performersApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
