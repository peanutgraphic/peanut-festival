import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Messaging } from './Messaging';
import { ToastProvider } from '@/components/common/Toast';

// Mock the client
vi.mock('../api/client', () => ({
  client: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/messages/conversations') {
        return Promise.resolve({
          data: {
            data: [
              {
                conversation_id: 'performer-123',
                last_message_at: '2024-06-15T10:30:00',
                unread_count: 2,
              },
              {
                conversation_id: 'vendor-456',
                last_message_at: '2024-06-14T14:00:00',
                unread_count: 0,
              },
            ],
          },
        });
      }
      if (url.startsWith('/messages/')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                conversation_id: 'performer-123',
                sender_type: 'user',
                subject: 'Question about schedule',
                content: 'When is my set time?',
                created_at: '2024-06-15T10:00:00',
              },
              {
                id: 2,
                conversation_id: 'performer-123',
                sender_type: 'admin',
                subject: null,
                content: 'Your set is at 7pm on Saturday',
                created_at: '2024-06-15T10:30:00',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

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

describe('Messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Messages');
      });
    });

    it('renders Send Broadcast button', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });
    });
  });

  describe('tabs', () => {
    it('renders Inbox tab', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /inbox/i })).toBeInTheDocument();
      });
    });

    it('renders Broadcast History tab', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /broadcast history/i })).toBeInTheDocument();
      });
    });

    it('shows unread count in inbox tab', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        // Total unread is 2 from performer-123 - appears in tab and conversation list
        const unreadBadges = screen.getAllByText('2');
        expect(unreadBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('switches to Broadcast History when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /broadcast history/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /broadcast history/i }));

      await waitFor(() => {
        expect(screen.getByText('Broadcast messages will appear here')).toBeInTheDocument();
      });
    });
  });

  describe('conversations list', () => {
    it('renders Conversations header', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('Conversations')).toBeInTheDocument();
      });
    });

    it('displays conversation IDs', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('performer-123')).toBeInTheDocument();
      });

      expect(screen.getByText('vendor-456')).toBeInTheDocument();
    });

    it('shows no conversations message when empty', async () => {
      vi.mocked(await import('../api/client')).client.get.mockImplementationOnce(() =>
        Promise.resolve({ data: { data: [] } })
      );

      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      });
    });
  });

  describe('messages view', () => {
    it('shows placeholder when no conversation selected', async () => {
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('Select a conversation to view messages')).toBeInTheDocument();
      });
    });

    it('shows messages when conversation is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('performer-123')).toBeInTheDocument();
      });

      await user.click(screen.getByText('performer-123'));

      await waitFor(() => {
        expect(screen.getByText('When is my set time?')).toBeInTheDocument();
      });

      expect(screen.getByText('Your set is at 7pm on Saturday')).toBeInTheDocument();
    });

    it('shows message composer when conversation selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByText('performer-123')).toBeInTheDocument();
      });

      await user.click(screen.getByText('performer-123'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });
    });
  });

  describe('broadcast history tab', () => {
    it('shows broadcast history content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /broadcast history/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /broadcast history/i }));

      await waitFor(() => {
        expect(screen.getByText('Broadcast messages will appear here')).toBeInTheDocument();
      });

      expect(screen.getByText('Send a broadcast to communicate with groups')).toBeInTheDocument();
    });
  });

  describe('broadcast modal', () => {
    it('opens modal when Send Broadcast is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        // Modal shows "Send To" label which is unique to the modal
        expect(screen.getByText('Send To')).toBeInTheDocument();
      });
    });

    it('renders Send To label in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        expect(screen.getByText('Send To')).toBeInTheDocument();
      });
    });

    it('renders group options in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        expect(screen.getByText('All Participants')).toBeInTheDocument();
      });

      expect(screen.getByText('All Performers')).toBeInTheDocument();
      expect(screen.getByText('All Volunteers')).toBeInTheDocument();
      expect(screen.getByText('All Vendors')).toBeInTheDocument();
      expect(screen.getByText('All Attendees')).toBeInTheDocument();
    });

    it('renders Subject input in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        expect(screen.getByText('Subject')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Message subject')).toBeInTheDocument();
    });

    it('renders Message textarea in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your message here...')).toBeInTheDocument();
      });
    });

    it('renders Cancel button in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('closes modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Messaging />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send broadcast/i }));

      await waitFor(() => {
        // Modal shows "Send To" label which is unique to the modal
        expect(screen.getByText('Send To')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Send To')).not.toBeInTheDocument();
      });
    });
  });
});
