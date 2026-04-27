import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Movie, WatchlistEntry, WatchlistStatus } from '@/api/types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';

interface MovieCardProps {
  movie: Movie;
  watchlistEntry?: WatchlistEntry;
  onAddToWatchlist?: (movieId: string, status: WatchlistStatus) => void;
  onUpdateStatus?: (entryId: string, status: WatchlistStatus) => void;
  onRemoveFromWatchlist?: (entryId: string) => void;
}

const statusBadgeVariant: Record<WatchlistStatus, 'info' | 'warning' | 'success'> = {
  want: 'info',
  watching: 'warning',
  watched: 'success',
};

const statusLabels: Record<WatchlistStatus, string> = {
  want: 'Want to Watch',
  watching: 'Watching',
  watched: 'Watched',
};

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  watchlistEntry,
  onAddToWatchlist,
  onUpdateStatus,
  onRemoveFromWatchlist,
}) => {
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WatchlistStatus>('want');

  const handleAddClick = () => {
    if (onAddToWatchlist) {
      setAddingToWatchlist(true);
      onAddToWatchlist(movie.id, selectedStatus);
      setAddingToWatchlist(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Poster */}
      <Link to={`/movies/${movie.id}`} className="block">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full aspect-[2/3] object-cover"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4">
        {/* Title */}
        <Link
          to={`/movies/${movie.id}`}
          className="block font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors"
        >
          {movie.title}
        </Link>

        {/* Genre Badge */}
        <div className="mt-2">
          <Badge variant="info">{movie.genre}</Badge>
        </div>

        {/* Year */}
        <p className="text-sm text-gray-500 mt-2">{movie.releaseYear}</p>

        {/* Watchlist Controls */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {watchlistEntry ? (
            // Existing entry: show status and controls
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={statusBadgeVariant[watchlistEntry.status]}>
                  {statusLabels[watchlistEntry.status]}
                </Badge>
                {onRemoveFromWatchlist && (
                  <button
                    onClick={() => onRemoveFromWatchlist(watchlistEntry.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    aria-label="Remove from watchlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {onUpdateStatus && (
                <Select
                  value={watchlistEntry.status}
                  onChange={(e) => onUpdateStatus(watchlistEntry.id, e.target.value as WatchlistStatus)}
                  options={[
                    { value: 'want', label: 'Want to Watch' },
                    { value: 'watching', label: 'Watching' },
                    { value: 'watched', label: 'Watched' },
                  ]}
                />
              )}
            </div>
          ) : (
            // No entry: show add to watchlist
            <div className="space-y-3">
              {onAddToWatchlist && (
                <>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as WatchlistStatus)}
                    options={[
                      { value: 'want', label: 'Want to Watch' },
                      { value: 'watching', label: 'Watching' },
                      { value: 'watched', label: 'Watched' },
                    ]}
                  />
                  <Button
                    onClick={handleAddClick}
                    isLoading={addingToWatchlist}
                    className="w-full"
                  >
                    Add to Watchlist
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
