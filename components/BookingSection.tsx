'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Mail, MapPin } from 'lucide-react';

export default function BookingSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    sport: '',
    date: '',
    time: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking data:', formData);
    // Handle booking submission here
    alert('Booking berhasil dikirim! Kami akan menghubungi Anda segera.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="booking" className="py-20 bg-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Now</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Fill in the form below to book your favorite field. Our team will confirm within 15 minutes!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-[#404040] rounded-2xl shadow-xl p-8 md:p-12 border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <Mail className="h-5 w-5 text-red-500" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="name@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sport */}
                <div>
                  <label htmlFor="sport" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <MapPin className="h-5 w-5 text-yellow-500" />
                    <span>Select Sport</span>
                  </label>
                  <select
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Select sport</option>
                    <option value="futsal">Futsal</option>
                    <option value="mini-soccer">Mini Soccer</option>
                    <option value="basketball">Basketball</option>
                    <option value="badminton">Badminton</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    <span>Location</span>
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Select location</option>
                    <option value="jakarta-pusat">Jakarta Pusat</option>
                    <option value="jakarta-selatan">Jakarta Selatan</option>
                    <option value="jakarta-utara">Jakarta Utara</option>
                    <option value="jakarta-barat">Jakarta Barat</option>
                    <option value="jakarta-timur">Jakarta Timur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                  <label htmlFor="date" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>Date</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Time */}
                <div>
                  <label htmlFor="time" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                    <Clock className="h-5 w-5 text-red-500" />
                    <span>Time</span>
                  </label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Select time</option>
                    <option value="06:00">06:00 - 07:00</option>
                    <option value="07:00">07:00 - 08:00</option>
                    <option value="08:00">08:00 - 09:00</option>
                    <option value="09:00">09:00 - 10:00</option>
                    <option value="10:00">10:00 - 11:00</option>
                    <option value="11:00">11:00 - 12:00</option>
                    <option value="12:00">12:00 - 13:00</option>
                    <option value="13:00">13:00 - 14:00</option>
                    <option value="14:00">14:00 - 15:00</option>
                    <option value="15:00">15:00 - 16:00</option>
                    <option value="16:00">16:00 - 17:00</option>
                    <option value="17:00">17:00 - 18:00</option>
                    <option value="18:00">18:00 - 19:00</option>
                    <option value="19:00">19:00 - 20:00</option>
                    <option value="20:00">20:00 - 21:00</option>
                    <option value="21:00">21:00 - 22:00</option>
                  </select>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all inline-block"
                >
                  Complete Booking
                </button>
                <p className="text-gray-400 mt-4">
                  or contact WhatsApp: <span className="font-semibold text-blue-400">+62 812-3456-7890</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}