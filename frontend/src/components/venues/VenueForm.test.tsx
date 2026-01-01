import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VenueForm } from './VenueForm';
import { ToastProvider } from '@/components/common/Toast';
import type { Venue } from '@/types';

// Mock the API endpoints
vi.mock('@/api/endpoints', () => ({
  venuesApi: {
    create: vi.fn().mockResolvedValue({ id: 1, name: 'New Venue' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Venue' }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Comedy Festival 2024' },
      { id: 2, name: 'Laugh Fest 2024' },
    ]),
  },
}));

import { venuesApi, festivalsApi } from '@/api/endpoints';

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

const mockVenue: Venue = {
  id: 1,
  festival_id: 1,
  name: 'Main Stage Theater',
  slug: 'main-stage-theater',
  address: '123 Main St',
  city: 'Chicago',
  state: 'IL',
  zip: '60601',
  capacity: 200,
  venue_type: 'theater',
  contact_name: 'John Doe',
  contact_email: 'john@theater.com',
  contact_phone: '555-123-4567',
  rental_cost: 500,
  revenue_share: 20,
  tech_specs: 'Full PA system, stage lighting',
  pros: 'Great acoustics',
  cons: 'Limited parking',
  rating_internal: 4,
  status: 'active',
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
};

describe('VenueForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with correct title for new venue', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Venue')).toBeInTheDocument();
      });
    });

    it('renders modal with correct title for editing', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Venue')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<VenueForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Venue')).not.toBeInTheDocument();
    });

    it('renders all form sections', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Financials')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('renders basic information fields', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('main-stage-theater')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('200')).toBeInTheDocument();
    });

    it('renders location fields', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('123 Main St')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('Chicago')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('IL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('60601')).toBeInTheDocument();
    });

    it('renders contact fields', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('venue@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('555-123-4567')).toBeInTheDocument();
    });

    it('renders financial fields', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('500.00')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('20')).toBeInTheDocument();
    });

    it('renders footer buttons', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Create Venue' })).toBeInTheDocument();
    });

    it('shows Update button when editing', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update Venue' })).toBeInTheDocument();
      });
    });
  });

  describe('venue type options', () => {
    it('renders all venue type options', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Theater' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Bar/Club' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Gallery' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Outdoor' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Restaurant' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('populates form with venue data', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toHaveValue('Main Stage Theater');
      });

      expect(screen.getByPlaceholderText('main-stage-theater')).toHaveValue('main-stage-theater');
      expect(screen.getByPlaceholderText('200')).toHaveValue(200);
    });

    it('populates location fields', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('123 Main St')).toHaveValue('123 Main St');
      });

      expect(screen.getByPlaceholderText('Chicago')).toHaveValue('Chicago');
      expect(screen.getByPlaceholderText('IL')).toHaveValue('IL');
      expect(screen.getByPlaceholderText('60601')).toHaveValue('60601');
    });

    it('populates contact fields', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('John Doe')).toHaveValue('John Doe');
      });

      expect(screen.getByPlaceholderText('venue@example.com')).toHaveValue('john@theater.com');
      expect(screen.getByPlaceholderText('555-123-4567')).toHaveValue('555-123-4567');
    });

    it('populates financial fields', async () => {
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('500.00')).toHaveValue(500);
      });

      expect(screen.getByPlaceholderText('20')).toHaveValue(20);
    });
  });

  describe('form validation', () => {
    it('requires name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Venue' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Venue' }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('requires slug field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Main Stage Theater'), 'Test');
      // Clear the auto-generated slug
      await user.clear(screen.getByPlaceholderText('main-stage-theater'));

      await user.click(screen.getByRole('button', { name: 'Create Venue' }));

      await waitFor(() => {
        expect(screen.getByText('Slug is required')).toBeInTheDocument();
      });
    });
  });

  describe('slug auto-generation', () => {
    it('auto-generates slug from name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Main Stage Theater'), 'Downtown Comedy Club');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('main-stage-theater')).toHaveValue('downtown-comedy-club');
      });
    });

    it('does not auto-generate slug when editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('main-stage-theater')).toHaveValue('main-stage-theater');
      });

      // Change the name
      await user.clear(screen.getByPlaceholderText('e.g., Main Stage Theater'));
      await user.type(screen.getByPlaceholderText('e.g., Main Stage Theater'), 'New Name');

      // Slug should remain unchanged
      expect(screen.getByPlaceholderText('main-stage-theater')).toHaveValue('main-stage-theater');
    });
  });

  describe('form submission', () => {
    it('calls create mutation for new venue', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Main Stage Theater'), 'New Venue');
      await user.click(screen.getByRole('button', { name: 'Create Venue' }));

      await waitFor(() => {
        expect(venuesApi.create).toHaveBeenCalled();
        const callArgs = (venuesApi.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArgs.name).toBe('New Venue');
        expect(callArgs.slug).toBe('new-venue');
      });
    });

    it('calls update mutation for existing venue', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <VenueForm isOpen={true} onClose={mockOnClose} venue={mockVenue} />
      );

      const nameInput = await screen.findByPlaceholderText('e.g., Main Stage Theater');
      await waitFor(() => {
        expect(nameInput).toHaveValue('Main Stage Theater');
      });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Venue');

      await user.click(screen.getByRole('button', { name: 'Update Venue' }));

      await waitFor(() => {
        expect(venuesApi.update).toHaveBeenCalled();
        const callArgs = (venuesApi.update as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(callArgs[0]).toBe(1); // venue ID
        expect(callArgs[1].name).toBe('Updated Venue');
      });
    });

    it('closes modal on successful create', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Stage Theater')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Main Stage Theater'), 'New Venue');
      await user.click(screen.getByRole('button', { name: 'Create Venue' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('festivals dropdown', () => {
    it('loads festivals from API', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(festivalsApi.getAll).toHaveBeenCalled();
      });
    });

    it('renders festival options when loaded', async () => {
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Comedy Festival 2024' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Laugh Fest 2024' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'All Festivals' })).toBeInTheDocument();
    });
  });

  describe('select interactions', () => {
    it('changes venue type selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      const venueTypeSelect = screen.getByRole('combobox', { name: /Venue Type/i });
      await user.selectOptions(venueTypeSelect, 'bar');

      expect(venueTypeSelect).toHaveValue('bar');
    });

    it('changes status selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VenueForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox', { name: /Status/i });
      await user.selectOptions(statusSelect, 'inactive');

      expect(statusSelect).toHaveValue('inactive');
    });
  });
});
