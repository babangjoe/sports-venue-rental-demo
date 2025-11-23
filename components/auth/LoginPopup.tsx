'use client';

import { useState, useEffect } from 'react';
import { X, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  // Restore body scroll when popup closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    // Validation
    if (!username.trim()) {
      setError('Username harus diisi');
      return;
    }

    if (!password.trim()) {
      setError('Password harus diisi');
      return;
    }

    if (password.length < 3) {
      setError('Password minimal 3 karakter');
      return;
    }

    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      onClose();
      // Reset form
      setUsername('');
      setPassword('');
    } else {
      // Provide more specific error messages
      let errorMessage = result.error || 'Login gagal';

      if (result.error?.includes('fetch')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      } else if (result.error?.includes('Invalid credentials')) {
        errorMessage = 'Username atau password salah. Periksa kembali kredensial Anda.';
      } else if (result.error?.includes('No token provided')) {
        errorMessage = 'Terjadi kesalahan pada sesi login. Silakan coba lagi.';
      } else if (result.error?.includes('Network error')) {
        errorMessage = 'Koneksi internet bermasalah. Periksa jaringan Anda.';
      } else if (result.error?.includes('Internal server error')) {
        errorMessage = 'Server sedang bermasalah. Silakan coba beberapa saat lagi.';
      }

      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError('');
      setUsername('');
      setPassword('');
    }
  };

  if (!isOpen) return null;

  // Prevent body scroll when popup is open
  if (typeof window !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Login
            </h2>
            <p className="text-gray-600">
              Masuk untuk mengakses menu admin
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                  error && !username.trim()
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Masukkan username"
                required
                disabled={isLoading}
                autoComplete="username"
              />
              {error && !username.trim() && (
                <p className="mt-1 text-sm text-red-600">Username tidak boleh kosong</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    error && (!password.trim() || password.length < 3)
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Masukkan password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && !password.trim() && (
                <p className="mt-1 text-sm text-red-600">Password tidak boleh kosong</p>
              )}
              {error && password.trim() && password.length < 3 && (
                <p className="mt-1 text-sm text-red-600">Password minimal 3 karakter</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Error!</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Sedang masuk...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">Akun Demo:</p>
                <div className="space-y-2">
                  <div className="text-xs text-blue-700">
                    <p><strong>Admin:</strong> dapat mengakses menu Kelola Lapangan & Cabang Olahraga</p>
                    <p className="mt-1">Username: <code className="bg-blue-100 px-1 py-0.5 rounded">admin</code></p>
                    <p>Password: <code className="bg-blue-100 px-1 py-0.5 rounded">admin123</code></p>
                  </div>
                  <div className="text-xs text-blue-700 pt-2 border-t border-blue-200">
                    <p><strong>Owner:</strong> dapat mengakses semua menu termasuk Dashboard</p>
                    <p className="mt-1">Username: <code className="bg-blue-100 px-1 py-0.5 rounded">owner</code></p>
                    <p>Password: <code className="bg-blue-100 px-1 py-0.5 rounded">owner123</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}