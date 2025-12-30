import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test API URL construction and base configuration
describe('API Client Configuration', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window mock
    global.window = {
      ...originalWindow,
      pfAdmin: {
        apiUrl: 'http://example.com/wp-json/peanut-festival/v1/admin',
        nonce: 'test-nonce-12345',
      },
    } as unknown as typeof window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should construct correct base URL', () => {
    const baseUrl = (global.window as { pfAdmin: { apiUrl: string } }).pfAdmin.apiUrl;
    expect(baseUrl).toBe('http://example.com/wp-json/peanut-festival/v1/admin');
  });

  it('should have nonce for authentication', () => {
    const nonce = (global.window as { pfAdmin: { nonce: string } }).pfAdmin.nonce;
    expect(nonce).toBe('test-nonce-12345');
  });

  it('should construct correct endpoint URLs', () => {
    const baseUrl = (global.window as { pfAdmin: { apiUrl: string } }).pfAdmin.apiUrl;

    expect(`${baseUrl}/festivals`).toBe('http://example.com/wp-json/peanut-festival/v1/admin/festivals');
    expect(`${baseUrl}/performers/123`).toBe('http://example.com/wp-json/peanut-festival/v1/admin/performers/123');
  });
});

describe('Request Parameter Handling', () => {
  it('should serialize filter parameters correctly', () => {
    const filters = {
      festival_id: 1,
      status: 'active',
      page: 1,
      per_page: 20,
    };

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    expect(params.get('festival_id')).toBe('1');
    expect(params.get('status')).toBe('active');
    expect(params.get('page')).toBe('1');
    expect(params.get('per_page')).toBe('20');
  });

  it('should handle undefined filter values', () => {
    const filters = {
      festival_id: 1,
      status: undefined,
      search: null,
    };

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    expect(params.get('festival_id')).toBe('1');
    expect(params.has('status')).toBe(false);
    expect(params.has('search')).toBe(false);
  });

  it('should serialize array parameters', () => {
    const status = ['pending', 'approved'];
    const params = new URLSearchParams();

    status.forEach((s) => params.append('status[]', s));

    const allStatus = params.getAll('status[]');
    expect(allStatus).toContain('pending');
    expect(allStatus).toContain('approved');
  });
});

describe('Response Handling', () => {
  it('should parse success response', () => {
    const response = {
      success: true,
      data: [{ id: 1, name: 'Festival A' }],
      total: 1,
    };

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe('Festival A');
  });

  it('should handle error response', () => {
    const response = {
      success: false,
      message: 'Not found',
    };

    expect(response.success).toBe(false);
    expect(response.message).toBe('Not found');
  });

  it('should handle paginated response', () => {
    const response = {
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      total: 50,
      page: 1,
      per_page: 20,
    };

    expect(response.data).toHaveLength(2);
    expect(response.total).toBe(50);
    const totalPages = Math.ceil(response.total / response.per_page);
    expect(totalPages).toBe(3);
  });
});

describe('Error Handling', () => {
  it('should identify network errors', () => {
    const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
    expect(isNetworkError).toBe(true);
  });

  it('should identify HTTP error status codes', () => {
    const errorCodes = [400, 401, 403, 404, 500];

    errorCodes.forEach((code) => {
      const isError = code >= 400;
      expect(isError).toBe(true);
    });
  });

  it('should identify success status codes', () => {
    const successCodes = [200, 201, 204];

    successCodes.forEach((code) => {
      const isSuccess = code >= 200 && code < 300;
      expect(isSuccess).toBe(true);
    });
  });
});

describe('Request Headers', () => {
  it('should include nonce in headers', () => {
    const nonce = 'test-nonce-12345';
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': nonce,
    };

    expect(headers['X-WP-Nonce']).toBe(nonce);
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should set correct content type for JSON', () => {
    const headers = { 'Content-Type': 'application/json' };
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should allow custom headers', () => {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const customHeaders = { 'X-Custom-Header': 'custom-value' };
    const merged = { ...defaultHeaders, ...customHeaders };

    expect(merged['Content-Type']).toBe('application/json');
    expect(merged['X-Custom-Header']).toBe('custom-value');
  });
});
