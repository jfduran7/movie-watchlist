import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import MoviesPage from '@/pages/MoviesPage';
import MovieDetailPage from '@/pages/MovieDetailPage';
import WatchlistPage from '@/pages/WatchlistPage';
import ProfilePage from '@/pages/ProfilePage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/movies" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuth>
              <RegisterPage />
            </RedirectIfAuth>
          }
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/movies" replace />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/movies" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
