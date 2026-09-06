import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('pp360-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
