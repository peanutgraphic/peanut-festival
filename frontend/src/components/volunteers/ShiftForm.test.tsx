import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShiftForm } from './ShiftForm';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  volunteersApi: {
    createShift: vi.fn().mockResolvedValue({ id: 1, task_name: 'New Shift' }),
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

describe('ShiftForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders form title for new shift', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Shift')).toBeInTheDocument();
      });
    });

    it('renders form title for editing shift', async () => {
      const shift = {
        id: 1,
        festival_id: 1,
        task_name: 'Box Office',
        description: 'Handle ticket sales',
        location: 'Main Entrance',
        shift_date: '2024-06-15',
        start_time: '09:00',
        end_time: '13:00',
        slots_total: 5,
        slots_filled: 3,
        status: 'open' as const,
      };

      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} shift={shift} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Shift')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<ShiftForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Shift')).not.toBeInTheDocument();
    });
  });

  describe('form sections', () => {
    it('renders Shift Details section', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Shift Details')).toBeInTheDocument();
      });
    });

    it('renders Schedule section', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument();
      });
    });

    it('renders Capacity section', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Capacity')).toBeInTheDocument();
      });
    });
  });

  describe('form fields', () => {
    it('renders Festival select', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Festival')).toBeInTheDocument();
      });
    });

    it('renders Status select', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('renders Task Name input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Box Office, Stage Setup')).toBeInTheDocument();
      });
    });

    it('renders Description textarea', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Describe what volunteers will do...')).toBeInTheDocument();
      });
    });

    it('renders Location input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Main Entrance, Stage A')).toBeInTheDocument();
      });
    });

    it('renders Date input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
      });
    });

    it('renders Start Time input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Start Time')).toBeInTheDocument();
      });
    });

    it('renders End Time input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('End Time')).toBeInTheDocument();
      });
    });

    it('renders Total Slots input', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Total Slots')).toBeInTheDocument();
      });
    });

    it('renders slots hint text', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('How many volunteers are needed for this shift')).toBeInTheDocument();
      });
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Open' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Filled' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });
  });

  describe('festival options', () => {
    it('renders festival options from API', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Comedy Festival 2024' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Laugh Fest 2024' })).toBeInTheDocument();
    });

    it('renders placeholder option', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Select festival...' })).toBeInTheDocument();
      });
    });
  });

  describe('actions', () => {
    it('renders Cancel button', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('renders Create Shift button for new shift', async () => {
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create shift/i })).toBeInTheDocument();
      });
    });

    it('renders Update Shift button when editing', async () => {
      const shift = {
        id: 1,
        festival_id: 1,
        task_name: 'Box Office',
        shift_date: '2024-06-15',
        start_time: '09:00',
        end_time: '13:00',
        slots_total: 5,
        slots_filled: 3,
        status: 'open' as const,
      };

      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} shift={shift} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update shift/i })).toBeInTheDocument();
      });
    });

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('prefilled form', () => {
    it('populates form with shift data when editing', async () => {
      const shift = {
        id: 1,
        festival_id: 1,
        task_name: 'Stage Setup',
        description: 'Help set up the main stage',
        location: 'Main Stage',
        shift_date: '2024-06-15',
        start_time: '08:00',
        end_time: '12:00',
        slots_total: 10,
        slots_filled: 5,
        status: 'open' as const,
      };

      renderWithProviders(<ShiftForm isOpen={true} onClose={mockOnClose} shift={shift} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Stage Setup')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Help set up the main stage')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main Stage')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-06-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });
  });
});
