import { create } from 'zustand';
import { watchlistApi } from '@/api/client';
import type { WatchlistEntry, WatchlistStatus, PaginatedMeta } from '@/api/types';

interface WatchlistState {
  entries: WatchlistEntry[];
  meta: PaginatedMeta;
  isLoading: boolean;
  error: string | null;
  fetch: (page?: number, limit?: number) => Promise<void>;
  add: (movieId: string, status: WatchlistStatus) => Promise<void>;
  update: (id: string, status: WatchlistStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  entries: [],
  meta: { total: 0, page: 1, limit: 20 },
  isLoading: false,
  error: null,

  fetch: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const res = await watchlistApi.list({ page, limit });
      set({ entries: res.data, meta: res.meta, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load watchlist';
      set({ error: msg, isLoading: false });
    }
  },

  add: async (movieId, status) => {
    const res = await watchlistApi.add(movieId, status);
    set((state) => ({ entries: [res.data, ...state.entries] }));
  },

  update: async (id, status) => {
    const res = await watchlistApi.update(id, status);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? res.data : e)),
    }));
  },

  remove: async (id) => {
    await watchlistApi.remove(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      meta: { ...state.meta, total: state.meta.total - 1 },
    }));
  },

  clear: () => {
    // reset on logout
    const { meta } = get();
    set({ entries: [], meta: { ...meta, total: 0 }, error: null });
  },
}));
