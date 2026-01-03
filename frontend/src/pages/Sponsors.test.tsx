import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sponsors } from './Sponsors';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  sponsorsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        company_name: 'Comedy Corp',
        contact_name: 'John CEO',
        tier: 'gold',
        status: 'confirmed',
        sponsorship_amount: 10000,
        in_kind_value: 0,
        contract_signed: true,
        payment_received: true,
        logo_url: null,
        website: 'https://comedycorp.com',
      },
      {
        id: 2,
        company_name: 'Laugh Media',
        contact_name: 'Jane PR',
        tier: 'media',
        status: 'negotiating',
        sponsorship_amount: 0,
        in_kind_value: 5000,
        contract_signed: false,
        payment_received: false,
        logo_url: 'https://example.com/logo.png',
        website: null,
      },
      {
        id: 3,
        company_name: 'Silver Stars',
        contact_name: 'Bob Manager',
        tier: 'silver',
        status: 'prospect',
        sponsorship_amount: 5000,
        in_kind_value: 1000,
        contract_signed: false,
        payment_received: false,
        logo_url: null,
        website: 'https://silverstars.com',
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 4, company_name: 'New Sponsor' }),
    update: vi.fn().mockResolvedValue({ id: 1, company_name: 'Updated Sponsor' }),
    delete: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock the filter store
vi.mock('@/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    sponsorFilters: {},
    setSponsorFilters: vi.fn(),
  }),
}));

import { sponsorsApi } from '@/api/endpoints';

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

describe('Sponsors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sponsors');
      });
    });

    it('renders Add Sponsor button', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add sponsor/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Sponsors />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('summary stats', () => {
    it('displays total sponsorship amount', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Total Sponsorship')).toBeInTheDocument();
      });

      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });

    it('displays in-kind value total', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('In-Kind Value')).toBeInTheDocument();
      });

      expect(screen.getByText('$6,000')).toBeInTheDocument();
    });

    it('displays confirmed sponsors count', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Confirmed Sponsors')).toBeInTheDocument();
      });

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('filters', () => {
    it('renders tier filter dropdown', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Tiers' })).toBeInTheDocument();
      });
    });

    it('renders all tier options', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Presenting' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Gold' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Silver' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Bronze' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'In-Kind' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Media' })).toBeInTheDocument();
    });

    it('renders status filter options', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Prospect' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Negotiating' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Confirmed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Declined' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Past' })).toBeInTheDocument();
    });
  });

  describe('sponsors by tier', () => {
    it('renders sponsor cards', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Laugh Media')).toBeInTheDocument();
      expect(screen.getByText('Silver Stars')).toBeInTheDocument();
    });

    it('displays tier headers', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        // Tier labels appear in both filters and headers, check they exist
        const goldElements = screen.getAllByText('Gold');
        expect(goldElements.length).toBeGreaterThanOrEqual(1);
      });

      const silverElements = screen.getAllByText('Silver');
      expect(silverElements.length).toBeGreaterThanOrEqual(1);

      const mediaElements = screen.getAllByText('Media');
      expect(mediaElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays contact names', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('John CEO')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane PR')).toBeInTheDocument();
    });

    it('displays status badges', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('confirmed')).toBeInTheDocument();
      });

      expect(screen.getByText('negotiating')).toBeInTheDocument();
      expect(screen.getByText('prospect')).toBeInTheDocument();
    });

    it('displays sponsorship amounts', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('$10,000')).toBeInTheDocument();
      });

      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('displays in-kind values', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('$5,000 in-kind')).toBeInTheDocument();
      });

      expect(screen.getByText('$1,000 in-kind')).toBeInTheDocument();
    });

    it('displays contract signed badge', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Contract')).toBeInTheDocument();
      });
    });

    it('displays payment received badge', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });

    it('displays company initial when no logo', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('C')).toBeInTheDocument(); // Comedy Corp initial
      });
    });

    it('shows empty state when no sponsors', async () => {
      vi.mocked(sponsorsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(
          screen.getByText('No sponsors found. Add your first sponsor to get started.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('sponsor card actions', () => {
    it('renders Edit button for each sponsor', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        expect(editButtons.length).toBe(3);
      });
    });

    it('renders Website link when sponsor has website', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        const websiteLinks = screen.getAllByRole('link', { name: /website/i });
        expect(websiteLinks.length).toBe(2); // Comedy Corp and Silver Stars have websites
      });
    });
  });

  describe('add sponsor modal', () => {
    it('opens modal when clicking Add Sponsor', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add sponsor/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add sponsor/i }));

      await waitFor(() => {
        expect(screen.getByText('New Sponsor')).toBeInTheDocument();
      });
    });
  });

  describe('edit sponsor modal', () => {
    it('opens modal with sponsor data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(screen.getByText('Comedy Corp')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Sponsor')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches sponsors on mount', async () => {
      renderWithProviders(<Sponsors />);

      await waitFor(() => {
        expect(sponsorsApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
