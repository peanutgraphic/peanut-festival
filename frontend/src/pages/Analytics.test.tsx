import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from './Analytics';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  dashboardApi: {
    getStats: vi.fn().mockResolvedValue({
      shows: {
        total: 25,
        completed: 15,
      },
      tickets: {
        total_tickets: 2500,
        checked_in: 2100,
      },
      performers: {
        pending: 10,
        accepted: 30,
        rejected: 5,
        confirmed: 25,
      },
      volunteers: {
        total_volunteers: 50,
        active_volunteers: 42,
        total_hours: 320,
        total_slots: 100,
        filled_slots: 85,
      },
    }),
  },
  transactionsApi: {
    getSummary: vi.fn().mockResolvedValue({
      total_income: 75000,
      total_expenses: 45000,
      net: 30000,
      by_category: {
        income: {
          sponsorship: 40000,
          ticket_sales: 25000,
          merchandise: 10000,
        },
        expense: {
          venue_rental: 20000,
          performer_fees: 15000,
          marketing: 10000,
        },
      },
    }),
  },
}));

import { dashboardApi, transactionsApi } from '@/api/endpoints';

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

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Analytics');
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Analytics />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Financial Overview', () => {
    it('displays Total Income', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Total Income')).toBeInTheDocument();
      });

      expect(screen.getByText('$75,000')).toBeInTheDocument();
    });

    it('displays Total Expenses', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      });

      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    it('displays Net Balance', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Net Balance')).toBeInTheDocument();
      });

      expect(screen.getByText('$30,000')).toBeInTheDocument();
    });
  });

  describe('Category Breakdown', () => {
    it('displays Income by Category heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Income by Category')).toBeInTheDocument();
      });
    });

    it('displays income categories', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('sponsorship')).toBeInTheDocument();
      });

      expect(screen.getByText('ticket sales')).toBeInTheDocument();
      expect(screen.getByText('merchandise')).toBeInTheDocument();
    });

    it('displays income category amounts', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('$40,000')).toBeInTheDocument();
      });

      expect(screen.getByText('$25,000')).toBeInTheDocument();
      // $10,000 appears in both income (merchandise) and expense (marketing)
      const tenKElements = screen.getAllByText('$10,000');
      expect(tenKElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays Expenses by Category heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
      });
    });

    it('displays expense categories', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('venue rental')).toBeInTheDocument();
      });

      expect(screen.getByText('performer fees')).toBeInTheDocument();
      expect(screen.getByText('marketing')).toBeInTheDocument();
    });

    it('displays expense category amounts', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('$20,000')).toBeInTheDocument();
      });

      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    it('displays Performance Metrics heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });
    });

    it('displays Total Shows', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Total Shows')).toBeInTheDocument();
      });

      // 25 appears for both Total Shows and confirmed performers
      const elements = screen.getAllByText('25');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays Shows Completed', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Shows Completed')).toBeInTheDocument();
      });

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('displays Tickets Sold', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
      });

      expect(screen.getByText('2500')).toBeInTheDocument();
    });

    it('displays Attendees Checked In', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Attendees Checked In')).toBeInTheDocument();
      });

      expect(screen.getByText('2100')).toBeInTheDocument();
    });
  });

  describe('Performer Pipeline', () => {
    it('displays Performer Pipeline heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Performer Pipeline')).toBeInTheDocument();
      });
    });

    it('displays performer statuses', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
      });

      expect(screen.getByText('accepted')).toBeInTheDocument();
      expect(screen.getByText('rejected')).toBeInTheDocument();
      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('displays performer counts', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // pending
      });

      expect(screen.getByText('30')).toBeInTheDocument(); // accepted
      expect(screen.getByText('5')).toBeInTheDocument(); // rejected
    });
  });

  describe('Volunteer Engagement', () => {
    it('displays Volunteer Engagement heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Volunteer Engagement')).toBeInTheDocument();
      });
    });

    it('displays Total Volunteers', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Total Volunteers')).toBeInTheDocument();
      });

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays Active volunteers', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays Hours Logged', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Hours Logged')).toBeInTheDocument();
      });

      expect(screen.getByText('320')).toBeInTheDocument();
    });

    it('displays Shift Fill Rate', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('Shift Fill Rate')).toBeInTheDocument();
      });

      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows empty state for income when no data', async () => {
      vi.mocked(transactionsApi.getSummary).mockResolvedValueOnce({
        total_income: 0,
        total_expenses: 0,
        net: 0,
        by_category: {
          income: {},
          expense: {},
        },
      });

      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('No income recorded yet')).toBeInTheDocument();
      });
    });

    it('shows empty state for expenses when no data', async () => {
      vi.mocked(transactionsApi.getSummary).mockResolvedValueOnce({
        total_income: 0,
        total_expenses: 0,
        net: 0,
        by_category: {
          income: {},
          expense: {},
        },
      });

      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('No expenses recorded yet')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches dashboard stats on mount', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(dashboardApi.getStats).toHaveBeenCalled();
      });
    });

    it('fetches transaction summary on mount', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(transactionsApi.getSummary).toHaveBeenCalled();
      });
    });
  });
});
