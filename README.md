# peanut-festival
A complete WordPress plugin for managing community festivals.

  ## Features

  ### Admin Dashboard (React + TypeScript)
  - Festival management with multi-festival support
  - Shows, Performers, and Venues scheduling
  - Volunteer shift management with calendar view
  - Vendor and Sponsor applications
  - Voting administration with Borda count system
  - Box office with QR code check-in
  - Messaging system with broadcast emails
  - Analytics dashboard with financial overview
  - Reports with charts and CSV export
  - Flyer generator with customizable templates

  ### Public Shortcodes
  | Shortcode | Description |
  |-----------|-------------|
  | `[pf_vote]` | Audience voting widget |
  | `[pf_results]` | Voting results display |
  | `[pf_schedule]` | Event schedule with filters |
  | `[pf_performer_apply]` | Performer application form |
  | `[pf_volunteer_signup]` | Volunteer registration |
  | `[pf_vendor_apply]` | Vendor application form |
  | `[pf_checkin]` | QR code check-in for staff |

  ### Integrations
  - Stripe payment processing
  - Eventbrite event sync
  - Mailchimp audience sync

  ### Technical
  - 23 custom database tables with migrations
  - REST API (public + admin)
  - 147 automated tests
  - Object caching & background job queue

  ## Requirements
  - WordPress 6.0+ | PHP 8.1+ | MySQL 5.7+
