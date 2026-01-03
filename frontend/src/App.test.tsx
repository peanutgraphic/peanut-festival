import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ToastProvider } from '@/components/common/Toast';

// Mock all page components to avoid loading their dependencies
vi.mock('@/pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));
vi.mock('@/pages/Festivals', () => ({
  Festivals: () => <div data-testid="festivals-page">Festivals Page</div>,
}));
vi.mock('@/pages/Shows', () => ({
  Shows: () => <div data-testid="shows-page">Shows Page</div>,
}));
vi.mock('@/pages/Performers', () => ({
  Performers: () => <div data-testid="performers-page">Performers Page</div>,
}));
vi.mock('@/pages/Venues', () => ({
  Venues: () => <div data-testid="venues-page">Venues Page</div>,
}));
vi.mock('@/pages/VotingAdmin', () => ({
  VotingAdmin: () => <div data-testid="voting-page">Voting Page</div>,
}));
vi.mock('@/pages/Competitions', () => ({
  Competitions: () => <div data-testid="competitions-page">Competitions Page</div>,
}));
vi.mock('@/pages/Volunteers', () => ({
  Volunteers: () => <div data-testid="volunteers-page">Volunteers Page</div>,
}));
vi.mock('@/pages/Vendors', () => ({
  Vendors: () => <div data-testid="vendors-page">Vendors Page</div>,
}));
vi.mock('@/pages/Sponsors', () => ({
  Sponsors: () => <div data-testid="sponsors-page">Sponsors Page</div>,
}));
vi.mock('@/pages/FlyerGenerator', () => ({
  FlyerGenerator: () => <div data-testid="flyers-page">Flyers Page</div>,
}));
vi.mock('@/pages/Attendees', () => ({
  Attendees: () => <div data-testid="attendees-page">Attendees Page</div>,
}));
vi.mock('@/pages/Messaging', () => ({
  Messaging: () => <div data-testid="messaging-page">Messaging Page</div>,
}));
vi.mock('@/pages/Analytics', () => ({
  Analytics: () => <div data-testid="analytics-page">Analytics Page</div>,
}));
vi.mock('@/pages/Reports', () => ({
  Reports: () => <div data-testid="reports-page">Reports Page</div>,
}));
vi.mock('@/pages/Settings', () => ({
  Settings: () => <div data-testid="settings-page">Settings Page</div>,
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderApp = (initialRoute = '/') => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('App', () => {
  describe('routing', () => {
    it('renders Dashboard at root route', async () => {
      renderApp('/');

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('renders Festivals page', async () => {
      renderApp('/festivals');

      await waitFor(() => {
        expect(screen.getByTestId('festivals-page')).toBeInTheDocument();
      });
    });

    it('renders Shows page', async () => {
      renderApp('/shows');

      await waitFor(() => {
        expect(screen.getByTestId('shows-page')).toBeInTheDocument();
      });
    });

    it('renders Performers page', async () => {
      renderApp('/performers');

      await waitFor(() => {
        expect(screen.getByTestId('performers-page')).toBeInTheDocument();
      });
    });

    it('renders Venues page', async () => {
      renderApp('/venues');

      await waitFor(() => {
        expect(screen.getByTestId('venues-page')).toBeInTheDocument();
      });
    });

    it('renders Voting page', async () => {
      renderApp('/voting');

      await waitFor(() => {
        expect(screen.getByTestId('voting-page')).toBeInTheDocument();
      });
    });

    it('renders Competitions page', async () => {
      renderApp('/competitions');

      await waitFor(() => {
        expect(screen.getByTestId('competitions-page')).toBeInTheDocument();
      });
    });

    it('renders Volunteers page', async () => {
      renderApp('/volunteers');

      await waitFor(() => {
        expect(screen.getByTestId('volunteers-page')).toBeInTheDocument();
      });
    });

    it('renders Vendors page', async () => {
      renderApp('/vendors');

      await waitFor(() => {
        expect(screen.getByTestId('vendors-page')).toBeInTheDocument();
      });
    });

    it('renders Sponsors page', async () => {
      renderApp('/sponsors');

      await waitFor(() => {
        expect(screen.getByTestId('sponsors-page')).toBeInTheDocument();
      });
    });

    it('renders Flyers page', async () => {
      renderApp('/flyers');

      await waitFor(() => {
        expect(screen.getByTestId('flyers-page')).toBeInTheDocument();
      });
    });

    it('renders Attendees page', async () => {
      renderApp('/attendees');

      await waitFor(() => {
        expect(screen.getByTestId('attendees-page')).toBeInTheDocument();
      });
    });

    it('renders Messaging page', async () => {
      renderApp('/messaging');

      await waitFor(() => {
        expect(screen.getByTestId('messaging-page')).toBeInTheDocument();
      });
    });

    it('renders Analytics page', async () => {
      renderApp('/analytics');

      await waitFor(() => {
        expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
      });
    });

    it('renders Reports page', async () => {
      renderApp('/reports');

      await waitFor(() => {
        expect(screen.getByTestId('reports-page')).toBeInTheDocument();
      });
    });

    it('renders Settings page', async () => {
      renderApp('/settings');

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });
    });

    it('redirects unknown routes to Dashboard', async () => {
      renderApp('/unknown-route');

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });
  });
});
