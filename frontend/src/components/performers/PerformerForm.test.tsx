import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformerForm } from './PerformerForm';
import { ToastProvider } from '@/components/common/Toast';
import type { Performer } from '@/types';

// Mock the API endpoints
vi.mock('@/api/endpoints', () => ({
  performersApi: {
    create: vi.fn().mockResolvedValue({ id: 1, name: 'New Performer' }),
    update: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Performer' }),
  },
  festivalsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Comedy Festival 2024' },
      { id: 2, name: 'Laugh Fest 2024' },
    ]),
  },
}));

import { performersApi, festivalsApi } from '@/api/endpoints';

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

const mockPerformer: Performer = {
  id: 1,
  festival_id: 1,
  name: 'John Comedian',
  email: 'john@comedy.com',
  phone: '555-123-4567',
  bio: 'Award-winning comedian',
  photo_url: 'https://example.com/photo.jpg',
  website: 'https://johncomedian.com',
  performance_type: 'standup',
  technical_requirements: 'Wireless mic preferred',
  social_links: {
    instagram: '@johncomedian',
    tiktok: '@johncomedian',
    youtube: 'https://youtube.com/johncomedian',
    twitter: '@johncomedian',
  },
  compensation: 500,
  travel_covered: true,
  lodging_covered: false,
  application_status: 'accepted',
  rating_internal: 4,
  pros: 'Great stage presence',
  cons: 'Sometimes runs long',
  review_notes: 'Book for main stage',
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
};

describe('PerformerForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with correct title for new performer', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('New Performer')).toBeInTheDocument();
      });
    });

    it('renders modal with correct title for editing', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Performer')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      renderWithProviders(<PerformerForm isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('New Performer')).not.toBeInTheDocument();
    });

    it('renders all form sections', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
      expect(screen.getByText('Performance Details')).toBeInTheDocument();
      expect(screen.getByText('Social Media')).toBeInTheDocument();
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
    });

    it('renders basic information fields', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Performer or act name')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('555-123-4567')).toBeInTheDocument();
    });

    it('renders performance details fields', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Performance Details')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('Tell us about the performer...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mic preferences, lighting, props, etc.')).toBeInTheDocument();
    });

    it('renders social media fields', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Social Media')).toBeInTheDocument();
      });
      // Check for placeholder text that's unique to social fields
      const instagramInputs = screen.getAllByPlaceholderText('@username');
      expect(instagramInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders internal notes fields', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('Strengths...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Concerns...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Internal notes about this performer...')).toBeInTheDocument();
    });

    it('renders footer buttons', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Create Performer' })).toBeInTheDocument();
    });

    it('shows Update button when editing', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update Performer' })).toBeInTheDocument();
      });
    });
  });

  describe('status options', () => {
    it('renders all status options', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toBeInTheDocument();

      // Check that status options exist
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Under Review' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Accepted' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Rejected' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Waitlisted' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Confirmed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });
  });

  describe('performance type options', () => {
    it('renders all performance type options', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      const typeSelect = screen.getByLabelText('Performance Type');
      expect(typeSelect).toBeInTheDocument();

      expect(screen.getByRole('option', { name: 'Select type...' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Stand-up Comedy' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Improv' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sketch Comedy' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Musical Comedy' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Variety Act' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Hosting/MC' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('populates form with performer data', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Performer or act name')).toHaveValue('John Comedian');
      });

      expect(screen.getByPlaceholderText('email@example.com')).toHaveValue('john@comedy.com');
      expect(screen.getByPlaceholderText('555-123-4567')).toHaveValue('555-123-4567');
      expect(screen.getByPlaceholderText('Tell us about the performer...')).toHaveValue('Award-winning comedian');
    });

    it('populates social media fields', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByText('Social Media')).toBeInTheDocument();
      });

      // Get all @username fields - Instagram and TikTok use @username, Twitter uses @username too
      const usernameInputs = screen.getAllByPlaceholderText('@username');
      expect(usernameInputs[0]).toHaveValue('@johncomedian'); // Instagram
    });

    it('populates performance details', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Details')).toBeInTheDocument();
      });

      const techReqField = screen.getByPlaceholderText('Mic preferences, lighting, props, etc.');
      expect(techReqField).toHaveValue('Wireless mic preferred');
    });

    it('populates checkbox fields', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        const travelCheckbox = screen.getByRole('checkbox', { name: /Travel Covered/i });
        expect(travelCheckbox).toBeChecked();
      });

      const lodgingCheckbox = screen.getByRole('checkbox', { name: /Lodging Covered/i });
      expect(lodgingCheckbox).not.toBeChecked();
    });

    it('populates internal notes', async () => {
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Strengths...')).toHaveValue('Great stage presence');
      });

      expect(screen.getByPlaceholderText('Concerns...')).toHaveValue('Sometimes runs long');
      expect(screen.getByPlaceholderText('Internal notes about this performer...')).toHaveValue('Book for main stage');
    });
  });

  describe('form validation', () => {
    it('requires name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: 'Create Performer' }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('does not submit with empty name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: 'Create Performer' }));

      await waitFor(() => {
        expect(performersApi.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('form submission', () => {
    it('calls create mutation for new performer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Performer or act name')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Performer or act name'), 'New Comedian');
      await user.type(screen.getByPlaceholderText('email@example.com'), 'new@comedy.com');

      await user.click(screen.getByRole('button', { name: 'Create Performer' }));

      await waitFor(() => {
        expect(performersApi.create).toHaveBeenCalled();
        const callArgs = (performersApi.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArgs.name).toBe('New Comedian');
        expect(callArgs.email).toBe('new@comedy.com');
      });
    });

    it('calls update mutation for existing performer', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      const nameInput = await screen.findByPlaceholderText('Performer or act name');
      await waitFor(() => {
        expect(nameInput).toHaveValue('John Comedian');
      });

      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');

      await user.click(screen.getByRole('button', { name: 'Update Performer' }));

      await waitFor(() => {
        expect(performersApi.update).toHaveBeenCalled();
        const callArgs = (performersApi.update as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(callArgs[0]).toBe(1); // performer ID
        expect(callArgs[1].name).toBe('John Updated');
      });
    });

    it('closes modal on successful create', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Performer or act name')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Performer or act name'), 'New Comedian');
      await user.click(screen.getByRole('button', { name: 'Create Performer' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('closes modal on successful update', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      const nameInput = await screen.findByPlaceholderText('Performer or act name');
      await waitFor(() => {
        expect(nameInput).toHaveValue('John Comedian');
      });

      await user.click(screen.getByRole('button', { name: 'Update Performer' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('festivals dropdown', () => {
    it('loads festivals from API', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(festivalsApi.getAll).toHaveBeenCalled();
      });
    });

    it('renders festival options when loaded', async () => {
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Comedy Festival 2024' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Laugh Fest 2024' })).toBeInTheDocument();
    });
  });

  describe('form reset', () => {
    it('resets form when performer changes', async () => {
      const { rerender } = renderWithProviders(
        <PerformerForm isOpen={true} onClose={mockOnClose} performer={mockPerformer} />
      );

      const nameInput = await screen.findByPlaceholderText('Performer or act name');
      await waitFor(() => {
        expect(nameInput).toHaveValue('John Comedian');
      });

      // Create new QueryClient for rerender
      const queryClient = createQueryClient();
      rerender(
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <PerformerForm isOpen={true} onClose={mockOnClose} performer={null} />
          </ToastProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Performer or act name')).toHaveValue('');
      });
    });
  });

  describe('checkbox interactions', () => {
    it('toggles travel covered checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Performance Details')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Travel Covered/i });
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('toggles lodging covered checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Performance Details')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /Lodging Covered/i });
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('select interactions', () => {
    it('changes status selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox', { name: /Status/i });
      await user.selectOptions(statusSelect, 'accepted');

      expect(statusSelect).toHaveValue('accepted');
    });

    it('changes performance type selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PerformerForm isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Performance Details')).toBeInTheDocument();
      });

      const typeSelect = screen.getByRole('combobox', { name: /Performance Type/i });
      await user.selectOptions(typeSelect, 'improv');

      expect(typeSelect).toHaveValue('improv');
    });
  });
});
