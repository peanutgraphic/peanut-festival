import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VotingAdmin } from './VotingAdmin';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  showsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, slug: 'opening-night', title: 'Opening Night Show' },
      { id: 2, slug: 'finals', title: 'Finals Competition' },
    ]),
  },
  votingApi: {
    getConfig: vi.fn().mockResolvedValue({
      active_group: 'Group A',
      timer_duration: 60,
      num_groups: 4,
    }),
    getResults: vi.fn().mockResolvedValue([
      {
        performer_id: 1,
        performer_name: 'John Comedian',
        group_name: 'Group A',
        first_place: 15,
        second_place: 10,
        third_place: 5,
        total_votes: 30,
        weighted_score: 70.5,
        photo_url: null,
      },
      {
        performer_id: 2,
        performer_name: 'Jane Jokester',
        group_name: 'Group A',
        first_place: 12,
        second_place: 8,
        third_place: 6,
        total_votes: 26,
        weighted_score: 58.0,
        photo_url: 'https://example.com/photo.jpg',
      },
      {
        performer_id: 3,
        performer_name: 'Bob Laughs',
        group_name: 'Group B',
        first_place: 20,
        second_place: 5,
        third_place: 3,
        total_votes: 28,
        weighted_score: 73.0,
        photo_url: null,
      },
    ]),
    calculateFinals: vi.fn().mockResolvedValue({ success: true }),
  },
}));

import { showsApi, votingApi } from '@/api/endpoints';

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

describe('VotingAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Voting Admin');
      });
    });

    it('renders show selector', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByText('Select Show')).toBeInTheDocument();
      });
    });

    it('renders show selector dropdown', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('renders placeholder option', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Choose a show...' })).toBeInTheDocument();
      });
    });
  });

  describe('show selection', () => {
    it('renders show options from API', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Finals Competition' })).toBeInTheDocument();
    });

    it('shows instruction text when no show selected', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(
          screen.getByText('Select a show above to view and manage voting controls and results.')
        ).toBeInTheDocument();
      });
    });

    it('shows no shows message when shows list is empty', async () => {
      vi.mocked(showsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(
          screen.getByText('No shows available. Create a show first to manage voting.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('voting controls', () => {
    it('shows voting controls when show is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('Voting Controls')).toBeInTheDocument();
      });
    });

    it('displays active group from config', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('Active Group')).toBeInTheDocument();
      });

      // Group A appears multiple times (in config and results)
      const groupAElements = screen.getAllByText('Group A');
      expect(groupAElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays timer duration from config', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('Timer Duration')).toBeInTheDocument();
      });

      expect(screen.getByText('60 seconds')).toBeInTheDocument();
    });

    it('displays number of groups from config', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('Groups')).toBeInTheDocument();
      });

      expect(screen.getByText('4 groups')).toBeInTheDocument();
    });

    it('renders Start Voting button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start voting/i })).toBeInTheDocument();
      });
    });

    it('renders Pause button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });

    it('renders Calculate Finals button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /calculate finals/i })).toBeInTheDocument();
      });
    });
  });

  describe('results section', () => {
    it('shows Results by Group heading when show selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('Results by Group')).toBeInTheDocument();
      });
    });

    it('displays group names', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        // Group names appear as headers
        const groupAElements = screen.getAllByText('Group A');
        expect(groupAElements.length).toBeGreaterThanOrEqual(1);
      });

      const groupBElements = screen.getAllByText('Group B');
      expect(groupBElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays performer names', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('John Comedian')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Jokester')).toBeInTheDocument();
      expect(screen.getByText('Bob Laughs')).toBeInTheDocument();
    });

    it('displays table headers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        // Multiple tables, so headers appear multiple times
        const rankHeaders = screen.getAllByText('Rank');
        expect(rankHeaders.length).toBeGreaterThanOrEqual(1);
      });

      const performerHeaders = screen.getAllByText('Performer');
      expect(performerHeaders.length).toBeGreaterThanOrEqual(1);

      const scoreHeaders = screen.getAllByText('Score');
      expect(scoreHeaders.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when no votes', async () => {
      vi.mocked(votingApi.getResults).mockResolvedValueOnce([]);

      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByText('No votes recorded yet for this show.')).toBeInTheDocument();
      });
    });
  });

  describe('calculate finals', () => {
    it('calls calculateFinals when button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /calculate finals/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /calculate finals/i }));

      await waitFor(() => {
        expect(votingApi.calculateFinals).toHaveBeenCalledWith('opening-night');
      });
    });
  });

  describe('API integration', () => {
    it('fetches shows on mount', async () => {
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(showsApi.getAll).toHaveBeenCalled();
      });
    });

    it('fetches config when show is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(votingApi.getConfig).toHaveBeenCalledWith('opening-night');
      });
    });

    it('fetches results when show is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VotingAdmin />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Opening Night Show' })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole('combobox'), 'opening-night');

      await waitFor(() => {
        expect(votingApi.getResults).toHaveBeenCalledWith('opening-night');
      });
    });
  });
});
