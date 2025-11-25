'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Calendar, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.admin-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleNavClick = (hash: string) => {
    setIsMenuOpen(false);
    // If we are not on the home page, navigating to "/" will automatically handle the hash if we use Link
    // However, if we are already on "/", we want to scroll smoothly.
    // Next.js <Link> with hash works well for both.
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#333333]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-xl p-2">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              SportArena
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <Link href="/#home" className="text-gray-300 hover:text-white font-medium transition-colors">
                Home
              </Link>
              <Link href="/#sports" className="text-gray-300 hover:text-white font-medium transition-colors">
                Sports
              </Link>
              <Link href="/#pricing" className="text-gray-300 hover:text-white font-medium transition-colors">
                Pricing
              </Link>
              {user ? (
                <div className="relative admin-dropdown">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center text-gray-300 hover:text-white font-medium transition-colors py-2"
                  >
                    Admin
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#404040] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
                      {user.role === 'owner' && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/admin/fields"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                      >
                        Kelola Lapangan
                      </Link>
                      <Link
                        href="/admin/sports"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                      >
                        Kelola Cabang Olahraga
                      </Link>
                      <Link
                        href="/admin/kasir"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                      >
                        Kasir
                      </Link>
                      <div className="border-t border-white/10 p-3">
                        <div className="text-xs text-gray-500 mb-2">Logged in as {user.fullName}</div>
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center text-gray-300 hover:text-white font-medium transition-colors py-2"
                >
                  Admin
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Link>
              )}
              <Link href="/#contact" className="text-gray-300 hover:text-white font-medium transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/booking" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg inline-block">
              Book Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#404040] rounded-2xl mt-2 shadow-xl border border-white/10">
            <div className="px-4 py-3 space-y-3">
              <Link href="/#home" onClick={() => handleNavClick('#home')} className="block text-gray-300 hover:text-white font-medium py-2">
                Home
              </Link>
              <Link href="/#sports" onClick={() => handleNavClick('#sports')} className="block text-gray-300 hover:text-white font-medium py-2">
                Sports
              </Link>
              <Link href="/#pricing" onClick={() => handleNavClick('#pricing')} className="block text-gray-300 hover:text-white font-medium py-2">
                Pricing
              </Link>

              {user ? (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-gray-500 text-sm font-semibold mb-2">Admin Menu ({user.fullName})</p>
                  {user.role === 'owner' && (
                    <Link href="/admin/dashboard" className="block text-gray-700 hover:text-emerald-600 font-medium py-2 pl-3">
                      Dashboard
                    </Link>
                  )}
                  <Link href="/admin/fields" className="block text-gray-700 hover:text-emerald-600 font-medium py-2 pl-3">
                    Kelola Lapangan
                  </Link>
                  <Link href="/admin/sports" className="block text-gray-700 hover:text-emerald-600 font-medium py-2 pl-3">
                    Kelola Cabang Olahraga
                  </Link>
                  <Link href="/admin/kasir" className="block text-gray-700 hover:text-emerald-600 font-medium py-2 pl-3">
                    Kasir
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full text-red-600 hover:bg-red-50 font-medium py-2 pl-3 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-left text-gray-700 hover:text-emerald-600 font-medium py-2 border-t border-gray-200 pt-3 mt-3"
                >
                  Admin
                </Link>
              )}

              <Link href="/#contact" onClick={() => handleNavClick('#contact')} className="block text-gray-700 hover:text-emerald-600 font-medium py-2">
                Contact
              </Link>
              <Link href="/booking" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-semibold mt-3 inline-block text-center">
                Booking Sekarang
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}