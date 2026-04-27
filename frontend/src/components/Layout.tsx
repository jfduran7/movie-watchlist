import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from './ui/Button';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const handleLogout = () => {
    authStore.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* App Name / Logo */}
          <NavLink
            to="/movies"
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            🎬 Movie Watchlist
          </NavLink>

          {/* Center Nav Links */}
          <div className="hidden md:flex gap-8">
            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Movies
            </NavLink>
            <NavLink
              to="/watchlist"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              My Watchlist
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Profile
            </NavLink>
          </div>

          {/* Logout Button */}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
