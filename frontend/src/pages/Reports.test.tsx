import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Reports } from './Reports';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  reportsApi: {
    getTicketSales: vi.fn().mockResolvedValue({
      by_show: [
        { show_id: 1, title: 'Opening Night', total_quantity: 200, total_revenue: 5000, checked_in: 180 },
        { show_id: 2, title: 'Comedy Special', total_quantity: 150, total_revenue: 3750, checked_in: 140 },
      ],
      by_date: [
        { date: '2024-06-01', count: 150, revenue: 3750 },
        { date: '2024-06-02', count: 200, revenue: 5000 },
      ],
    }),
    getRevenue: vi.fn().mockResolvedValue({
      by_date: [
        { date: '2024-06-01', income: 5000, expense: 2000 },
        { date: '2024-06-02', income: 7500, expense: 3000 },
      ],
      total_income: 12500,
      total_expenses: 5000,
      net: 7500,
    }),
    getActivity: vi.fn().mockResolvedValue({
      activities: [
        { id: 1, type: 'ticket_sold', description: 'Ticket sold for Opening Night', created_at: '2024-06-01T10:00:00' },
        { id: 2, type: 'performer_added', description: 'John Comedian added', created_at: '2024-06-01T11:00:00' },
      ],
    }),
    exportData: vi.fn().mockResolvedValue({
      content: 'csv data',
      mime_type: 'text/csv',
      filename: 'export.csv',
    }),
  },
}));

import { reportsApi } from '@/api/endpoints';

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

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Reports');
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Reports />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('summary cards', () => {
    it('displays Tickets Sold label', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
      });
    });

    it('displays total tickets count', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('350')).toBeInTheDocument(); // 200 + 150
      });
    });

    it('displays Ticket Revenue label', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Ticket Revenue')).toBeInTheDocument();
      });
    });

    it('displays total revenue', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('$8,750')).toBeInTheDocument(); // 5000 + 3750
      });
    });

    it('displays Checked In label', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        const checkedInLabels = screen.getAllByText('Checked In');
        expect(checkedInLabels.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays Check-in Rate label', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Check-in Rate')).toBeInTheDocument();
      });
    });
  });

  describe('export functionality', () => {
    it('renders export buttons for each data type', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /performers/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /volunteers/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /attendees/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tickets/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /transactions/i })).toBeInTheDocument();
    });
  });

  describe('API integration', () => {
    it('fetches ticket sales on mount', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(reportsApi.getTicketSales).toHaveBeenCalled();
      });
    });

    it('fetches revenue on mount', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(reportsApi.getRevenue).toHaveBeenCalled();
      });
    });

    it('fetches activity on mount', async () => {
      renderWithProviders(<Reports />);

      await waitFor(() => {
        expect(reportsApi.getActivity).toHaveBeenCalled();
      });
    });
  });
});
