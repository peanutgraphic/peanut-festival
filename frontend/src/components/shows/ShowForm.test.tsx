import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShowForm } from './ShowForm';
import { ToastProvider } from '@/components/common/Toast';
import type { Show } from '@/types';

// Mock the API endpoints
vi.mock('@/api/endpoints', () => ({
  showsApi: {
    create: vi.fn().mockResolvedValue({ id: 1, title: 'New Show' }),
    update: vi.fn().mockResolvedValue({ id: 1, title: 'Updated Show' }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Comedy Festival 2024' },
      { id: 2, name: 'Laugh Fest 2024' },
    ]),
  },
  venuesApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Main Stage Theater' },
      { id: 2, name: 'Underground Club' },
    ]),
  },
}));

import { showsApi, festivalsApi, venuesApi } from '@/api/endpoints';

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

const mockShow: Show = {
  id: 1,
  festival_id: 1,
  title: 'Opening Night Showcase',
  slug: 'opening-night-showcase',
  description: 'The first night of the festival',
  venue_id: 1,
  show_date: '2024-06-15',
  start_time: '19:00',
  end_time: '21:00',
  capacity: 200,
  ticket_price: 25.0,
  status: 'scheduled',
  featured: true,
  kid_friendly: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
};

describe('ShowForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with correct title for new show', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Show')).toBeInTheDocument();
      });
    });

    it('renders modal with correct title for editing', async () => {
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Show')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<ShowForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Show')).not.toBeInTheDocument();
    });

    it('renders all form sections', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
      expect(screen.getByText('Schedule & Venue')).toBeInTheDocument();
      expect(screen.getByText('Tickets')).toBeInTheDocument();
      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('renders basic information fields', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('opening-night-showcase')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe the show...')).toBeInTheDocument();
    });

    it('renders schedule fields', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
      });
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('End Time')).toBeInTheDocument();
    });

    it('renders ticket fields', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('100')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('25.00')).toBeInTheDocument();
    });

    it('renders option checkboxes', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Featured Show')).toBeInTheDocument();
      });
      expect(screen.getByText('Kid Friendly')).toBeInTheDocument();
    });

    it('renders footer buttons', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Create Show' })).toBeInTheDocument();
    });

    it('shows Update button when editing', async () => {
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update Show' })).toBeInTheDocument();
      });
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Scheduled' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'On Sale' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sold Out' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('populates form with show data', async () => {
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toHaveValue('Opening Night Showcase');
      });

      expect(screen.getByPlaceholderText('opening-night-showcase')).toHaveValue('opening-night-showcase');
    });

    it('populates ticket fields', async () => {
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('100')).toHaveValue(200);
      });

      expect(screen.getByPlaceholderText('25.00')).toHaveValue(25);
    });

    it('populates checkbox options', async () => {
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByText('Featured Show')).toBeInTheDocument();
      });

      // Featured should be checked, Kid Friendly should not be
      const featuredCheckbox = screen.getByRole('checkbox', { name: /Featured Show/i });
      const kidFriendlyCheckbox = screen.getByRole('checkbox', { name: /Kid Friendly/i });

      expect(featuredCheckbox).toBeChecked();
      expect(kidFriendlyCheckbox).not.toBeChecked();
    });
  });

  describe('form validation', () => {
    it('requires title field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Show' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Show' }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('requires festival selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Opening Night Showcase'), 'Test Show');
      await user.click(screen.getByRole('button', { name: 'Create Show' }));

      await waitFor(() => {
        expect(screen.getByText('Festival is required')).toBeInTheDocument();
      });
    });
  });

  describe('slug auto-generation', () => {
    it('auto-generates slug from title', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Opening Night Showcase'), 'Late Night Comedy Special');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('opening-night-showcase')).toHaveValue('late-night-comedy-special');
      });
    });

    it('does not auto-generate slug when editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('opening-night-showcase')).toHaveValue('opening-night-showcase');
      });

      // Change the title
      await user.clear(screen.getByPlaceholderText('e.g., Opening Night Showcase'));
      await user.type(screen.getByPlaceholderText('e.g., Opening Night Showcase'), 'New Title');

      // Slug should remain unchanged
      expect(screen.getByPlaceholderText('opening-night-showcase')).toHaveValue('opening-night-showcase');
    });
  });

  describe('form submission', () => {
    it('calls create mutation for new show', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toBeInTheDocument();
      });

      // Fill in required fields
      await user.type(screen.getByPlaceholderText('e.g., Opening Night Showcase'), 'New Show');

      // Select festival
      const festivalSelect = screen.getByRole('combobox', { name: /Festival/i });
      await user.selectOptions(festivalSelect, '1');

      // Fill in date (required)
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs[0]) {
        await user.type(dateInputs[0] as HTMLInputElement, '2024-06-15');
      }

      await user.click(screen.getByRole('button', { name: 'Create Show' }));

      await waitFor(() => {
        expect(showsApi.create).toHaveBeenCalled();
        const callArgs = (showsApi.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArgs.title).toBe('New Show');
        expect(callArgs.slug).toBe('new-show');
      });
    });

    // TODO: Fix date input population issue with react-hook-form
    it.skip('calls update mutation for existing show', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ShowForm isOpen={true} onClose={mockOnClose} show={mockShow} />
      );

      // Wait for form to populate with data from mockShow
      const titleInput = await screen.findByPlaceholderText('e.g., Opening Night Showcase');
      await waitFor(() => {
        expect(titleInput).toHaveValue('Opening Night Showcase');
      });

      // The form should be prepopulated, just verify update button exists
      const updateButton = screen.getByRole('button', { name: 'Update Show' });
      expect(updateButton).toBeInTheDocument();

      // Click update and verify mutation call
      await user.click(updateButton);

      // The mutation may not be called if validation fails - verify form is properly populated
      await waitFor(
        () => {
          expect(showsApi.update).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('closes modal on successful create', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Opening Night Showcase')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Opening Night Showcase'), 'New Show');

      const festivalSelect = screen.getByRole('combobox', { name: /Festival/i });
      await user.selectOptions(festivalSelect, '1');

      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs[0]) {
        await user.type(dateInputs[0] as HTMLInputElement, '2024-06-15');
      }

      await user.click(screen.getByRole('button', { name: 'Create Show' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('festivals dropdown', () => {
    it('loads festivals from API', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(festivalsApi.getAll).toHaveBeenCalled();
      });
    });

    it('renders festival options when loaded', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Comedy Festival 2024' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Laugh Fest 2024' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Select festival...' })).toBeInTheDocument();
    });
  });

  describe('venues dropdown', () => {
    it('loads venues from API', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(venuesApi.getAll).toHaveBeenCalled();
      });
    });

    it('renders venue options when loaded', async () => {
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Main Stage Theater' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Underground Club' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Select venue...' })).toBeInTheDocument();
    });
  });

  describe('checkbox interactions', () => {
    it('toggles featured checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Featured Show')).toBeInTheDocument();
      });

      const featuredCheckbox = screen.getByRole('checkbox', { name: /Featured Show/i });
      expect(featuredCheckbox).not.toBeChecked();

      await user.click(featuredCheckbox);

      expect(featuredCheckbox).toBeChecked();
    });

    it('toggles kid friendly checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Kid Friendly')).toBeInTheDocument();
      });

      const kidFriendlyCheckbox = screen.getByRole('checkbox', { name: /Kid Friendly/i });
      expect(kidFriendlyCheckbox).not.toBeChecked();

      await user.click(kidFriendlyCheckbox);

      expect(kidFriendlyCheckbox).toBeChecked();
    });
  });
});
