import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from './Settings';
import { ToastProvider } from '@/components/common/Toast';

// Mock the APIs
vi.mock('@/api/endpoints', () => ({
  settingsApi: {
    get: vi.fn().mockResolvedValue({
      active_festival_id: 1,
      notification_email: 'admin@festival.com',
      eventbrite_token: 'eb_token_123',
      eventbrite_org_id: 'org_123',
      mailchimp_api_key: 'mc_key_123',
      mailchimp_list_id: 'list_123',
      voting_weight_first: 3,
      voting_weight_second: 2,
      voting_weight_third: 1,
    }),
    update: vi.fn().mockResolvedValue({ success: true }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Comedy Festival 2024' },
      { id: 2, name: 'Laugh Fest 2024' },
    ]),
  },
  eventbriteApi: {
    test: vi.fn().mockResolvedValue({ success: true }),
    sync: vi.fn().mockResolvedValue({ synced: 5, total: 5, errors: [] }),
  },
  mailchimpApi: {
    test: vi.fn().mockResolvedValue({ success: true, message: 'Connected' }),
    getLists: vi.fn().mockResolvedValue({ success: true, data: [] }),
    syncPerformers: vi.fn().mockResolvedValue({ success: true, message: 'Synced' }),
    syncVolunteers: vi.fn().mockResolvedValue({ success: true, message: 'Synced' }),
    syncAttendees: vi.fn().mockResolvedValue({ success: true, message: 'Synced' }),
    syncAll: vi.fn().mockResolvedValue({ success: true, total_synced: 100, errors: [] }),
  },
  firebaseApi: {
    getSettings: vi.fn().mockResolvedValue({
      enabled: false,
      project_id: '',
      database_url: '',
      api_key: '',
      vapid_key: '',
      credentials_uploaded: false,
    }),
    updateSettings: vi.fn().mockResolvedValue({ success: true }),
    test: vi.fn().mockResolvedValue({ success: true, message: 'Connected' }),
    sync: vi.fn().mockResolvedValue({ success: true, message: 'Synced' }),
    sendNotification: vi.fn().mockResolvedValue({ success: true, message: 'Sent' }),
  },
}));

import { settingsApi, eventbriteApi, mailchimpApi } from '@/api/endpoints';

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

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
      });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<Settings />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders Save Settings button', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });
    });
  });

  describe('General section', () => {
    it('renders General heading', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
      });
    });

    it('renders Active Festival select', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Active Festival')).toBeInTheDocument();
      });
    });

    it('renders festival options', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Comedy Festival 2024' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Laugh Fest 2024' })).toBeInTheDocument();
    });

    it('renders Notification Email input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Notification Email')).toBeInTheDocument();
      });
    });
  });

  describe('Eventbrite section', () => {
    it('renders Eventbrite Integration heading', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Eventbrite Integration')).toBeInTheDocument();
      });
    });

    it('renders API Token input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Eventbrite private token')).toBeInTheDocument();
      });
    });

    it('renders Organization ID input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Your Eventbrite organization ID')).toBeInTheDocument();
      });
    });

    it('renders Test Connection button', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        const testButtons = screen.getAllByRole('button', { name: /test connection/i });
        expect(testButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders Sync Events button', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sync events/i })).toBeInTheDocument();
      });
    });

    it('calls test API when clicking Test Connection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Eventbrite Integration')).toBeInTheDocument();
      });

      const testButtons = screen.getAllByRole('button', { name: /test connection/i });
      await user.click(testButtons[0]); // Click Eventbrite Test Connection

      await waitFor(() => {
        expect(eventbriteApi.test).toHaveBeenCalled();
      });
    });
  });

  describe('Mailchimp section', () => {
    it('renders Mailchimp Integration heading', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Mailchimp Integration')).toBeInTheDocument();
      });
    });

    it('renders API Key input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Mailchimp API key')).toBeInTheDocument();
      });
    });

    it('renders Audience/List label', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Audience/List')).toBeInTheDocument();
      });
    });
  });

  describe('Firebase section', () => {
    it('renders Firebase Real-Time heading', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Firebase Real-Time')).toBeInTheDocument();
      });
    });

    it('renders Enable Firebase checkbox', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText('Enable Firebase Integration')).toBeInTheDocument();
      });
    });
  });

  describe('Voting Weights section', () => {
    it('renders Voting Weights heading', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Voting Weights')).toBeInTheDocument();
      });
    });

    it('renders 1st Place Weight input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('1st Place Weight')).toBeInTheDocument();
      });
    });

    it('renders 2nd Place Weight input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('2nd Place Weight')).toBeInTheDocument();
      });
    });

    it('renders 3rd Place Weight input', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('3rd Place Weight')).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('fetches settings on mount', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(settingsApi.get).toHaveBeenCalled();
      });
    });
  });
});
