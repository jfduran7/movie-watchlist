import { useState, useEffect } from 'react';
import { profileApi } from '@/api/client';
import type { Profile } from '@/api/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { StarRating } from '@/components/ui/StarRating';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    profileApi.getMe()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (error || !profile) return (
    <div className="max-w-xl mx-auto py-12">
      <Alert type="error" message={error || 'Profile not found'} />
    </div>
  );

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow p-8 mb-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold shrink-0">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 mt-1">{profile.email}</p>
        </div>
      </div>

      {/* Stats */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-4xl font-bold text-blue-600 mb-1">{profile.stats.totalWatched}</p>
          <p className="text-sm text-gray-500">Movies Watched</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          {profile.stats.averageRating !== null ? (
            <>
              <div className="flex justify-center mb-1">
                <StarRating value={Math.round(profile.stats.averageRating)} size="lg" />
              </div>
              <p className="text-sm text-gray-500">
                Average Rating ({profile.stats.averageRating.toFixed(1)})
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl text-gray-300 mb-1">—</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
