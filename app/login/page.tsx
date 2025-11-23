'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Eye, EyeOff, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

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
      // Redirect to homepage after successful login
      router.push('/');
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

  return (
    <div className="min-h-screen bg-[#333333] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full mix-blend-screen blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/20 rounded-full mix-blend-screen blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-600/20 rounded-full mix-blend-screen blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
  
      {/* CENTERED CARD WITH FIT-SCREEN HEIGHT */}
      <div className="relative z-10 w-full max-w-md max-h-[95vh] overflow-y-auto p-4 bg-[#404040] backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10">
        
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>
  
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-2xl p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Login</h1>
          <p className="text-gray-400 text-base">Masuk untuk mengakses menu admin</p>
        </div>
  
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-base bg-[#333333] text-white placeholder-gray-500 ${
                error && !username.trim()
                  ? "border-red-500 focus:ring-red-500"
                  : "border-white/10"
              }`}
              placeholder="Masukkan username"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
  
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-base bg-[#333333] text-white placeholder-gray-500 ${
                  error && (!password.trim() || password.length < 3)
                    ? "border-red-500 focus:ring-red-500"
                    : "border-white/10"
                }`}
                placeholder="Masukkan password"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
  
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
  
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              <p className="font-semibold">Login Gagal!</p>
              <p>{error}</p>
            </div>
          )}
  
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
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
  
        {/* DEMO INFO (COLLAPSIBLE BIAR GAK PANJANG) */}
        <details className="mt-6 bg-[#333333] border-2 border-white/10 rounded-xl p-4 cursor-pointer text-gray-300">
          <summary className="font-semibold mb-3 text-blue-400">Akun Demo (klik untuk lihat)</summary>
  
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-white">🔧 Admin Role:</p>
              <p>Dapat mengakses Kelola Lapangan & Cabang</p>
              <p className="mt-1">Username: <code className="bg-blue-900/30 px-2 py-1 rounded text-blue-300">admin</code></p>
              <p>Password: <code className="bg-blue-900/30 px-2 py-1 rounded text-blue-300">admin123</code></p>
            </div>
  
            <div className="border-t border-white/10 pt-4">
              <p className="font-medium text-white">👑 Owner Role:</p>
              <p>Akses penuh semua menu</p>
              <p className="mt-1">Username: <code className="bg-blue-900/30 px-2 py-1 rounded text-blue-300">owner</code></p>
              <p>Password: <code className="bg-blue-900/30 px-2 py-1 rounded text-blue-300">owner123</code></p>
            </div>
          </div>
        </details>
  
        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          SportArena Admin Portal
        </div>
      </div>
  
      {/* Blob animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-50px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
          100% { transform: translate(0,0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
  

  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
  //     {/* Background Pattern */}
  //     <div className="absolute inset-0 overflow-hidden">
  //       <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
  //       <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
  //       <div className="absolute top-40 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
  //     </div>

  //     <div className="relative z-10 w-full max-w-md">
  //       {/* Back to Home */}
  //       <Link
  //         href="/"
  //         className="inline-flex items-center text-white/90 hover:text-white mb-8 transition-colors group"
  //       >
  //         <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
  //         Kembali ke Beranda
  //       </Link>

  //       {/* Login Card */}
  //       <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
  //         {/* Header */}
  //         <div className="text-center mb-8">
  //           <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
  //             <Calendar className="h-10 w-10 text-white" />
  //           </div>
  //           <h1 className="text-3xl font-bold text-gray-900 mb-3">
  //             Admin Login
  //           </h1>
  //           <p className="text-gray-600 text-lg">
  //             Masuk untuk mengakses menu admin
  //           </p>
  //         </div>

  //         {/* Login Form */}
  //         <form onSubmit={handleSubmit} className="space-y-6">
  //           {/* Username */}
  //           <div>
  //             <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
  //               Username
  //             </label>
  //             <input
  //               id="username"
  //               type="text"
  //               value={username}
  //               onChange={(e) => setUsername(e.target.value)}
  //               className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg ${
  //                 error && !username.trim()
  //                   ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
  //                   : 'border-gray-300'
  //               }`}
  //               placeholder="Masukkan username"
  //               required
  //               disabled={isLoading}
  //               autoComplete="username"
  //             />
  //             {error && !username.trim() && (
  //               <p className="mt-2 text-sm text-red-600 flex items-center">
  //                 <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
  //                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  //                 </svg>
  //                 Username tidak boleh kosong
  //               </p>
  //             )}
  //           </div>

  //           {/* Password */}
  //           <div>
  //             <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
  //               Password
  //             </label>
  //             <div className="relative">
  //               <input
  //                 id="password"
  //                 type={showPassword ? 'text' : 'password'}
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //                 className={`w-full px-4 py-4 pr-14 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg ${
  //                   error && (!password.trim() || password.length < 3)
  //                     ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
  //                     : 'border-gray-300'
  //                 }`}
  //                 placeholder="Masukkan password"
  //                 required
  //                 disabled={isLoading}
  //                 autoComplete="current-password"
  //               />
  //               <button
  //                 type="button"
  //                 onClick={() => setShowPassword(!showPassword)}
  //                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
  //                 disabled={isLoading}
  //               >
  //                 {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
  //               </button>
  //             </div>
  //             {error && !password.trim() && (
  //               <p className="mt-2 text-sm text-red-600 flex items-center">
  //                 <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
  //                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  //                 </svg>
  //                 Password tidak boleh kosong
  //               </p>
  //             )}
  //             {error && password.trim() && password.length < 3 && (
  //               <p className="mt-2 text-sm text-red-600 flex items-center">
  //                 <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
  //                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  //                 </svg>
  //                 Password minimal 3 karakter
  //               </p>
  //             )}
  //           </div>

  //           {/* Error Message */}
  //           {error && (username.trim() && password.trim() && password.length >= 3) && (
  //             <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-xl text-sm flex items-start space-x-3">
  //               <svg className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
  //                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  //               </svg>
  //               <div>
  //                 <p className="font-semibold text-red-800">Login Gagal!</p>
  //                 <p className="text-red-700">{error}</p>
  //               </div>
  //             </div>
  //           )}

  //           {/* Submit Button */}
  //           <button
  //             type="submit"
  //             disabled={isLoading}
  //             className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
  //           >
  //             {isLoading ? (
  //               <>
  //                 <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
  //                 <span>Sedang masuk...</span>
  //               </>
  //             ) : (
  //               <>
  //                 <LogIn className="h-6 w-6" />
  //                 <span>Masuk</span>
  //               </>
  //             )}
  //           </button>
  //         </form>

  //         {/* Demo Info */}
  //         <div className="mt-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
  //           <div className="flex items-start space-x-3">
  //             <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
  //               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  //             </svg>
  //             <div>
  //               <p className="text-sm font-semibold text-blue-900 mb-3">Akun Demo:</p>
  //               <div className="space-y-3">
  //                 <div className="text-sm text-blue-800">
  //                   <p className="font-medium text-blue-900">🔧 Admin Role:</p>
  //                   <p className="text-blue-700">Dapat mengakses menu Kelola Lapangan & Cabang Olahraga</p>
  //                   <div className="mt-2 space-y-1">
  //                     <p>Username: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">admin</code></p>
  //                     <p>Password: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">admin123</code></p>
  //                   </div>
  //                 </div>
  //                 <div className="text-sm text-blue-800 pt-3 border-t border-blue-200">
  //                   <p className="font-medium text-blue-900">👑 Owner Role:</p>
  //                   <p className="text-blue-700">Dapat mengakses semua menu termasuk Dashboard</p>
  //                   <div className="mt-2 space-y-1">
  //                     <p>Username: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">owner</code></p>
  //                     <p>Password: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">owner123</code></p>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Footer */}
  //       <div className="text-center mt-8 text-white/80">
  //         <p className="text-sm">
  //           SportArena Admin Portal
  //         </p>
  //       </div>
  //     </div>

  //     {/* Add custom styles for blob animations */}
  //     <style jsx>{`
  //       @keyframes blob {
  //         0% {
  //           transform: translate(0px, 0px) scale(1);
  //         }
  //         33% {
  //           transform: translate(30px, -50px) scale(1.1);
  //         }
  //         66% {
  //           transform: translate(-20px, 20px) scale(0.9);
  //         }
  //         100% {
  //           transform: translate(0px, 0px) scale(1);
  //         }
  //       }
  //       .animate-blob {
  //         animation: blob 7s infinite;
  //       }
  //       .animation-delay-2000 {
  //         animation-delay: 2s;
  //       }
  //       .animation-delay-4000 {
  //         animation-delay: 4s;
  //       }
  //     `}</style>
  //   </div>
  // );
}