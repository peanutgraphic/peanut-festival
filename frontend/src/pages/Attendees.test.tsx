import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Attendees } from './Attendees';
import { ToastProvider } from '@/components/common/Toast';

// Mock the client
vi.mock('../api/client', () => ({
  client: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/attendees') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                name: 'John Viewer',
                email: 'john@viewer.com',
                tickets: [
                  {
                    id: 1,
                    show_id: 1,
                    show_title: 'Opening Night',
                    quantity: 2,
                    checked_in: false,
                    check_in_time: null,
                  },
                ],
              },
              {
                id: 2,
                name: 'Jane Audience',
                email: 'jane@audience.com',
                tickets: [
                  {
                    id: 2,
                    show_id: 2,
                    show_title: 'Comedy Special',
                    quantity: 1,
                    checked_in: true,
                    check_in_time: '2024-06-15T19:30:00',
                  },
                ],
              },
            ],
          },
        });
      }
      if (url === '/coupons') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                code: 'SUMMER2024',
                discount_type: 'percentage',
                discount_value: 20,
                uses: 45,
                max_uses: 100,
                active: true,
                expires_at: '2024-12-31',
              },
              {
                id: 2,
                code: 'FRIENDS10',
                discount_type: 'fixed',
                discount_value: 10,
                uses: 20,
                max_uses: 50,
                active: false,
                expires_at: null,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

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

describe('Attendees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Attendees & Tickets');
      });
    });

    it('shows loading state initially', () => {
      renderWithProviders(<Attendees />);

      // The component shows "Loading attendees..." text instead of skeleton
      expect(screen.getByText('Loading attendees...')).toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders Attendees tab', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /attendees/i })).toBeInTheDocument();
      });
    });

    it('renders Coupons tab', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /coupons/i })).toBeInTheDocument();
      });
    });

    it('shows attendees count in tab', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
      });
    });

    it('switches to Coupons tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /coupons/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /coupons/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add coupon/i })).toBeInTheDocument();
      });
    });
  });

  describe('attendees list', () => {
    it('renders search input', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search attendees...')).toBeInTheDocument();
      });
    });

    it('renders attendee names', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByText('John Viewer')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Audience')).toBeInTheDocument();
    });

    it('renders attendee emails', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByText('john@viewer.com')).toBeInTheDocument();
      });

      expect(screen.getByText('jane@audience.com')).toBeInTheDocument();
    });

    it('renders View Tickets button for each attendee', async () => {
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view tickets/i });
        expect(viewButtons.length).toBe(2);
      });
    });
  });

  describe('search functionality', () => {
    it('filters attendees by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByText('John Viewer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search attendees...');
      await user.type(searchInput, 'John');

      expect(screen.getByText('John Viewer')).toBeInTheDocument();
      expect(screen.queryByText('Jane Audience')).not.toBeInTheDocument();
    });

    it('filters attendees by email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByText('John Viewer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search attendees...');
      await user.type(searchInput, 'audience');

      expect(screen.queryByText('John Viewer')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Audience')).toBeInTheDocument();
    });
  });

  describe('coupons tab', () => {
    it('shows Add Coupon button when on coupons tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /coupons/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /coupons/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add coupon/i })).toBeInTheDocument();
      });
    });

    it('displays coupon codes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Attendees />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /coupons/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /coupons/i }));

      await waitFor(() => {
        expect(screen.getByText('SUMMER2024')).toBeInTheDocument();
      });

      expect(screen.getByText('FRIENDS10')).toBeInTheDocument();
    });
  });
});
