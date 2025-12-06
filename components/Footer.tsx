'use client';

import { Calendar, Phone, Mail, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Sport {
  id: number;
  sport_name: string;
}

export default function Footer() {
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch('/api/sports?show_all=true');
        const result = await response.json();
        if (Array.isArray(result)) {
          setSports(result);
        } else if (result.data) {
          setSports(result.data);
        }
      } catch (error) {
        console.error('Error fetching sports:', error);
      }
    };

    fetchSports();
  }, []);

  return (
    <footer className="bg-[#262626] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-xl p-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                SportArena
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Platform terpercaya untuk booking venue olahraga dengan fasilitas terbaik dan harga terjangkau di seluruh Indonesia.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-white/5 p-3 rounded-xl hover:bg-blue-600 transition-all">
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="bg-white/5 p-3 rounded-xl hover:bg-blue-600 transition-all">
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="bg-white/5 p-3 rounded-xl hover:bg-blue-600 transition-all">
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="bg-white/5 p-3 rounded-xl hover:bg-blue-600 transition-all">
                <Youtube className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#sports" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Sports
                </a>
              </li>
              <li>
                <a href="#events" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="#booking" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Booking
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h4 className="text-xl font-bold mb-6">Cabang Olahraga</h4>
            <ul className="space-y-3">
              {sports.length > 0 ? (
                sports.map((sport) => (
                  <li key={sport.id}>
                    <a href="#sports" className="text-gray-300 hover:text-blue-400 transition-colors">
                      {sport.sport_name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-gray-400 italic">Memuat...</li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6">Kontak Kami</h4>
            <div className="space-y-4">
              <a 
                href="https://maps.app.goo.gl/R2YYYN147ARiTVWb6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start space-x-3 group"
              >
                <MapPin className="h-5 w-5 text-emerald-400 mt-1 flex-shrink-0 group-hover:text-emerald-300 transition-colors" />
                <div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    Jl. Pamulang 2<br />
                    Tangerang Selatan, 12345<br />
                    Indonesia
                  </p>
                </div>
              </a>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p className="text-gray-300">+62 21 1234-5678</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <p className="text-gray-300">info@sportarena.com</p>
              </div>
            </div>

            {/* Operating Hours */}
            {/* <div className="mt-6">
              <h5 className="font-semibold text-white mb-2">Jam Operasional</h5>
              <p className="text-gray-300 text-sm">
                Senin - Minggu: 06:00 - 22:00<br />
                Customer Service: 24/7
              </p>
            </div> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 SportArena. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}