import { client } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Festival,
  Show,
  Performer,
  Venue,
  Volunteer,
  VolunteerShift,
  Vendor,
  Sponsor,
  VotingConfig,
  VoteResult,
  VoteLog,
  DashboardStats,
  Settings,
  Transaction,
  PerformerFilters,
  ShowFilters,
  VolunteerFilters,
  VendorFilters,
  SponsorFilters,
} from '@/types';

// Dashboard
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats | null> => {
    const response = await client.get<ApiResponse<DashboardStats | null>>('/dashboard/stats');
    return response.data.data;
  },
};

// Festivals
export const festivalsApi = {
  getAll: async (): Promise<Festival[]> => {
    const response = await client.get<PaginatedResponse<Festival>>('/festivals');
    return response.data.data;
  },
  getById: async (id: number): Promise<Festival> => {
    const response = await client.get<ApiResponse<Festival>>(`/festivals/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Festival>): Promise<Festival> => {
    const response = await client.post<ApiResponse<Festival>>('/festivals', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Festival>): Promise<Festival> => {
    const response = await client.put<ApiResponse<Festival>>(`/festivals/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/festivals/${id}`);
  },
};

// Shows
export const showsApi = {
  getAll: async (filters?: ShowFilters): Promise<Show[]> => {
    const response = await client.get<PaginatedResponse<Show>>('/shows', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Show> => {
    const response = await client.get<ApiResponse<Show>>(`/shows/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Show>): Promise<Show> => {
    const response = await client.post<ApiResponse<Show>>('/shows', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Show>): Promise<Show> => {
    const response = await client.put<ApiResponse<Show>>(`/shows/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/shows/${id}`);
  },
  getPerformers: async (id: number): Promise<Performer[]> => {
    const response = await client.get<ApiResponse<Performer[]>>(`/shows/${id}/performers`);
    return response.data.data;
  },
  addPerformer: async (showId: number, performerId: number, data?: Record<string, unknown>): Promise<Performer[]> => {
    const response = await client.post<ApiResponse<Performer[]>>(`/shows/${showId}/performers`, {
      performer_id: performerId,
      ...data,
    });
    return response.data.data;
  },
};

// Performers
export const performersApi = {
  getAll: async (filters?: PerformerFilters): Promise<Performer[]> => {
    const response = await client.get<PaginatedResponse<Performer>>('/performers', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Performer> => {
    const response = await client.get<ApiResponse<Performer>>(`/performers/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Performer>): Promise<Performer> => {
    const response = await client.post<ApiResponse<Performer>>('/performers', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Performer>): Promise<Performer> => {
    const response = await client.put<ApiResponse<Performer>>(`/performers/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/performers/${id}`);
  },
  review: async (id: number, status: string, notes?: string): Promise<Performer> => {
    const response = await client.post<ApiResponse<Performer>>(`/performers/${id}/review`, { status, notes });
    return response.data.data;
  },
  notify: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await client.post<ApiResponse<{ success: boolean; message: string }>>(`/performers/${id}/notify`);
    return response.data.data;
  },
};

// Venues
export const venuesApi = {
  getAll: async (filters?: { festival_id?: number; venue_type?: string; status?: string }): Promise<Venue[]> => {
    const response = await client.get<PaginatedResponse<Venue>>('/venues', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Venue> => {
    const response = await client.get<ApiResponse<Venue>>(`/venues/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Venue>): Promise<Venue> => {
    const response = await client.post<ApiResponse<Venue>>('/venues', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Venue>): Promise<Venue> => {
    const response = await client.put<ApiResponse<Venue>>(`/venues/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/venues/${id}`);
  },
};

// Voting
export const votingApi = {
  getConfig: async (showSlug: string): Promise<VotingConfig> => {
    const response = await client.get<ApiResponse<VotingConfig>>(`/voting/config/${showSlug}`);
    return response.data.data;
  },
  saveConfig: async (showSlug: string, config: Partial<VotingConfig>): Promise<void> => {
    await client.put(`/voting/config/${showSlug}`, config);
  },
  getResults: async (showSlug: string): Promise<VoteResult[]> => {
    const response = await client.get<ApiResponse<VoteResult[]>>(`/voting/results/${showSlug}`);
    return response.data.data;
  },
  getLogs: async (showSlug?: string): Promise<VoteLog[]> => {
    const response = await client.get<ApiResponse<VoteLog[]>>('/voting/logs', {
      params: showSlug ? { show_slug: showSlug } : undefined,
    });
    return response.data.data;
  },
  calculateFinals: async (showSlug: string): Promise<VoteResult[]> => {
    const response = await client.post<ApiResponse<VoteResult[]>>('/voting/calculate-finals', { show_slug: showSlug });
    return response.data.data;
  },
};

// Volunteers
export const volunteersApi = {
  getAll: async (filters?: VolunteerFilters): Promise<Volunteer[]> => {
    const response = await client.get<PaginatedResponse<Volunteer>>('/volunteers', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Volunteer> => {
    const response = await client.get<ApiResponse<Volunteer>>(`/volunteers/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Volunteer>): Promise<Volunteer> => {
    const response = await client.post<ApiResponse<Volunteer>>('/volunteers', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Volunteer>): Promise<Volunteer> => {
    const response = await client.put<ApiResponse<Volunteer>>(`/volunteers/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/volunteers/${id}`);
  },
  getShifts: async (filters?: { festival_id?: number; status?: string }): Promise<VolunteerShift[]> => {
    const response = await client.get<ApiResponse<VolunteerShift[]>>('/volunteers/shifts', { params: filters });
    return response.data.data;
  },
  createShift: async (data: Partial<VolunteerShift>): Promise<{ id: number }> => {
    const response = await client.post<ApiResponse<{ id: number }>>('/volunteers/shifts', data);
    return response.data.data;
  },
};

// Vendors
export const vendorsApi = {
  getAll: async (filters?: VendorFilters): Promise<Vendor[]> => {
    const response = await client.get<PaginatedResponse<Vendor>>('/vendors', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Vendor> => {
    const response = await client.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Vendor>): Promise<Vendor> => {
    const response = await client.post<ApiResponse<Vendor>>('/vendors', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
    const response = await client.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/vendors/${id}`);
  },
};

// Sponsors
export const sponsorsApi = {
  getAll: async (filters?: SponsorFilters): Promise<Sponsor[]> => {
    const response = await client.get<PaginatedResponse<Sponsor>>('/sponsors', { params: filters });
    return response.data.data;
  },
  getById: async (id: number): Promise<Sponsor> => {
    const response = await client.get<ApiResponse<Sponsor>>(`/sponsors/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Sponsor>): Promise<Sponsor> => {
    const response = await client.post<ApiResponse<Sponsor>>('/sponsors', data);
    return response.data.data;
  },
  update: async (id: number, data: Partial<Sponsor>): Promise<Sponsor> => {
    const response = await client.put<ApiResponse<Sponsor>>(`/sponsors/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/sponsors/${id}`);
  },
};

// Transactions
export const transactionsApi = {
  getAll: async (filters?: { festival_id?: number; transaction_type?: string; category?: string }): Promise<Transaction[]> => {
    const response = await client.get<ApiResponse<Transaction[]>>('/transactions', { params: filters });
    return response.data.data;
  },
  create: async (data: Partial<Transaction>): Promise<{ id: number }> => {
    const response = await client.post<ApiResponse<{ id: number }>>('/transactions', data);
    return response.data.data;
  },
  getSummary: async (festivalId?: number): Promise<{
    total_income: number;
    total_expenses: number;
    net: number;
    by_category: { income: Record<string, number>; expense: Record<string, number> };
  }> => {
    const response = await client.get('/transactions/summary', {
      params: festivalId ? { festival_id: festivalId } : undefined,
    });
    return response.data.data;
  },
};

// Settings
export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await client.get<ApiResponse<Settings>>('/settings');
    return response.data.data;
  },
  update: async (data: Partial<Settings>): Promise<void> => {
    await client.put('/settings', data);
  },
};

// Eventbrite
export const eventbriteApi = {
  test: async (): Promise<{ success: boolean; organizations?: unknown[]; error?: string }> => {
    const response = await client.get('/eventbrite/test');
    return response.data;
  },
  sync: async (festivalId?: number): Promise<{ synced: number; total: number; errors: string[] }> => {
    const response = await client.post('/eventbrite/sync', festivalId ? { festival_id: festivalId } : undefined);
    return response.data.data;
  },
};

// Mailchimp
interface MailchimpList {
  id: string;
  name: string;
  member_count: number;
}

interface MailchimpSyncResult {
  success: boolean;
  message?: string;
  synced?: number;
  new_members?: number;
  updated_members?: number;
  error_count?: number;
  error?: string;
}

export const mailchimpApi = {
  test: async (): Promise<{ success: boolean; message?: string; health_status?: string; error?: string }> => {
    const response = await client.get('/mailchimp/test');
    return response.data;
  },
  getLists: async (): Promise<{ success: boolean; data?: MailchimpList[]; error?: string }> => {
    const response = await client.get('/mailchimp/lists');
    return response.data;
  },
  syncPerformers: async (festivalId?: number): Promise<MailchimpSyncResult> => {
    const response = await client.post('/mailchimp/sync/performers', festivalId ? { festival_id: festivalId } : undefined);
    return response.data;
  },
  syncVolunteers: async (festivalId?: number): Promise<MailchimpSyncResult> => {
    const response = await client.post('/mailchimp/sync/volunteers', festivalId ? { festival_id: festivalId } : undefined);
    return response.data;
  },
  syncAttendees: async (festivalId?: number): Promise<MailchimpSyncResult> => {
    const response = await client.post('/mailchimp/sync/attendees', festivalId ? { festival_id: festivalId } : undefined);
    return response.data;
  },
  syncAll: async (festivalId?: number): Promise<{
    success: boolean;
    total_synced: number;
    results: {
      performers: MailchimpSyncResult;
      volunteers: MailchimpSyncResult;
      attendees: MailchimpSyncResult;
    };
    errors: string[];
  }> => {
    const response = await client.post('/mailchimp/sync/all', festivalId ? { festival_id: festivalId } : undefined);
    return response.data;
  },
};

// Reports
export interface TicketSalesData {
  over_time: Array<{ period: string; ticket_count: number; total_quantity: number; total_revenue: number }>;
  by_show: Array<{ id: number; title: string; show_date: string; ticket_count: number; total_quantity: number; total_revenue: number; checked_in: number }>;
}

export interface RevenueData {
  by_category: Array<{ category: string; transaction_type: string; total: number }>;
  over_time: Array<{ date: string; income: number; expense: number }>;
  summary: { total_income: number; total_expenses: number; net: number };
}

export interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  user_name: string;
  details: string;
  created_at: string;
}

export const reportsApi = {
  getOverview: async (festivalId?: number): Promise<{ stats: DashboardStats; recent_activity: ActivityLog[] }> => {
    const response = await client.get<ApiResponse<{ stats: DashboardStats; recent_activity: ActivityLog[] }>>('/reports/overview', {
      params: festivalId ? { festival_id: festivalId } : undefined,
    });
    return response.data.data;
  },
  getTicketSales: async (festivalId?: number, period?: 'daily' | 'weekly' | 'monthly'): Promise<TicketSalesData> => {
    const response = await client.get<ApiResponse<TicketSalesData>>('/reports/ticket-sales', {
      params: { festival_id: festivalId, period },
    });
    return response.data.data;
  },
  getRevenue: async (festivalId?: number): Promise<RevenueData> => {
    const response = await client.get<ApiResponse<RevenueData>>('/reports/revenue', {
      params: festivalId ? { festival_id: festivalId } : undefined,
    });
    return response.data.data;
  },
  getActivity: async (festivalId?: number, limit?: number): Promise<ActivityLog[]> => {
    const response = await client.get<ApiResponse<ActivityLog[]>>('/reports/activity', {
      params: { festival_id: festivalId, limit },
    });
    return response.data.data;
  },
  exportData: async (type: 'performers' | 'volunteers' | 'attendees' | 'transactions' | 'tickets', festivalId?: number): Promise<{ filename: string; content: string; mime_type: string }> => {
    const response = await client.get<ApiResponse<{ filename: string; content: string; mime_type: string }>>(`/reports/export/${type}`, {
      params: { festival_id: festivalId, format: 'csv' },
    });
    return response.data.data;
  },
};
