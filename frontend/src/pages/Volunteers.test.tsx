import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Volunteers } from './Volunteers';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  volunteersApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Sarah Helper',
        email: 'sarah@helper.com',
        phone: '555-1234',
        status: 'active',
        skills: ['Registration', 'Stage Management'],
        hours_completed: 24,
        availability: ['Saturday', 'Sunday'],
      },
      {
        id: 2,
        name: 'Mike Assist',
        email: 'mike@assist.com',
        phone: '555-5678',
        status: 'applied',
        skills: ['Security', 'Crowd Control'],
        hours_completed: 0,
        availability: ['Friday', 'Saturday'],
      },
    ]),
    getShifts: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Registration Desk',
        date: '2024-06-15',
        start_time: '08:00',
        end_time: '12:00',
        location: 'Main Entrance',
        max_volunteers: 5,
        assigned_count: 3,
      },
      {
        id: 2,
        title: 'Stage Setup',
        date: '2024-06-15',
        start_time: '14:00',
        end_time: '18:00',
        location: 'Main Stage',
        max_volunteers: 10,
        assigned_count: 7,
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 3, name: 'New Volunteer' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Volunteer' }),
    delete: vi.fn().mockResolvedValue({ success: true }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the filter store
vi.mock('@/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    volunteerFilters: {},
    setVolunteerFilters: vi.fn(),
  }),
}));

// Mock VolunteerForm and ShiftForm components
vi.mock('@/components/volunteers/VolunteerForm', () => ({
  VolunteerForm: () => <div data-testid="volunteer-form">Volunteer Form</div>,
}));

vi.mock('@/components/volunteers/ShiftForm', () => ({
  ShiftForm: () => <div data-testid="shift-form">Shift Form</div>,
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

describe('Volunteers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Volunteers');
      });
    });

    it('renders Add button', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add volunteer/i })).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      renderWithProviders(<Volunteers />);

      // The component shows "Loading..." in the table
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders Volunteers tab with count', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        // Tab shows "Volunteers (2)" format
        expect(screen.getByText(/Volunteers \(\d+\)/)).toBeInTheDocument();
      });
    });

    it('renders Shifts tab with count', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        // Tab shows "Shifts (2)" format
        expect(screen.getByText(/Shifts \(\d+\)/)).toBeInTheDocument();
      });
    });

    it('switches to Shifts tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText(/Shifts \(\d+\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Shifts \(\d+\)/));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
      });
    });
  });

  describe('filters', () => {
    it('renders search input', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search volunteers...')).toBeInTheDocument();
      });
    });

    it('renders status filter options', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Approved' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Declined' })).toBeInTheDocument();
    });
  });

  describe('volunteers table', () => {
    it('renders volunteer names', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Helper')).toBeInTheDocument();
      });

      expect(screen.getByText('Mike Assist')).toBeInTheDocument();
    });

    it('renders volunteer emails', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('sarah@helper.com')).toBeInTheDocument();
      });

      expect(screen.getByText('mike@assist.com')).toBeInTheDocument();
    });

    it('renders status badges', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });

      expect(screen.getByText('applied')).toBeInTheDocument();
    });

    it('renders total hours', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('24h')).toBeInTheDocument();
      });
    });

    it('shows empty state when no volunteers', async () => {
      vi.mocked(volunteersApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('No volunteers found.')).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('filters volunteers by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Helper')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search volunteers...');
      await user.type(searchInput, 'Sarah');

      expect(screen.getByText('Sarah Helper')).toBeInTheDocument();
      expect(screen.queryByText('Mike Assist')).not.toBeInTheDocument();
    });

    it('filters volunteers by email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Helper')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search volunteers...');
      await user.type(searchInput, 'assist');

      expect(screen.queryByText('Sarah Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Mike Assist')).toBeInTheDocument();
    });
  });

  describe('volunteer actions', () => {
    it('renders Edit button for each volunteer', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle('Edit');
        expect(editButtons.length).toBe(2);
      });
    });

    it('renders Delete button for each volunteer', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete');
        expect(deleteButtons.length).toBe(2);
      });
    });

    it('opens delete confirmation when clicking Delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Helper')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Sarah Helper"/)).toBeInTheDocument();
      });
    });
  });

  describe('shifts tab', () => {
    it('displays shifts content when tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByText(/Shifts \(\d+\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Shifts \(\d+\)/));

      // After switching to shifts tab, the "Add Shift" button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
      });
    });
  });

  describe('add volunteer modal', () => {
    it('opens modal when clicking Add Volunteer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add volunteer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add volunteer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('volunteer-form')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches volunteers on mount', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(volunteersApi.getAll).toHaveBeenCalled();
      });
    });

    it('fetches shifts on mount', async () => {
      renderWithProviders(<Volunteers />);

      await waitFor(() => {
        expect(volunteersApi.getShifts).toHaveBeenCalled();
      });
    });
  });
});
