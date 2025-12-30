# Peanut Festival - Shortcode Reference

This document covers all available shortcodes for displaying festival content on your WordPress site.

## Table of Contents

1. [General Usage](#general-usage)
2. [Voting Widget](#voting-widget)
3. [Schedule Display](#schedule-display)
4. [Performer Application](#performer-application)
5. [Volunteer Signup](#volunteer-signup)
6. [Vendor Application](#vendor-application)
7. [Flyer Generator](#flyer-generator)
8. [Styling & Customization](#styling--customization)

---

## General Usage

### Festival Selection

All shortcodes accept a `festival` attribute to specify which festival to display:

```
[pf_voting festival="summer-comedy-fest-2025"]
```

If no festival is specified, the plugin uses the **Active Festival** set in Settings.

### Finding Festival Slugs

1. Go to **Festival > Festivals** in admin
2. The slug is shown in the URL column
3. Or edit a festival and look at the **Slug** field

---

## Voting Widget

Display a public voting interface for audience choice awards.

### Basic Usage

```
[pf_voting]
```

### With Festival Specified

```
[pf_voting festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Features

- Displays performer cards with photos and names
- Users select their favorites (configurable limit)
- Vote submission with email capture
- Timer showing voting end date
- Success/thank you message after voting

### Requirements

- Voting must be enabled in festival settings
- Current time must be within voting window
- Performers must be assigned to the festival

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-voting-widget` | Main container |
| `.pf-voting-header` | Header section with title |
| `.pf-performer-grid` | Grid of performer cards |
| `.pf-performer-card` | Individual performer card |
| `.pf-performer-card.selected` | Selected state |
| `.pf-voting-footer` | Footer with submit button |

---

## Schedule Display

Display the festival schedule/lineup with filtering options.

### Basic Usage

```
[pf_schedule]
```

### With Festival Specified

```
[pf_schedule festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Features

- Shows all published shows grouped by date
- Filter by date (day buttons)
- Filter by venue (dropdown)
- Show cards with time, venue, and performers
- Links to ticket purchase if configured

### Display Information

Each show displays:
- Show title
- Date and time
- Venue name
- Assigned performers
- Brief description

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-schedule-widget` | Main container |
| `.pf-schedule-filters` | Filter controls |
| `.pf-date-filters` | Date filter buttons |
| `.pf-date-btn` | Individual date button |
| `.pf-date-btn.active` | Active date filter |
| `.pf-schedule-content` | Shows container |
| `.pf-show-group` | Shows grouped by date |
| `.pf-show-card` | Individual show card |

---

## Performer Application

Display a form for performers to apply to your festival.

### Basic Usage

```
[pf_apply_performer]
```

### With Festival Specified

```
[pf_apply_performer festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name / Act Name | Yes | Stage name |
| Email | Yes | Contact email |
| Phone | No | Phone number |
| Website | No | Personal/portfolio website |
| Performance Type | No | Comedy style (standup, improv, etc.) |
| Bio / Description | Yes | About the performer |
| Technical Requirements | No | Mic, lighting needs |
| Instagram | No | Instagram handle |
| TikTok | No | TikTok handle |
| YouTube | No | YouTube channel URL |
| Twitter/X | No | Twitter handle |

### Success Behavior

After successful submission:
- Form is hidden
- Success message is displayed
- Application appears in admin under Performers > Applications

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-performer-application` | Main container |
| `.pf-form` | Form element |
| `.pf-form-section` | Grouped fields section |
| `.pf-form-group` | Individual field wrapper |
| `.pf-form-row` | Two-column row |
| `.pf-form-success` | Success message container |

---

## Volunteer Signup

Display a volunteer signup form with available shifts.

### Basic Usage

```
[pf_volunteer]
```

### With Festival Specified

```
[pf_volunteer festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Full Name | Yes | Volunteer's name |
| Email | Yes | Contact email |
| Phone | No | Phone number |
| T-Shirt Size | No | For volunteer shirts |
| Emergency Contact Name | No | Emergency contact |
| Emergency Contact Phone | No | Emergency phone |
| Skills | No | Checkbox selection |
| Dietary Restrictions | No | Food allergies/needs |
| Shift Preferences | No | Available shifts |

### Skills Options

The form includes checkboxes for:
- Hospitality / Customer Service
- Tech / AV Equipment
- Photography / Video
- Social Media
- Has Valid Driver's License
- Setup / Breakdown
- Box Office / Will Call
- Green Room / Performer Support

### Shift Display

Shifts are loaded dynamically from the database and display:
- Task name
- Date and time
- Location
- Available spots remaining

Full shifts are shown but disabled.

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-volunteer-signup` | Main container |
| `.pf-checkbox-grid` | Skills checkbox grid |
| `.pf-checkbox-label` | Checkbox label wrapper |
| `.pf-shift-day` | Group of shifts by date |
| `.pf-shift-list` | List of shifts |
| `.pf-shift-option` | Individual shift checkbox |
| `.pf-shift-option.pf-shift-full` | Full shift (disabled) |

---

## Vendor Application

Display a vendor booth application form.

### Basic Usage

```
[pf_vendor_apply]
```

### With Festival Specified

```
[pf_vendor_apply festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Business Name | Yes | Company/business name |
| Contact Name | No | Primary contact person |
| Email | Yes | Contact email |
| Phone | No | Phone number |
| Vendor Type | Yes | Category selection |
| Business Description | No | About the business |
| Products / Services | Yes | What they'll sell |
| Booth Requirements | No | Setup needs |
| Electricity Needed | No | Checkbox |

### Vendor Types

- Food & Beverage
- Merchandise / Retail
- Service Provider
- Sponsor / Promotional
- Other

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-vendor-application` | Main container |
| `.pf-form-notice` | Notice/disclaimer section |
| `.pf-checkbox-single` | Single checkbox wrapper |

---

## Flyer Generator

Display an interactive canvas-based flyer generator.

### Basic Usage

```
[pf_flyer]
```

### With Festival Specified

```
[pf_flyer festival="your-festival-slug"]
```

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `festival` | Active festival | Festival slug |

### Features

- Upload personal photo
- Photo manipulation:
  - Zoom in/out (slider)
  - Rotate (slider)
  - Drag to position
- Template overlaid on photo
- Name input (displayed on flyer)
- Download as PNG

### User Flow

1. User uploads their photo
2. Photo appears in canvas with template overlay
3. User adjusts position, zoom, rotation
4. User enters their name
5. User clicks download to save PNG

### Canvas Controls

| Control | Description |
|---------|-------------|
| Zoom slider | 0.5x to 2x |
| Rotation slider | -180 to +180 degrees |
| Drag on canvas | Reposition image |
| Name input | Text overlay |
| Download button | Save as PNG |

### Styling Classes

| Class | Description |
|-------|-------------|
| `.pf-flyer-widget` | Main container |
| `.pf-flyer-canvas-wrap` | Canvas wrapper |
| `.pf-flyer-canvas` | The canvas element |
| `.pf-flyer-controls` | Control panel |
| `.pf-flyer-upload` | Upload input wrapper |
| `.pf-control-group` | Slider/input group |
| `.pf-flyer-actions` | Download button area |

---

## Styling & Customization

### CSS Custom Properties

The plugin uses CSS custom properties for easy theming:

```css
:root {
  --pf-primary: #e91e63;
  --pf-primary-dark: #c2185b;
  --pf-secondary: #673ab7;
  --pf-success: #4caf50;
  --pf-error: #f44336;
  --pf-warning: #ff9800;
  --pf-text: #333333;
  --pf-text-light: #666666;
  --pf-border: #e0e0e0;
  --pf-bg: #ffffff;
  --pf-bg-light: #f5f5f5;
  --pf-radius: 8px;
  --pf-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### Overriding Styles

Add custom CSS to your theme or via Customizer:

```css
/* Change primary color */
.pf-form-widget {
  --pf-primary: #ff5722;
  --pf-primary-dark: #e64a19;
}

/* Customize form inputs */
.pf-input,
.pf-select,
.pf-textarea {
  border-radius: 0;
  border-width: 2px;
}

/* Larger performer cards */
.pf-performer-grid {
  grid-template-columns: repeat(3, 1fr);
}
```

### Common Customizations

**Full-width forms:**
```css
.pf-form-widget {
  max-width: 100%;
}
```

**Dark theme:**
```css
.pf-form-widget {
  --pf-bg: #1a1a1a;
  --pf-bg-light: #2d2d2d;
  --pf-text: #ffffff;
  --pf-text-light: #cccccc;
  --pf-border: #444444;
}
```

**Compact voting grid:**
```css
.pf-performer-grid {
  gap: 10px;
}
.pf-performer-card {
  padding: 10px;
}
.pf-performer-card img {
  width: 80px;
  height: 80px;
}
```

---

## JavaScript Events

The plugin fires custom events you can hook into:

```javascript
// After vote submitted
document.addEventListener('pf:vote:submitted', function(e) {
  console.log('Votes submitted:', e.detail.performers);
});

// After form submitted
document.addEventListener('pf:form:submitted', function(e) {
  console.log('Form type:', e.detail.type);
  console.log('Form data:', e.detail.data);
});

// Schedule filter changed
document.addEventListener('pf:schedule:filtered', function(e) {
  console.log('Filter:', e.detail.filter);
});
```

---

## Troubleshooting

### Widget Not Displaying

1. Check that the festival slug is correct
2. Verify the festival is published (not draft)
3. Check for JavaScript errors in browser console
4. Ensure assets are loading (check Network tab)

### Form Not Submitting

1. Check for validation errors
2. Verify REST API is accessible
3. Check browser console for AJAX errors
4. Ensure festival_id is being passed

### Styles Not Loading

1. Clear any caching plugins
2. Check that public CSS/JS are enqueued
3. Verify no CSS conflicts with theme

### Voting Issues

1. Confirm voting is enabled in festival settings
2. Check voting window dates
3. Verify performers are assigned to festival
4. Check vote limit hasn't been reached

---

## Examples

### Festival Landing Page

```html
<h1>Welcome to Summer Comedy Fest 2025!</h1>

<h2>Vote for Your Favorite Performer</h2>
[pf_voting festival="summer-comedy-fest-2025"]

<h2>Festival Schedule</h2>
[pf_schedule festival="summer-comedy-fest-2025"]
```

### Application Pages

**Performer application page:**
```html
<h1>Apply to Perform</h1>
<p>Think you've got what it takes? Apply below!</p>
[pf_apply_performer]
```

**Volunteer signup page:**
```html
<h1>Volunteer With Us</h1>
<p>Help make the festival a success!</p>
[pf_volunteer]
```

**Vendor application page:**
```html
<h1>Become a Vendor</h1>
<p>Interested in a booth at our festival?</p>
[pf_vendor_apply]
```

### Promotional Flyer Page

```html
<h1>Create Your Flyer</h1>
<p>Make a personalized promotional flyer!</p>
[pf_flyer]
```
