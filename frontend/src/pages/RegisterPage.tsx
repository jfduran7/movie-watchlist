import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(name, email, password);
      navigate('/movies');
    } catch {
      // Error is handled by the store
    }
  };

  const currentError = validationError || error;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          🎬 Movie Watchlist
        </h1>
        <p className="text-center text-gray-600 text-sm mb-8">
          Create your account
        </p>

        {/* Error Alert */}
        {currentError && (
          <div className="mb-6">
            <Alert
              type="error"
              message={currentError}
              onDismiss={() => {
                setValidationError('');
                clearError();
              }}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Create account
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
