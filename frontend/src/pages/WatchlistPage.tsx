import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlistStore } from '@/stores/watchlistStore';
import type { WatchlistStatus } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';

type FilterTab = 'all' | WatchlistStatus;

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'want', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

const STATUS_OPTIONS = [
  { value: 'want', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

const STATUS_VARIANT: Record<WatchlistStatus, 'info' | 'warning' | 'success'> = {
  want: 'info',
  watching: 'warning',
  watched: 'success',
};

export default function WatchlistPage() {
  const { entries, isLoading, error, fetch, update, remove } = useWatchlistStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => { fetch(1, 100); }, [fetch]);

  const filtered = activeTab === 'all' ? entries : entries.filter((e) => e.status === activeTab);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Watchlist</h1>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <Alert type="error" message={error} />}
      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🎬</p>
          <p>No movies in this category.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 p-4">
              {/* Poster thumbnail */}
              {entry.movie?.posterUrl ? (
                <img
                  src={entry.movie.posterUrl}
                  alt={entry.movie.title}
                  className="w-12 h-16 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-16 rounded bg-gray-100 flex items-center justify-center shrink-0 text-xl">🎬</div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/movies/${entry.movieId}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {entry.movie?.title ?? 'Movie'}
                </Link>
                {entry.movie && (
                  <span className="text-xs text-gray-400">{entry.movie.genre} · {entry.movie.releaseYear}</span>
                )}
              </div>

              {/* Status badge */}
              <Badge variant={STATUS_VARIANT[entry.status]}>
                {STATUS_OPTIONS.find((o) => o.value === entry.status)?.label}
              </Badge>

              {/* Status change */}
              <div className="shrink-0 w-36">
                <Select
                  options={STATUS_OPTIONS}
                  value={entry.status}
                  onChange={(e) => update(entry.id, e.target.value as WatchlistStatus)}
                />
              </div>

              {/* Remove */}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 shrink-0"
                onClick={() => remove(entry.id)}
                aria-label="Remove"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
