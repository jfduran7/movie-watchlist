import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/movies');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          🎬 Movie Watchlist
        </h1>
        <p className="text-center text-gray-600 text-sm mb-8">
          Sign in to your account
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert
              type="error"
              message={error}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
