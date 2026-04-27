import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moviesApi, reviewsApi } from '@/api/client';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useAuthStore } from '@/stores/authStore';
import type { Movie, Review, WatchlistStatus } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { StarRating } from '@/components/ui/StarRating';
import { Select } from '@/components/ui/Select';

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

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const { entries, fetch: fetchWatchlist, add, update, remove } = useWatchlistStore();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [newStatus, setNewStatus] = useState<WatchlistStatus>('want');
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const entry = id ? entries.find((e) => e.movieId === id) : undefined;
  const myReview = reviews.find((r) => r.userId === userId);

  useEffect(() => {
    if (!id) { navigate('/movies'); return; }
    setIsLoading(true);
    Promise.all([moviesApi.getById(id), moviesApi.getReviews(id)])
      .then(([movieRes, reviewsRes]) => {
        setMovie(movieRes.data);
        setReviews(reviewsRes.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load movie');
      })
      .finally(() => setIsLoading(false));
    fetchWatchlist();
  }, [id, navigate, fetchWatchlist]);

  const handleAddToWatchlist = async () => {
    if (!id) return;
    setWatchlistLoading(true);
    try { await add(id, newStatus); } catch { /* ignore */ }
    setWatchlistLoading(false);
  };

  const handleStatusChange = async (status: WatchlistStatus) => {
    if (!entry) return;
    setWatchlistLoading(true);
    try { await update(entry.id, status); } catch { /* ignore */ }
    setWatchlistLoading(false);
  };

  const handleRemove = async () => {
    if (!entry) return;
    setWatchlistLoading(true);
    try { await remove(entry.id); } catch { /* ignore */ }
    setWatchlistLoading(false);
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await reviewsApi.create(id, newRating, newComment || undefined);
      setReviews((prev) => [res.data, ...prev]);
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditSubmitting(true);
    try {
      const res = await reviewsApi.update(editingReview.id, { rating: editRating, comment: editComment });
      setReviews((prev) => prev.map((r) => (r.id === editingReview.id ? res.data : r)));
      setEditingReview(null);
    } catch { /* ignore */ }
    setEditSubmitting(false);
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    setDeleteSubmitting(true);
    try {
      await reviewsApi.remove(myReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setConfirmDelete(false);
    } catch { /* ignore */ }
    setDeleteSubmitting(false);
  };

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (error || !movie) return (
    <div className="max-w-2xl mx-auto py-12">
      <Alert type="error" message={error || 'Movie not found'} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="shrink-0">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} className="w-56 rounded-xl shadow object-cover" />
          ) : (
            <div className="w-56 h-80 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">🎬</div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{movie.title}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="info">{movie.genre}</Badge>
            <span className="text-gray-500 text-sm">{movie.releaseYear}</span>
          </div>
          {movie.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{movie.description}</p>
          )}

          {/* Watchlist controls */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            {entry ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={STATUS_VARIANT[entry.status]}>
                  {STATUS_OPTIONS.find((o) => o.value === entry.status)?.label}
                </Badge>
                <Select
                  options={STATUS_OPTIONS}
                  value={entry.status}
                  onChange={(e) => handleStatusChange(e.target.value as WatchlistStatus)}
                  className="text-sm"
                />
                <Button variant="danger" size="sm" onClick={handleRemove} isLoading={watchlistLoading}>
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  options={STATUS_OPTIONS}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as WatchlistStatus)}
                />
                <Button variant="primary" size="sm" onClick={handleAddToWatchlist} isLoading={watchlistLoading}>
                  Add to Watchlist
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Reviews <span className="text-gray-400 font-normal text-base">({reviews.length})</span>
        </h2>

        {/* Add review form — only if watched and no existing review */}
        {!myReview && entry?.status === 'watched' && (
          <form onSubmit={handleCreateReview} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Write a Review</h3>
            {reviewError && <Alert type="error" message={reviewError} onDismiss={() => setReviewError('')} />}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Rating</label>
              <StarRating value={newRating} onChange={setNewRating} size="lg" />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Comment (optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                placeholder="Share your thoughts..."
              />
            </div>
            <Button type="submit" variant="primary" isLoading={reviewSubmitting}>Submit Review</Button>
          </form>
        )}

        {/* Reviews list */}
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwn = review.userId === userId;
            const isEditing = editingReview?.id === review.id;

            return (
              <div key={review.id} className={`bg-white rounded-xl border p-5 ${isOwn ? 'border-blue-200' : 'border-gray-200'}`}>
                {isEditing ? (
                  <form onSubmit={handleUpdateReview}>
                    <div className="mb-3">
                      <StarRating value={editRating} onChange={setEditRating} size="md" />
                    </div>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="primary" isLoading={editSubmitting}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingReview(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <StarRating value={review.rating} size="sm" />
                        <span className="text-xs text-gray-400 mt-1 block">
                          {isOwn ? 'You' : `User`} · {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {isOwn && (
                        <div className="flex gap-2">
                          {confirmDelete ? (
                            <>
                              <Button size="sm" variant="danger" isLoading={deleteSubmitting} onClick={handleDeleteReview}>Yes, delete</Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingReview(review);
                                setEditRating(review.rating);
                                setEditComment(review.comment ?? '');
                              }}>Edit</Button>
                              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                  </>
                )}
              </div>
            );
          })}

          {reviews.length === 0 && (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </div>
  );
}
