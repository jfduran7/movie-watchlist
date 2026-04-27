import createClient from 'openapi-fetch';
import type { paths } from '@/api/schema';
import type {
  Movie,
  Review,
  WatchlistEntry,
  WatchlistStatus,
  Profile,
  ApiResponse,
  PaginatedApiResponse,
} from '@/api/types';

const BASE_URL = import.meta.env.VITE_API_URL as string;

function getToken(): string | null {
  return localStorage.getItem('token');
}

function buildClient() {
  return createClient<paths>({
    baseUrl: BASE_URL,
    headers: {},
  });
}

async function authedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

const rawClient = buildClient();
// Use a typed client for request body inference only; responses fetched via authedFetch
export const typedClient = rawClient;

// Helpers to call the backend and unwrap the response envelope

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await authedFetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? 'Request failed'), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw Object.assign(new Error(errBody.message ?? 'Request failed'), { status: res.status, body: errBody });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw Object.assign(new Error(errBody.message ?? 'Request failed'), { status: res.status, body: errBody });
  }
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await authedFetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw Object.assign(new Error(errBody.message ?? 'Request failed'), { status: res.status, body: errBody });
  }
}

// --- Auth ---
export const authApi = {
  register: (name: string, email: string, password: string) =>
    post<ApiResponse<{ accessToken: string }>>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    post<ApiResponse<{ accessToken: string }>>('/auth/login', { email, password }),
};

// --- Movies ---
export const moviesApi = {
  list: (params?: { genre?: string; page?: number; limit?: number }) =>
    get<PaginatedApiResponse<Movie>>('/movies', params),

  getById: (id: string) =>
    get<ApiResponse<Movie>>(`/movies/${id}`),

  getReviews: (id: string) =>
    get<ApiResponse<Review[]>>(`/movies/${id}/reviews`),
};

// --- Watchlist ---
export const watchlistApi = {
  list: (params?: { page?: number; limit?: number }) =>
    get<PaginatedApiResponse<WatchlistEntry>>('/watchlist', params),

  add: (movieId: string, status: WatchlistStatus) =>
    post<ApiResponse<WatchlistEntry>>('/watchlist', { movieId, status }),

  update: (id: string, status: WatchlistStatus) =>
    patch<ApiResponse<WatchlistEntry>>(`/watchlist/${id}`, { status }),

  remove: (id: string) =>
    del(`/watchlist/${id}`),
};

// --- Reviews ---
export const reviewsApi = {
  create: (movieId: string, rating: number, comment?: string) =>
    post<ApiResponse<Review>>('/reviews', { movieId, rating, comment }),

  update: (id: string, data: { rating?: number; comment?: string }) =>
    patch<ApiResponse<Review>>(`/reviews/${id}`, data),

  remove: (id: string) =>
    del(`/reviews/${id}`),
};

// --- Profile ---
export const profileApi = {
  getMe: () =>
    get<ApiResponse<Profile>>('/profile/me'),
};
