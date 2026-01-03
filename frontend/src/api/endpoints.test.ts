import { describe, it, expect, vi, beforeEach } from 'vitest';
import { client } from './client';
import {
  dashboardApi,
  festivalsApi,
  showsApi,
  performersApi,
  venuesApi,
  votingApi,
  volunteersApi,
  vendorsApi,
  sponsorsApi,
  transactionsApi,
  settingsApi,
  eventbriteApi,
  mailchimpApi,
  competitionsApi,
  bookerApi,
  firebaseApi,
  reportsApi,
} from './endpoints';

// Mock the API client
vi.mock('./client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStats fetches dashboard statistics', async () => {
    const mockData = { shows: 10, performers: 50 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await dashboardApi.getStats();

    expect(client.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result).toEqual(mockData);
  });
});

describe('Festivals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches all festivals', async () => {
    const mockData = [{ id: 1, name: 'Festival 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await festivalsApi.getAll();

    expect(client.get).toHaveBeenCalledWith('/festivals');
    expect(result).toEqual(mockData);
  });

  it('getById fetches a single festival', async () => {
    const mockData = { id: 1, name: 'Festival 1' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await festivalsApi.getById(1);

    expect(client.get).toHaveBeenCalledWith('/festivals/1');
    expect(result).toEqual(mockData);
  });

  it('create creates a new festival', async () => {
    const mockData = { id: 1, name: 'New Festival' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await festivalsApi.create({ name: 'New Festival' });

    expect(client.post).toHaveBeenCalledWith('/festivals', { name: 'New Festival' });
    expect(result).toEqual(mockData);
  });

  it('update updates a festival', async () => {
    const mockData = { id: 1, name: 'Updated Festival' };
    vi.mocked(client.put).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await festivalsApi.update(1, { name: 'Updated Festival' });

    expect(client.put).toHaveBeenCalledWith('/festivals/1', { name: 'Updated Festival' });
    expect(result).toEqual(mockData);
  });

  it('delete removes a festival', async () => {
    vi.mocked(client.delete).mockResolvedValueOnce({ data: {} });

    await festivalsApi.delete(1);

    expect(client.delete).toHaveBeenCalledWith('/festivals/1');
  });
});

describe('Shows API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches shows with filters', async () => {
    const mockData = [{ id: 1, title: 'Show 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await showsApi.getAll({ festival_id: 1 });

    expect(client.get).toHaveBeenCalledWith('/shows', { params: { festival_id: 1 } });
    expect(result).toEqual(mockData);
  });

  it('getPerformers fetches performers for a show', async () => {
    const mockData = [{ id: 1, name: 'Performer 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await showsApi.getPerformers(1);

    expect(client.get).toHaveBeenCalledWith('/shows/1/performers');
    expect(result).toEqual(mockData);
  });

  it('addPerformer adds a performer to a show', async () => {
    const mockData = [{ id: 1, name: 'Performer 1' }];
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await showsApi.addPerformer(1, 2, { slot_number: 1 });

    expect(client.post).toHaveBeenCalledWith('/shows/1/performers', {
      performer_id: 2,
      slot_number: 1,
    });
    expect(result).toEqual(mockData);
  });
});

describe('Performers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches performers with filters', async () => {
    const mockData = [{ id: 1, name: 'Performer 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await performersApi.getAll({ status: 'approved' });

    expect(client.get).toHaveBeenCalledWith('/performers', { params: { status: 'approved' } });
    expect(result).toEqual(mockData);
  });

  it('review updates performer status', async () => {
    const mockData = { id: 1, status: 'approved' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await performersApi.review(1, 'approved', 'Great act!');

    expect(client.post).toHaveBeenCalledWith('/performers/1/review', {
      status: 'approved',
      notes: 'Great act!',
    });
    expect(result).toEqual(mockData);
  });

  it('notify sends notification to performer', async () => {
    const mockData = { success: true, message: 'Notification sent' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await performersApi.notify(1);

    expect(client.post).toHaveBeenCalledWith('/performers/1/notify');
    expect(result).toEqual(mockData);
  });
});

describe('Venues API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches venues with filters', async () => {
    const mockData = [{ id: 1, name: 'Venue 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await venuesApi.getAll({ venue_type: 'indoor' });

    expect(client.get).toHaveBeenCalledWith('/venues', { params: { venue_type: 'indoor' } });
    expect(result).toEqual(mockData);
  });

  it('create creates a new venue', async () => {
    const mockData = { id: 1, name: 'New Venue' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await venuesApi.create({ name: 'New Venue' });

    expect(client.post).toHaveBeenCalledWith('/venues', { name: 'New Venue' });
    expect(result).toEqual(mockData);
  });
});

describe('Voting API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getConfig fetches voting configuration', async () => {
    const mockData = { show_slug: 'show-1', voting_enabled: true };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await votingApi.getConfig('show-1');

    expect(client.get).toHaveBeenCalledWith('/voting/config/show-1');
    expect(result).toEqual(mockData);
  });

  it('saveConfig saves voting configuration', async () => {
    vi.mocked(client.put).mockResolvedValueOnce({ data: {} });

    await votingApi.saveConfig('show-1', { voting_enabled: false });

    expect(client.put).toHaveBeenCalledWith('/voting/config/show-1', { voting_enabled: false });
  });

  it('getResults fetches voting results', async () => {
    const mockData = [{ performer_id: 1, votes: 100 }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await votingApi.getResults('show-1');

    expect(client.get).toHaveBeenCalledWith('/voting/results/show-1');
    expect(result).toEqual(mockData);
  });

  it('getLogs fetches voting logs', async () => {
    const mockData = [{ id: 1, vote_hash: 'abc123' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await votingApi.getLogs('show-1');

    expect(client.get).toHaveBeenCalledWith('/voting/logs', { params: { show_slug: 'show-1' } });
    expect(result).toEqual(mockData);
  });

  it('calculateFinals triggers finals calculation', async () => {
    const mockData = [{ performer_id: 1, final_score: 95 }];
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await votingApi.calculateFinals('show-1');

    expect(client.post).toHaveBeenCalledWith('/voting/calculate-finals', { show_slug: 'show-1' });
    expect(result).toEqual(mockData);
  });
});

describe('Volunteers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getShifts fetches volunteer shifts', async () => {
    const mockData = [{ id: 1, title: 'Morning Shift' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await volunteersApi.getShifts({ festival_id: 1 });

    expect(client.get).toHaveBeenCalledWith('/volunteers/shifts', { params: { festival_id: 1 } });
    expect(result).toEqual(mockData);
  });

  it('createShift creates a new shift', async () => {
    const mockData = { id: 1 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await volunteersApi.createShift({ title: 'New Shift' });

    expect(client.post).toHaveBeenCalledWith('/volunteers/shifts', { title: 'New Shift' });
    expect(result).toEqual(mockData);
  });
});

describe('Vendors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches vendors', async () => {
    const mockData = [{ id: 1, name: 'Vendor 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await vendorsApi.getAll();

    expect(client.get).toHaveBeenCalledWith('/vendors', { params: undefined });
    expect(result).toEqual(mockData);
  });
});

describe('Sponsors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches sponsors', async () => {
    const mockData = [{ id: 1, name: 'Sponsor 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await sponsorsApi.getAll();

    expect(client.get).toHaveBeenCalledWith('/sponsors', { params: undefined });
    expect(result).toEqual(mockData);
  });
});

describe('Transactions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches transactions', async () => {
    const mockData = [{ id: 1, amount: 100 }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await transactionsApi.getAll({ transaction_type: 'income' });

    expect(client.get).toHaveBeenCalledWith('/transactions', { params: { transaction_type: 'income' } });
    expect(result).toEqual(mockData);
  });

  it('getSummary fetches transaction summary', async () => {
    const mockData = { total_income: 1000, total_expenses: 500, net: 500 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await transactionsApi.getSummary(1);

    expect(client.get).toHaveBeenCalledWith('/transactions/summary', { params: { festival_id: 1 } });
    expect(result).toEqual(mockData);
  });
});

describe('Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get fetches settings', async () => {
    const mockData = { site_name: 'Festival Site' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await settingsApi.get();

    expect(client.get).toHaveBeenCalledWith('/settings');
    expect(result).toEqual(mockData);
  });

  it('update saves settings', async () => {
    vi.mocked(client.put).mockResolvedValueOnce({ data: {} });

    await settingsApi.update({ site_name: 'Updated Site' });

    expect(client.put).toHaveBeenCalledWith('/settings', { site_name: 'Updated Site' });
  });
});

describe('Eventbrite API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test checks Eventbrite connection', async () => {
    const mockData = { success: true, organizations: [] };
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockData });

    const result = await eventbriteApi.test();

    expect(client.get).toHaveBeenCalledWith('/eventbrite/test');
    expect(result).toEqual(mockData);
  });

  it('sync triggers Eventbrite sync', async () => {
    const mockData = { synced: 10, total: 10, errors: [] };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await eventbriteApi.sync(1);

    expect(client.post).toHaveBeenCalledWith('/eventbrite/sync', { festival_id: 1 });
    expect(result).toEqual(mockData);
  });
});

describe('Mailchimp API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test checks Mailchimp connection', async () => {
    const mockData = { success: true, health_status: 'ok' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockData });

    const result = await mailchimpApi.test();

    expect(client.get).toHaveBeenCalledWith('/mailchimp/test');
    expect(result).toEqual(mockData);
  });

  it('getLists fetches Mailchimp lists', async () => {
    const mockData = { success: true, data: [{ id: '1', name: 'List 1' }] };
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockData });

    const result = await mailchimpApi.getLists();

    expect(client.get).toHaveBeenCalledWith('/mailchimp/lists');
    expect(result).toEqual(mockData);
  });

  it('syncAll syncs all contacts', async () => {
    const mockData = { success: true, total_synced: 50 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockData });

    const result = await mailchimpApi.syncAll(1);

    expect(client.post).toHaveBeenCalledWith('/mailchimp/sync/all', { festival_id: 1 });
    expect(result).toEqual(mockData);
  });
});

describe('Competitions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll fetches competitions', async () => {
    const mockData = [{ id: 1, name: 'Competition 1' }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: { competitions: mockData } });

    const result = await competitionsApi.getAll(1);

    expect(client.get).toHaveBeenCalledWith('/competitions', { params: { festival_id: 1 } });
    expect(result).toEqual(mockData);
  });

  it('getBracket fetches competition bracket', async () => {
    const mockData = { competition: { id: 1 }, rounds: {} };
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockData });

    const result = await competitionsApi.getBracket(1);

    expect(client.get).toHaveBeenCalledWith('/competitions/1/bracket');
    expect(result).toEqual(mockData);
  });

  it('generateBracket creates bracket', async () => {
    const mockData = { competition: { id: 1 }, rounds: {} };
    vi.mocked(client.post).mockResolvedValueOnce({ data: { success: true, bracket: mockData } });

    const result = await competitionsApi.generateBracket(1, [1, 2, 3, 4]);

    expect(client.post).toHaveBeenCalledWith('/admin/competitions/1/generate', {
      performer_ids: [1, 2, 3, 4],
    });
    expect(result).toEqual(mockData);
  });
});

describe('Booker API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStatus fetches Booker integration status', async () => {
    const mockData = { booker_active: true, integration_enabled: true };
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockData });

    const result = await bookerApi.getStatus();

    expect(client.get).toHaveBeenCalledWith('/booker/status');
    expect(result).toEqual(mockData);
  });

  it('createLink creates performer link', async () => {
    const mockData = { success: true, link_id: 1 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockData });

    const result = await bookerApi.createLink(1, 2);

    expect(client.post).toHaveBeenCalledWith('/booker/link', {
      festival_performer_id: 1,
      booker_performer_id: 2,
    });
    expect(result).toEqual(mockData);
  });
});

describe('Firebase API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSettings fetches Firebase settings', async () => {
    const mockData = { enabled: true, project_id: 'test-project' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await firebaseApi.getSettings();

    expect(client.get).toHaveBeenCalledWith('/firebase/settings');
    expect(result).toEqual(mockData);
  });

  it('sendNotification sends a notification', async () => {
    const mockData = { success: true, message: 'Sent' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockData });

    const result = await firebaseApi.sendNotification('Title', 'Body', 'all', '/link');

    expect(client.post).toHaveBeenCalledWith('/firebase/send-notification', {
      title: 'Title',
      body: 'Body',
      topic: 'all',
      link: '/link',
    });
    expect(result).toEqual(mockData);
  });
});

describe('Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOverview fetches report overview', async () => {
    const mockData = { stats: {}, recent_activity: [] };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await reportsApi.getOverview(1);

    expect(client.get).toHaveBeenCalledWith('/reports/overview', { params: { festival_id: 1 } });
    expect(result).toEqual(mockData);
  });

  it('getTicketSales fetches ticket sales data', async () => {
    const mockData = { over_time: [], by_show: [] };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await reportsApi.getTicketSales(1, 'daily');

    expect(client.get).toHaveBeenCalledWith('/reports/ticket-sales', {
      params: { festival_id: 1, period: 'daily' },
    });
    expect(result).toEqual(mockData);
  });

  it('exportData exports data as CSV', async () => {
    const mockData = { filename: 'export.csv', content: 'data', mime_type: 'text/csv' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: { data: mockData } });

    const result = await reportsApi.exportData('performers', 1);

    expect(client.get).toHaveBeenCalledWith('/reports/export/performers', {
      params: { festival_id: 1, format: 'csv' },
    });
    expect(result).toEqual(mockData);
  });
});
