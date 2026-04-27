import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moviesApi } from '@/api/client';
import { useWatchlistStore } from '@/stores/watchlistStore';
import type { Movie, PaginatedMeta } from '@/api/types';
import { MovieCard } from '@/components/MovieCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const { entries: watchlistEntries, fetch: fetchWatchlist, add, update, remove } = useWatchlistStore();

  // Create a Map for O(1) lookup of watchlist entries by movieId
  const watchlistMap = new Map(watchlistEntries.map((entry) => [entry.movieId, entry]));

  const fetchMovies = async (page: number, genreFilter: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await moviesApi.list({
        page,
        limit: 20,
        genre: genreFilter || undefined,
      });
      setMovies(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load movies';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    fetchMovies(currentPage, genre);
  }, [currentPage, genre]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ genre, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ genre, page: String(newPage) });
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Movies</h1>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                type="text"
                label="Filter by genre"
                placeholder="Search genre..."
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8">
            <Alert
              type="error"
              message={error}
              onDismiss={() => setError('')}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Movies Grid */}
        {!isLoading && movies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                watchlistEntry={watchlistMap.get(movie.id)}
                onAddToWatchlist={(movieId, status) => add(movieId, status)}
                onUpdateStatus={(entryId, status) => update(entryId, status)}
                onRemoveFromWatchlist={(entryId) => remove(entryId)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && movies.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600">No movies found.</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
            >
              Previous
            </Button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
