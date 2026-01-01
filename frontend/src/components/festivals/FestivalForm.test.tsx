import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FestivalForm } from './FestivalForm';
import { ToastProvider } from '@/components/common/Toast';
import type { Festival } from '@/types';

// Mock the API endpoints
vi.mock('@/api/endpoints', () => ({
  festivalsApi: {
    create: vi.fn().mockResolvedValue({ id: 1, name: 'New Festival' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Festival' }),
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

const mockFestival: Festival = {
  id: 1,
  name: 'Comedy Festival 2024',
  slug: 'comedy-festival-2024',
  description: 'Annual comedy festival',
  start_date: '2024-06-01',
  end_date: '2024-06-15',
  location: 'Chicago, IL',
  status: 'active',
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
};

describe('FestivalForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with correct title for new festival', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Festival')).toBeInTheDocument();
      });
    });

    it('renders modal with correct title for editing', async () => {
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Festival')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<FestivalForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Festival')).not.toBeInTheDocument();
    });

    it('renders all form sections', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
      expect(screen.getByText('Dates & Location')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders basic information fields', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe your festival...')).toBeInTheDocument();
    });

    it('renders location field', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Chicago, IL')).toBeInTheDocument();
      });
    });

    it('renders footer buttons', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Create Festival' })).toBeInTheDocument();
    });

    it('shows Update button when editing', async () => {
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update Festival' })).toBeInTheDocument();
      });
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Planning' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Archived' })).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('populates form with festival data', async () => {
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toHaveValue('Comedy Festival 2024');
      });

      expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toHaveValue('comedy-festival-2024');
      expect(screen.getByPlaceholderText('Describe your festival...')).toHaveValue('Annual comedy festival');
      expect(screen.getByPlaceholderText('e.g., Chicago, IL')).toHaveValue('Chicago, IL');
    });

    it('populates date fields', async () => {
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Festival')).toBeInTheDocument();
      });

      // Date fields should be populated
      const startDate = screen.getByLabelText(/Start Date/i);
      const endDate = screen.getByLabelText(/End Date/i);
      expect(startDate).toHaveValue('2024-06-01');
      expect(endDate).toHaveValue('2024-06-15');
    });
  });

  describe('form validation', () => {
    it('requires name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Festival' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Festival' }));

      await waitFor(() => {
        expect(screen.getByText('Festival name is required')).toBeInTheDocument();
      });
    });

    it('requires slug field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'Test');
      // Clear the auto-generated slug
      await user.clear(screen.getByPlaceholderText('summer-comedy-fest-2025'));

      await user.click(screen.getByRole('button', { name: 'Create Festival' }));

      await waitFor(() => {
        expect(screen.getByText('Slug is required')).toBeInTheDocument();
      });
    });

    it('validates slug pattern', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'Test');
      // Enter invalid slug with uppercase
      await user.clear(screen.getByPlaceholderText('summer-comedy-fest-2025'));
      await user.type(screen.getByPlaceholderText('summer-comedy-fest-2025'), 'Invalid Slug!');

      await user.click(screen.getByRole('button', { name: 'Create Festival' }));

      await waitFor(() => {
        expect(screen.getByText(/Slug can only contain/)).toBeInTheDocument();
      });
    });
  });

  describe('slug auto-generation', () => {
    it('auto-generates slug from name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'Summer Comedy Fest 2025');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toHaveValue('summer-comedy-fest-2025');
      });
    });

    it('handles special characters in name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'Comedy & Laughs Fest!');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toHaveValue('comedy-laughs-fest');
      });
    });

    it('does not auto-generate slug when editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toHaveValue('comedy-festival-2024');
      });

      // Change the name
      await user.clear(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'));
      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'New Name');

      // Slug should remain unchanged
      expect(screen.getByPlaceholderText('summer-comedy-fest-2025')).toHaveValue('comedy-festival-2024');
    });
  });

  describe('form submission', () => {
    it('calls create mutation for new festival', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'New Festival');
      await user.click(screen.getByRole('button', { name: 'Create Festival' }));

      await waitFor(() => {
        expect(festivalsApi.create).toHaveBeenCalled();
        const callArgs = (festivalsApi.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArgs.name).toBe('New Festival');
        expect(callArgs.slug).toBe('new-festival');
      });
    });

    it('calls update mutation for existing festival', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FestivalForm isOpen={true} onClose={mockOnClose} festival={mockFestival} />
      );

      const nameInput = await screen.findByPlaceholderText('e.g., Summer Comedy Fest 2025');
      await waitFor(() => {
        expect(nameInput).toHaveValue('Comedy Festival 2024');
      });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Festival');

      await user.click(screen.getByRole('button', { name: 'Update Festival' }));

      await waitFor(() => {
        expect(festivalsApi.update).toHaveBeenCalled();
        const callArgs = (festivalsApi.update as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(callArgs[0]).toBe(1); // festival ID
        expect(callArgs[1].name).toBe('Updated Festival');
      });
    });

    it('closes modal on successful create', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('e.g., Summer Comedy Fest 2025'), 'New Festival');
      await user.click(screen.getByRole('button', { name: 'Create Festival' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('select interactions', () => {
    it('changes status selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FestivalForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox', { name: /Festival Status/i });
      await user.selectOptions(statusSelect, 'active');

      expect(statusSelect).toHaveValue('active');
    });
  });
});
