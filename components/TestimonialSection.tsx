'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ahmad Rizki',
    role: 'Pemain Futsal',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    comment: 'Lapangan futsal terbaik di kota! Rumput sintetis berkualitas dan lighting yang sempurna. Tim saya selalu booking disini untuk latihan.'
  },
  {
    name: 'Sarah Putri',
    role: 'Atlet Badminton',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    comment: 'Fasilitas badminton yang luar biasa! Lapangan ber-AC dan shuttlecock berkualitas. Harga juga sangat reasonable untuk kualitas premium.'
  },
  {
    name: 'David Pratama',
    role: 'Pelatih Basketball',
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    comment: 'Sebagai pelatih, saya sangat puas dengan lapangan basket disini. Ring dan lantai parket berkualitas profesional. Recommended!'
  },
  {
    name: 'Lisa Monica',
    role: 'Manajer Tim',
    avatar: 'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    comment: 'Booking online sangat mudah dan customer service responsif. Tim kami sudah berlangganan bulanan dan sangat puas dengan pelayanannya.'
  }
];

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-[#2b2b2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What Our <span className="bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">Clients Say</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Thousands of satisfied customers have trusted SportArena for their sports needs
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="bg-[#404040] rounded-2xl shadow-xl p-8 md:p-12 relative border border-white/5">
            <div className="text-center mb-8">
              <img
                src={testimonials[currentIndex].avatar}
                alt={testimonials[currentIndex].name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-4 ring-blue-600/20"
              />
              <h4 className="text-2xl font-bold text-white">
                {testimonials[currentIndex].name}
              </h4>
              <p className="text-blue-400 font-medium">
                {testimonials[currentIndex].role}
              </p>
              <div className="flex justify-center space-x-1 mt-2">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                ))}
              </div>
            </div>

            <blockquote className="text-xl text-gray-300 text-center leading-relaxed mb-8">
              "{testimonials[currentIndex].comment}"
            </blockquote>

            {/* Navigation Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={prevTestimonial}
                className="bg-white/5 text-white p-3 rounded-full hover:bg-blue-600 transition-colors border border-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextTestimonial}
                className="bg-white/5 text-white p-3 rounded-full hover:bg-blue-600 transition-colors border border-white/10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-blue-500' 
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              1,000+
            </div>
            <p className="text-gray-500">Happy Clients</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              5,000+
            </div>
            <p className="text-gray-500">Bookings Completed</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              4.9/5
            </div>
            <p className="text-gray-500">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              95%
            </div>
            <p className="text-gray-500">Customer Retention</p>
          </div>
        </div>
      </div>
    </section>
  );
}