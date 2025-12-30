# Changelog

All notable changes to the Peanut Festival plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-27

### Added

#### Core Plugin
- WordPress plugin architecture with activation/deactivation hooks
- Custom database schema with 23 tables
- Database migration system with version tracking
- REST API with public and admin endpoints
- Settings management with active festival selection

#### Admin Dashboard (React + TypeScript)
- Festival CRUD management
- Shows, Performers, Venues management
- Volunteer shift scheduling with calendar view
- Vendor and Sponsor management
- Voting administration with Borda count system
- Box office with QR code check-in
- Messaging system with broadcast emails
- Analytics dashboard with financial overview
- Reports page with charts and CSV export
- Flyer generator with customizable templates

#### Public Shortcodes
- `[pf_vote]` - Audience voting widget
- `[pf_results]` - Voting results display
- `[pf_schedule]` - Event schedule with filters
- `[pf_flyer]` - Interactive flyer generator
- `[pf_performer_apply]` - Performer application form
- `[pf_volunteer_signup]` - Volunteer registration
- `[pf_vendor_apply]` - Vendor application form
- `[pf_checkin]` - QR code check-in for staff

#### Integrations
- Stripe payment processing for tickets and vendor fees
- Eventbrite event synchronization
- Mailchimp audience sync and campaigns
- Email notifications system

#### Security & Performance
- SQL injection prevention with parameterized queries
- Input sanitization on all endpoints
- CSRF protection via WordPress nonces
- Rate limiting on public API endpoints
- Object caching with group-based invalidation
- Background job queue for async email processing
- Structured logging with sensitive data redaction

#### Quality
- PHPUnit test suite (75 tests)
- Vitest test suite (72 tests)
- OpenAPI 3.0 documentation for REST API
- PHPDoc documentation on core classes
- Mobile-responsive design
- Accessibility support (ARIA labels, keyboard navigation)

### Database Tables
- `pf_festivals` - Festival definitions
- `pf_shows` - Show/event scheduling
- `pf_venues` - Venue information
- `pf_performers` - Performer profiles
- `pf_show_performers` - Show-performer assignments
- `pf_volunteers` - Volunteer registrations
- `pf_shifts` - Volunteer shift definitions
- `pf_volunteer_shifts` - Volunteer-shift assignments
- `pf_vendors` - Vendor applications
- `pf_sponsors` - Sponsor information
- `pf_attendees` - Attendee records
- `pf_tickets` - Ticket purchases
- `pf_coupons` - Discount codes
- `pf_votes` - Individual votes
- `pf_voting_config` - Voting settings per festival
- `pf_messages` - Broadcast messages
- `pf_transactions` - Financial transactions
- `pf_check_ins` - QR code check-in events
- `pf_email_logs` - Email send history
- `pf_settings` - Plugin settings
- `pf_job_queue` - Background job queue

[1.0.0]: https://github.com/YOUR_USERNAME/peanut-festival/releases/tag/v1.0.0
