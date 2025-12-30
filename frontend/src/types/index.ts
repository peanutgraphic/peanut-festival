// Global window type extension
declare global {
  interface Window {
    peanutFestival: {
      apiUrl: string;
      adminApiUrl: string;
      nonce: string;
      version: string;
      siteUrl: string;
      adminUrl: string;
      userId: number;
      isAdmin: boolean;
    };
  }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
}

// Festival
export interface Festival {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: 'draft' | 'planning' | 'active' | 'completed' | 'archived';
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Show
export interface Show {
  id: number;
  festival_id: number;
  eventbrite_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  venue_id: number | null;
  venue_name?: string;
  venue_address?: string;
  show_date: string;
  start_time: string | null;
  end_time: string | null;
  capacity: number | null;
  ticket_price: number | null;
  status: 'draft' | 'scheduled' | 'on_sale' | 'sold_out' | 'completed' | 'cancelled';
  featured: boolean;
  kid_friendly: boolean;
  voting_config: VotingConfig | null;
  created_at: string;
  updated_at: string;
}

// Performer
export interface Performer {
  id: number;
  user_id: number | null;
  festival_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photo_url: string | null;
  website: string | null;
  social_links: SocialLinks | null;
  performance_type: string | null;
  technical_requirements: string | null;
  compensation: number | null;
  travel_covered: boolean;
  lodging_covered: boolean;
  application_status: PerformerStatus;
  application_date: string | null;
  review_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  notification_sent: boolean;
  rating_internal: number | null;
  pros: string | null;
  cons: string | null;
  created_at: string;
  updated_at: string;
}

export type PerformerStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'
  | 'confirmed'
  | 'cancelled';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

// Venue
export interface Venue {
  id: number;
  festival_id: number | null;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  capacity: number | null;
  venue_type: 'theater' | 'bar' | 'gallery' | 'outdoor' | 'restaurant' | 'other';
  amenities: string[] | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  rental_cost: number | null;
  revenue_share: number | null;
  tech_specs: string | null;
  pros: string | null;
  cons: string | null;
  rating_internal: number | null;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// Voting
export interface VotingConfig {
  groups: Record<string, number[]>;
  pool: number[];
  active_group: string;
  timer_start: string | null;
  timer_duration: number;
  num_groups: number;
  top_per_group: number;
  weight_first: number;
  weight_second: number;
  weight_third: number;
  hide_bios: boolean;
  reveal_results: boolean;
}

export interface VoteResult {
  performer_id: number;
  performer_name: string;
  photo_url: string | null;
  group_name: string;
  first_place: number;
  second_place: number;
  third_place: number;
  total_votes: number;
  weighted_score: number;
}

export interface VoteLog {
  id: number;
  show_slug: string;
  group_name: string;
  performer_id: number;
  performer_name: string;
  vote_rank: number;
  ip_hash: string;
  token: string;
  voted_at: string;
}

// Volunteer
export interface Volunteer {
  id: number;
  user_id: number | null;
  festival_id: number;
  name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  skills: string[] | null;
  availability: Record<string, boolean> | null;
  shirt_size: string | null;
  dietary_restrictions: string | null;
  status: 'applied' | 'approved' | 'active' | 'inactive' | 'declined';
  notes: string | null;
  hours_completed: number;
  created_at: string;
  updated_at: string;
}

export interface VolunteerShift {
  id: number;
  festival_id: number;
  task_name: string;
  description: string | null;
  location: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  slots_total: number;
  slots_filled: number;
  status: 'open' | 'filled' | 'completed' | 'cancelled';
}

// Vendor
export interface Vendor {
  id: number;
  festival_id: number;
  user_id: number | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  vendor_type: 'food' | 'merchandise' | 'service' | 'sponsor' | 'other';
  description: string | null;
  products: string | null;
  booth_requirements: string | null;
  electricity_needed: boolean;
  booth_fee: number | null;
  fee_paid: boolean;
  booth_location: string | null;
  insurance_verified: boolean;
  license_verified: boolean;
  status: 'applied' | 'approved' | 'active' | 'declined' | 'cancelled';
  rating_internal: number | null;
  pros: string | null;
  cons: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Sponsor
export interface Sponsor {
  id: number;
  festival_id: number;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  tier: 'presenting' | 'gold' | 'silver' | 'bronze' | 'in_kind' | 'media';
  sponsorship_amount: number | null;
  in_kind_value: number | null;
  in_kind_description: string | null;
  benefits: string[] | null;
  logo_url: string | null;
  website: string | null;
  social_links: SocialLinks | null;
  contract_signed: boolean;
  payment_received: boolean;
  status: 'prospect' | 'negotiating' | 'confirmed' | 'declined' | 'past';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Transaction
export interface Transaction {
  id: number;
  festival_id: number;
  transaction_type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: number | null;
  payment_method: string | null;
  transaction_date: string;
  recorded_by: number | null;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  shows: {
    total: number;
    completed: number;
    scheduled: number;
    on_sale: number;
    sold_out: number;
  };
  performers: Record<PerformerStatus, number>;
  volunteers: {
    total_volunteers: number;
    active_volunteers: number;
    total_hours: number;
    total_shifts: number;
    total_slots: number;
    filled_slots: number;
  };
  tickets: {
    total_tickets: number;
    total_quantity: number;
    total_revenue: number;
    checked_in: number;
  };
  financials: {
    total_income: number;
    total_expenses: number;
    net: number;
    by_category: {
      income: Record<string, number>;
      expense: Record<string, number>;
    };
  };
}

// Settings
export interface Settings {
  active_festival_id: number | null;
  eventbrite_token: string;
  eventbrite_org_id: string;
  mailchimp_api_key: string;
  mailchimp_list_id: string;
  voting_weight_first: number;
  voting_weight_second: number;
  voting_weight_third: number;
  notification_email: string;
}

// Flyer Generator Types
export interface FlyerFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FlyerNameBox {
  x: number;
  y: number;
  w: number;
  size: number;
  color: string;
  stroke: string;
  stroke_w: number;
  align: 'left' | 'center' | 'right';
}

export interface FlyerTemplate {
  id: number;
  festival_id: number | null;
  name: string;
  slug: string;
  template_url: string;
  mask_url: string | null;
  frame: FlyerFrame;
  namebox: FlyerNameBox;
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlyerUsageLog {
  id: number;
  template_id: number | null;
  template_name?: string;
  performer_name: string;
  image_url: string | null;
  thumb_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
}

// Attendee Types
export interface Attendee {
  id: number;
  festival_id: number;
  eventbrite_attendee_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  festival_id: number;
  attendee_id: number;
  show_id: number | null;
  eventbrite_ticket_id: string | null;
  ticket_type: string | null;
  quantity: number;
  price: number;
  checked_in: boolean;
  checked_in_at: string | null;
  // Joined fields
  show_title?: string;
  show_date?: string;
  start_time?: string;
  venue_id?: number;
  created_at: string;
}

export interface Coupon {
  id: number;
  festival_id: number;
  vendor_id: number | null;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  valid_from: string | null;
  valid_until: string | null;
  status: 'active' | 'expired' | 'disabled';
  created_at: string;
}

// Messaging Types
export interface Conversation {
  conversation_id: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: number;
  festival_id: number;
  conversation_id: string;
  sender_id: number;
  sender_type: 'admin' | 'performer' | 'volunteer' | 'vendor';
  recipient_id: number | null;
  recipient_type: 'admin' | 'performer' | 'volunteer' | 'vendor' | 'group';
  subject: string | null;
  content: string;
  is_read: boolean;
  is_broadcast: boolean;
  broadcast_group: string | null;
  created_at: string;
}

// Filter types
export interface PerformerFilters {
  festival_id?: number;
  application_status?: PerformerStatus;
  search?: string;
  performance_type?: string;
}

export interface ShowFilters {
  festival_id?: number;
  venue_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface VolunteerFilters {
  festival_id?: number;
  status?: string;
  search?: string;
}

export interface VendorFilters {
  festival_id?: number;
  vendor_type?: string;
  status?: string;
  search?: string;
}

export interface SponsorFilters {
  festival_id?: number;
  tier?: string;
  status?: string;
}

export {};
