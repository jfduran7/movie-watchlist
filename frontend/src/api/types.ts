export type WatchlistStatus = 'want' | 'watching' | 'watched';

export interface Movie {
  id: string;
  title: string;
  genre: string;
  releaseYear: number;
  description: string | null;
  posterUrl: string | null;
}

export interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  movieId: string;
  status: WatchlistStatus;
  createdAt: string;
  updatedAt: string;
  movie?: Movie;
}

export interface ProfileStats {
  totalWatched: number;
  averageRating: number | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  stats: ProfileStats;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginatedMeta;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
