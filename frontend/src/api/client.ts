import axios from 'axios';

const getConfig = () => {
  if (typeof window !== 'undefined' && window.peanutFestival) {
    return window.peanutFestival;
  }
  // Fallback for development
  return {
    apiUrl: '/wp-json/peanut-festival/v1',
    adminApiUrl: '/wp-json/peanut-festival/v1/admin',
    nonce: '',
    version: '1.0.0',
    siteUrl: '',
    adminUrl: '',
    userId: 0,
    isAdmin: false,
  };
};

export const client = axios.create({
  baseURL: getConfig().adminApiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add nonce header
client.interceptors.request.use((config) => {
  const { nonce } = getConfig();
  if (nonce) {
    config.headers['X-WP-Nonce'] = nonce;
  }
  return config;
});

// Response interceptor - unwrap data
client.interceptors.response.use(
  (response) => {
    // If the response has our standard format, return it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response;
    }
    return response;
  },
  (error) => {
    // Extract error message from response
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(message));
  }
);

// Public API client (no admin prefix)
export const publicClient = axios.create({
  baseURL: getConfig().apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicClient.interceptors.request.use((config) => {
  const { nonce } = getConfig();
  if (nonce) {
    config.headers['X-WP-Nonce'] = nonce;
  }
  return config;
});

export { getConfig };
