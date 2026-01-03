import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VolunteerForm } from './VolunteerForm';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  volunteersApi: {
    create: vi.fn().mockResolvedValue({ id: 1, name: 'New Volunteer' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Volunteer' }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Comedy Festival 2024' },
      { id: 2, name: 'Laugh Fest 2024' },
    ]),
  },
}));

import { volunteersApi } from '@/api/endpoints';

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

describe('VolunteerForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders form title for new volunteer', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Volunteer')).toBeInTheDocument();
      });
    });

    it('renders form title for editing volunteer', async () => {
      const volunteer = {
        id: 1,
        name: 'John Helper',
        email: 'john@helper.com',
        phone: '555-1234',
        status: 'active' as const,
        festival_id: 1,
      };

      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} volunteer={volunteer} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Volunteer')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<VolunteerForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Volunteer')).not.toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('renders name input', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        // Use placeholder text which is unique
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      });
    });

    it('renders email input', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
      });
    });

    it('renders phone input', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('555-123-4567')).toBeInTheDocument();
      });
    });

    it('renders status select', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('renders festival select', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Festival')).toBeInTheDocument();
      });
    });

    it('renders emergency contact input', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('renders shirt size select', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('T-Shirt Size')).toBeInTheDocument();
      });
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Approved' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Declined' })).toBeInTheDocument();
    });
  });

  describe('shirt size options', () => {
    it('renders all shirt size options', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Small' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Large' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'XL' })).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders Cancel button', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('renders submit button', async () => {
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        const createButtons = screen.getAllByRole('button', { name: /create volunteer/i });
        expect(createButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('prefilled form', () => {
    it('populates form with volunteer data when editing', async () => {
      const volunteer = {
        id: 1,
        name: 'Jane Helper',
        email: 'jane@helper.com',
        phone: '555-9876',
        status: 'approved' as const,
        festival_id: 1,
        emergency_contact: 'John Doe',
        emergency_phone: '555-1111',
        shirt_size: 'M',
        dietary_restrictions: 'None',
        notes: 'Test notes',
      };

      renderWithProviders(<VolunteerForm isOpen={true} onClose={mockOnClose} volunteer={volunteer} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane Helper')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('jane@helper.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-9876')).toBeInTheDocument();
    });
  });
});
