import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Vendors } from './Vendors';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  vendorsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        business_name: 'Tasty Treats',
        contact_name: 'John Smith',
        vendor_type: 'food',
        status: 'active',
        booth_fee: 250,
        fee_paid: true,
        insurance_verified: true,
        license_verified: true,
        electricity_needed: true,
        description: 'Delicious festival food',
      },
      {
        id: 2,
        business_name: 'Comedy Merch',
        contact_name: 'Jane Doe',
        vendor_type: 'merchandise',
        status: 'applied',
        booth_fee: 150,
        fee_paid: false,
        insurance_verified: false,
        license_verified: true,
        electricity_needed: false,
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 3, business_name: 'New Vendor' }),
    update: vi.fn().mockResolvedValue({ id: 1, business_name: 'Updated Vendor' }),
    delete: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock the filter store
vi.mock('@/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    vendorFilters: {},
    setVendorFilters: vi.fn(),
  }),
}));

import { vendorsApi } from '@/api/endpoints';

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

describe('Vendors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vendors');
      });
    });

    it('renders Add Vendor button', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Vendors />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('renders search input', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument();
      });
    });

    it('renders type filter dropdown', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
      });
    });

    it('renders all type options', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Merchandise' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Service' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sponsor' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
    });

    it('renders status filter options', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Approved' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Declined' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });
  });

  describe('vendors grid', () => {
    it('renders vendor cards', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Tasty Treats')).toBeInTheDocument();
      });

      expect(screen.getByText('Comedy Merch')).toBeInTheDocument();
    });

    it('displays vendor types', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        // Type appears in both filter dropdown and vendor card
        const foodElements = screen.getAllByText('Food');
        expect(foodElements.length).toBeGreaterThanOrEqual(1);
      });

      const merchElements = screen.getAllByText('Merchandise');
      expect(merchElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays contact names', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Contact: John Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('Contact: Jane Doe')).toBeInTheDocument();
    });

    it('displays status badges', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });

      expect(screen.getByText('applied')).toBeInTheDocument();
    });

    it('displays booth fees', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('$250')).toBeInTheDocument();
      });

      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('displays verification badges', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Insurance ✓')).toBeInTheDocument();
      });

      const licenseBadges = screen.getAllByText('License ✓');
      expect(licenseBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('displays electricity badge when needed', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Needs Power')).toBeInTheDocument();
      });
    });

    it('shows empty state when no vendors', async () => {
      vi.mocked(vendorsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('No vendors found.')).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('filters vendors by business name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Tasty Treats')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search vendors...');
      await user.type(searchInput, 'Tasty');

      expect(screen.getByText('Tasty Treats')).toBeInTheDocument();
      expect(screen.queryByText('Comedy Merch')).not.toBeInTheDocument();
    });

    it('filters vendors by contact name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Tasty Treats')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search vendors...');
      await user.type(searchInput, 'Jane');

      expect(screen.queryByText('Tasty Treats')).not.toBeInTheDocument();
      expect(screen.getByText('Comedy Merch')).toBeInTheDocument();
    });
  });

  describe('vendor card actions', () => {
    it('renders Edit button for each vendor', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each vendor', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(deleteButtons.length).toBe(2);
      });
    });
  });

  describe('add vendor modal', () => {
    it('opens modal when clicking Add Vendor', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add vendor/i }));

      await waitFor(() => {
        expect(screen.getByText('New Vendor')).toBeInTheDocument();
      });
    });
  });

  describe('edit vendor modal', () => {
    it('opens modal with vendor data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(screen.getByText('Tasty Treats')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Vendor')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches vendors on mount', async () => {
      renderWithProviders(<Vendors />);

      await waitFor(() => {
        expect(vendorsApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
