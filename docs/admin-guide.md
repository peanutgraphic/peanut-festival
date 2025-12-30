# Peanut Festival - Admin Guide

This guide covers all administrative features of the Peanut Festival plugin.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Festival Management](#festival-management)
4. [Performers](#performers)
5. [Shows & Scheduling](#shows--scheduling)
6. [Venues](#venues)
7. [Tickets & Box Office](#tickets--box-office)
8. [Voting](#voting)
9. [Volunteers](#volunteers)
10. [Vendors](#vendors)
11. [Integrations](#integrations)
12. [Settings](#settings)

---

## Getting Started

### Initial Setup

After activating the plugin:

1. Navigate to **Festival > Settings**
2. Enter your organization name and details
3. Configure default settings for tickets, voting, etc.
4. Set up any integrations (Eventbrite, Mailchimp)

### Creating Your First Festival

1. Go to **Festival > Festivals**
2. Click **Add New Festival**
3. Fill in the festival details:
   - **Name**: The public name of your festival
   - **Slug**: URL-friendly identifier (auto-generated)
   - **Start/End Dates**: Festival date range
   - **Timezone**: Local timezone for scheduling
   - **Status**: Draft, Published, or Archived

---

## Dashboard

The main dashboard provides an overview of:

- **Upcoming Shows** - Next 5 scheduled performances
- **Recent Activity** - Latest actions across the platform
- **Quick Stats** - Ticket sales, volunteer signups, etc.
- **Alerts** - Issues needing attention (low ticket inventory, etc.)

### Dashboard Widgets

- **Festival Selector** - Switch between festivals to view their data
- **Calendar Preview** - Mini calendar of upcoming events
- **Recent Applications** - New performer/vendor applications

---

## Festival Management

### Festival List

The festivals list shows all festivals with:
- Name and dates
- Status (Draft/Published/Archived)
- Show count
- Quick actions (Edit, View, Duplicate)

### Festival Settings

Each festival has its own settings:

| Setting | Description |
|---------|-------------|
| **General** | Name, slug, dates, timezone |
| **Voting** | Enable voting, vote limits, voting period |
| **Tickets** | Default ticket types, pricing |
| **Applications** | Enable performer/vendor applications |
| **Display** | Colors, logo, custom CSS |

### Festival Status

- **Draft** - Not visible to public, still being configured
- **Published** - Active and visible, accepting tickets/votes
- **Archived** - Past festival, read-only for historical data

---

## Performers

### Adding Performers

1. Go to **Festival > Performers**
2. Click **Add New**
3. Fill in performer details:
   - **Name** - Stage name or act name
   - **Email** - Primary contact email
   - **Phone** - Contact number
   - **Bio** - Public biography
   - **Photo** - Headshot (used in schedule, voting)
   - **Performance Type** - Comedy, Improv, Music, etc.
   - **Technical Requirements** - Mic preferences, lighting, props

### Performer Applications

When applications are enabled:

1. Applications appear in **Festival > Performers > Applications**
2. Review application details
3. Actions: **Approve**, **Reject**, or **Request Info**
4. Approved performers are added to the performers list

### Performer Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | Text | Stage/act name |
| `email` | Email | Contact email |
| `phone` | Text | Phone number |
| `bio` | Textarea | Public bio/description |
| `photo_url` | URL | Headshot image |
| `website` | URL | Personal website |
| `social_instagram` | Text | Instagram handle |
| `social_tiktok` | Text | TikTok handle |
| `social_youtube` | URL | YouTube channel |
| `social_twitter` | Text | Twitter/X handle |
| `performance_type` | Select | Type of performance |
| `technical_requirements` | Textarea | Tech rider notes |
| `status` | Select | applied/approved/confirmed/cancelled |

---

## Shows & Scheduling

### Creating Shows

1. Go to **Festival > Shows**
2. Click **Add New Show**
3. Configure the show:
   - **Title** - Show name
   - **Festival** - Which festival this belongs to
   - **Venue** - Where it takes place
   - **Date/Time** - Start and end times
   - **Performers** - Assign performers to the show
   - **Ticket Type** - Free, Paid, or VIP-only

### Calendar View

The calendar view shows all shows visually:

- **Month/Week/Day** views
- Drag-and-drop to reschedule
- Color-coded by venue
- Click to edit show details

### Show Status

- **Draft** - Not published, won't appear in public schedule
- **Published** - Visible in public schedule
- **Cancelled** - Marked as cancelled (can notify ticket holders)
- **Completed** - Past show, archived

### Assigning Performers

1. Edit a show
2. In the **Performers** section, search and add performers
3. Set performer order (for multi-act shows)
4. Save changes

---

## Venues

### Managing Venues

1. Go to **Festival > Venues**
2. Add venues with:
   - **Name** - Venue name
   - **Address** - Full address
   - **Capacity** - Maximum attendance
   - **Description** - Public description
   - **Amenities** - Accessibility, parking, etc.
   - **Contact** - Venue contact info

### Venue Features

| Feature | Description |
|---------|-------------|
| **Capacity** | Used for ticket limits |
| **Map Link** | Google Maps URL |
| **Image** | Venue photo |
| **Notes** | Internal notes (not public) |

---

## Tickets & Box Office

### Ticket Types

Configure ticket types in **Festival > Settings > Tickets**:

- **General Admission** - Standard tickets
- **VIP** - Premium access
- **Student/Senior** - Discounted tiers
- **Comp** - Complimentary tickets

### Managing Attendees

1. Go to **Festival > Attendees**
2. View all ticket purchasers
3. Search by name, email, or confirmation number
4. Actions: Check-in, Resend confirmation, Refund

### Check-In

For day-of check-in:

1. Go to **Festival > Box Office**
2. Search for attendee
3. Click **Check In**
4. Optional: Scan QR code (requires camera access)

### Coupons

Create discount codes:

1. Go to **Festival > Coupons**
2. Click **Add New**
3. Configure:
   - **Code** - The coupon code
   - **Type** - Percentage or fixed amount
   - **Value** - Discount value
   - **Usage Limit** - Max uses (total or per-user)
   - **Expiry** - When the coupon expires

---

## Voting

### Voting Setup

1. Go to **Festival > Settings > Voting**
2. Configure voting options:
   - **Enable Voting** - Turn on/off
   - **Votes Per Person** - How many performers they can vote for
   - **Voting Start/End** - Voting window
   - **Require Email** - Email verification
   - **Show Results** - When to display results

### Vote Moderation

1. Go to **Festival > Voting**
2. View vote counts by performer
3. Flag suspicious activity
4. Export results

### Finals Management

For multi-round voting:

1. After initial voting, go to **Festival > Voting > Finals**
2. Select finalists (top N performers)
3. Start finals voting period
4. Announce winner

---

## Volunteers

### Volunteer Shifts

Create volunteer shifts:

1. Go to **Festival > Volunteers > Shifts**
2. Click **Add Shift**
3. Configure:
   - **Task Name** - What volunteers will do
   - **Date/Time** - Shift start and end
   - **Location** - Where to report
   - **Slots** - How many volunteers needed
   - **Description** - Detailed instructions

### Managing Signups

1. Go to **Festival > Volunteers**
2. View all volunteer signups
3. Assign volunteers to shifts
4. Send confirmation emails

### Volunteer Fields

| Field | Description |
|-------|-------------|
| `name` | Full name |
| `email` | Contact email |
| `phone` | Phone number |
| `skills` | Array of skill tags |
| `shirt_size` | T-shirt size |
| `dietary_restrictions` | Food allergies/preferences |
| `emergency_contact` | Emergency contact name |
| `emergency_phone` | Emergency contact phone |
| `shift_preferences` | Array of preferred shift IDs |

---

## Vendors

### Vendor Applications

1. Go to **Festival > Vendors**
2. View all vendor applications
3. Review details:
   - Business info
   - Products/services
   - Booth requirements
   - Electricity needs

### Application Status

- **Applied** - New application
- **Under Review** - Being evaluated
- **Approved** - Accepted, pending payment
- **Confirmed** - Fully confirmed vendor
- **Rejected** - Application denied
- **Waitlist** - On waitlist

### Vendor Communication

1. Select vendors
2. Click **Send Message**
3. Compose email (uses Mailchimp if configured)

---

## Integrations

### Eventbrite

Sync events and tickets with Eventbrite:

1. Go to **Festival > Settings > Integrations**
2. Enter your Eventbrite API key
3. Click **Connect**
4. Map festivals to Eventbrite events
5. Enable auto-sync for attendees

**Sync Options:**
- **Pull Attendees** - Import ticket buyers from Eventbrite
- **Push Events** - Create Eventbrite events from shows
- **Sync Frequency** - Real-time, hourly, or daily

### Mailchimp

Send newsletters and updates:

1. Go to **Festival > Settings > Integrations**
2. Enter your Mailchimp API key
3. Select your audience/list
4. Enable auto-subscribe for:
   - Ticket purchasers
   - Volunteers
   - Performer applicants

**Features:**
- **Segment by Festival** - Create segments for each festival
- **Tags** - Auto-tag by role (attendee, volunteer, performer)
- **Templates** - Use Mailchimp templates for emails

---

## Settings

### General Settings

| Setting | Description |
|---------|-------------|
| **Organization Name** | Your organization's name |
| **Default Festival** | Pre-selected festival for shortcodes |
| **Date Format** | How dates are displayed |
| **Time Format** | 12-hour or 24-hour |
| **Currency** | For ticket prices |

### Email Settings

| Setting | Description |
|---------|-------------|
| **From Name** | Sender name for emails |
| **From Email** | Sender email address |
| **Reply-To** | Reply-to address |
| **Email Templates** | Customize email content |

### Advanced Settings

| Setting | Description |
|---------|-------------|
| **Delete Data on Uninstall** | Remove all data when plugin is deleted |
| **Debug Mode** | Enable detailed logging |
| **API Access** | Enable/configure REST API |
| **Custom CSS** | Add custom styles |

---

## Troubleshooting

### Common Issues

**Voting not working:**
1. Check that voting is enabled in settings
2. Verify voting window dates
3. Check for JavaScript errors in browser console

**Eventbrite sync failing:**
1. Verify API key is valid
2. Check that events are published
3. Review sync logs in **Festival > Logs**

**Emails not sending:**
1. Check WordPress email settings
2. Verify Mailchimp connection
3. Check spam folders

### Getting Help

1. Check the error logs at **Festival > Logs**
2. Enable debug mode for detailed information
3. Contact Peanut Graphic support

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current item |
| `Ctrl + N` | New item |
| `Esc` | Close modal/dialog |
| `?` | Show help |

---

## Data Export

Export festival data:

1. Go to **Festival > Tools > Export**
2. Select data types to export
3. Choose format (CSV, JSON, or PDF)
4. Click **Download**

Available exports:
- Attendees list
- Volunteers list
- Performers list
- Show schedule
- Vote results
- Financial summary
