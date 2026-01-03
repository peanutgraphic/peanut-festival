import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Competitions } from './Competitions';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  competitionsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        festival_id: 1,
        name: 'Battle of the Bands',
        description: 'Annual music competition',
        competition_type: 'single_elimination',
        voting_method: 'head_to_head',
        status: 'setup',
        rounds_count: 3,
        winner_performer_id: null,
      },
      {
        id: 2,
        festival_id: 1,
        name: 'Comedy Showdown',
        description: 'Best comedian wins',
        competition_type: 'double_elimination',
        voting_method: 'borda',
        status: 'active',
        rounds_count: 4,
        winner_performer_id: null,
      },
      {
        id: 3,
        festival_id: 1,
        name: 'Last Year Finals',
        description: 'Previous competition',
        competition_type: 'round_robin',
        voting_method: 'judges',
        status: 'completed',
        rounds_count: 3,
        winner_performer_id: 5,
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 4, name: 'New Competition' }),
    getBracket: vi.fn().mockResolvedValue(null),
    generateBracket: vi.fn().mockResolvedValue({ success: true }),
    startVoting: vi.fn().mockResolvedValue({ success: true }),
    completeMatch: vi.fn().mockResolvedValue({ success: true }),
  },
  performersApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Performer One' },
      { id: 2, name: 'Performer Two' },
      { id: 3, name: 'Performer Three' },
      { id: 4, name: 'Performer Four' },
    ]),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Summer Festival 2024' },
      { id: 2, name: 'Winter Fest 2024' },
    ]),
  },
}));

import { competitionsApi } from '@/api/endpoints';

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

describe('Competitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Competitions');
      });
    });

    it('renders New Competition button', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Competitions />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no competitions', async () => {
      vi.mocked(competitionsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('No competitions yet')).toBeInTheDocument();
      });
    });

    it('shows create button in empty state', async () => {
      vi.mocked(competitionsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create competition/i })).toBeInTheDocument();
      });
    });

    it('shows helpful message in empty state', async () => {
      vi.mocked(competitionsApi.getAll).mockResolvedValueOnce([]);

      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(
          screen.getByText('Create your first competition to start bracket tournaments.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('competition list', () => {
    it('displays competition names', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('Battle of the Bands')).toBeInTheDocument();
      });

      expect(screen.getByText('Comedy Showdown')).toBeInTheDocument();
      expect(screen.getByText('Last Year Finals')).toBeInTheDocument();
    });

    it('displays competition descriptions', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('Annual music competition')).toBeInTheDocument();
      });

      expect(screen.getByText('Best comedian wins')).toBeInTheDocument();
    });

    it('displays competition statuses', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('setup')).toBeInTheDocument();
      });

      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('displays competition types', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('Single Elimination')).toBeInTheDocument();
      });

      expect(screen.getByText('Double Elimination')).toBeInTheDocument();
      expect(screen.getByText('Round Robin')).toBeInTheDocument();
    });

    it('displays rounds count', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        // Multiple competitions have 3 rounds
        const threeRoundsElements = screen.getAllByText('3 rounds');
        expect(threeRoundsElements.length).toBeGreaterThanOrEqual(1);
      });

      expect(screen.getByText('4 rounds')).toBeInTheDocument();
    });

    it('shows winner indicator for completed competitions', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByText('Winner declared')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('shows Setup Bracket button for setup status', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setup bracket/i })).toBeInTheDocument();
      });
    });

    it('shows View Bracket button for active status', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view bracket/i })).toBeInTheDocument();
      });
    });

    it('shows View Results button for completed status', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument();
      });
    });
  });

  describe('create competition modal', () => {
    it('opens modal when New Competition is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        // Modal should show Festival select field
        expect(screen.getByText('Festival')).toBeInTheDocument();
      });
    });

    it('renders festival select in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByText('Festival')).toBeInTheDocument();
      });
    });

    it('renders name input in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Battle of the Bands')).toBeInTheDocument();
      });
    });

    it('renders description textarea in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Optional description...')).toBeInTheDocument();
      });
    });

    it('renders type select with options in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
      });

      // Options in the Type dropdown
      const singleElimOptions = screen.getAllByRole('option', { name: 'Single Elimination' });
      expect(singleElimOptions.length).toBeGreaterThanOrEqual(1);
    });

    it('renders voting method select in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByText('Voting Method')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Head to Head' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Borda Count' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Judges Only' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Combined' })).toBeInTheDocument();
    });

    it('renders Cancel button in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('closes modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new competition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new competition/i }));

      await waitFor(() => {
        // Modal should show Festival select field
        expect(screen.getByText('Festival')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        // Festival field should no longer be visible when modal closes
        expect(screen.queryByPlaceholderText('Battle of the Bands')).not.toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches competitions on mount', async () => {
      renderWithProviders(<Competitions />);

      await waitFor(() => {
        expect(competitionsApi.getAll).toHaveBeenCalled();
      });
    });
  });
});
