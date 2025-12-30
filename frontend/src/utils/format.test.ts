import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  formatPhoneNumber,
  slugify,
  truncate,
  pluralize,
  capitalize,
  formatPercentage,
} from './format';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(25.99)).toBe('$25.99');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
});

describe('formatDate', () => {
  it('formats date strings', () => {
    // Use a full ISO string with time to avoid timezone issues
    const result = formatDate('2025-06-15T12:00:00');
    expect(result).toContain('2025');
    expect(result).toMatch(/Jun|June/);
  });

  it('formats Date objects', () => {
    const date = new Date(2025, 5, 15); // June 15, 2025 (month is 0-indexed)
    const result = formatDate(date);
    expect(result).toContain('2025');
    expect(result).toContain('15');
  });

  it('handles invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });

  it('uses custom options', () => {
    const result = formatDate('2025-06-15', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    expect(result).toContain('June');
    expect(result).toContain('2025');
  });
});

describe('formatTime', () => {
  it('formats time correctly', () => {
    const result = formatTime('2025-06-15T19:30:00');
    expect(result).toMatch(/7:30\s*PM/i);
  });

  it('handles invalid dates', () => {
    expect(formatTime('invalid')).toBe('Invalid time');
  });
});

describe('formatDateTime', () => {
  it('combines date and time', () => {
    const result = formatDateTime('2025-06-15T19:30:00');
    expect(result).toContain('2025');
    expect(result).toMatch(/PM/i);
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit US phone numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit US phone numbers with country code', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('strips non-numeric characters before formatting', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
  });

  it('returns original for non-standard formats', () => {
    expect(formatPhoneNumber('123')).toBe('123');
  });
});

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('my festival event')).toBe('my-festival-event');
  });

  it('removes special characters', () => {
    expect(slugify('Festival 2025!')).toBe('festival-2025');
  });

  it('handles multiple spaces and hyphens', () => {
    expect(slugify('hello   world--test')).toBe('hello-world-test');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });
});

describe('truncate', () => {
  it('returns original if within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('pluralize', () => {
  it('returns singular for count of 1', () => {
    expect(pluralize(1, 'ticket')).toBe('1 ticket');
  });

  it('returns plural for count > 1', () => {
    expect(pluralize(5, 'ticket')).toBe('5 tickets');
  });

  it('returns plural for count of 0', () => {
    expect(pluralize(0, 'ticket')).toBe('0 tickets');
  });

  it('uses custom plural form', () => {
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.75)).toBe('75%');
    expect(formatPercentage(1)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('handles decimal precision', () => {
    expect(formatPercentage(0.756, 1)).toBe('75.6%');
    expect(formatPercentage(0.7567, 2)).toBe('75.67%');
  });
});
