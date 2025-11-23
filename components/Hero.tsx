'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#333333] text-white">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-red-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] bg-gray-600/40 rounded-full blur-[100px]"></div>
      </div>

      {/* Full Background dengan 3D Effect */}
      <div className="absolute inset-0 perspective-[1000px] opacity-80 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform-gpu"
          style={{
            backgroundImage: "url('/images/background.png')",
            transform: `rotateX(20deg) rotateY(10deg) translateY(${scrollY * 0.1}px) scale(1.1)`,
            transformOrigin: 'center center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#333333] via-transparent to-[#333333]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#333333] via-transparent to-[#333333]"></div>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-lg">
              SPORT ARENA
            </span>
            <span className="text-2xl md:text-4xl font-light tracking-widest uppercase text-blue-400 mt-4 block">
              The Best Place for Sports, Fun and Community in Tangerang Selatan
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Experience the ultimate sports lifestyle. 
            <span className="text-red-500 font-semibold mx-2">Play.</span>
            <span className="text-blue-500 font-semibold mx-2">Train.</span>
            <span className="text-white font-semibold mx-2">Connect.</span>
            <br/>
            Premium venues for Soccer, Padel, Badminton, and Gym.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="/booking" className="group relative px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                Book Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </span>
            </a>
            <button className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all hover:scale-105">
              Explore Venues
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {[
              { label: 'Venues', value: '15+', color: 'text-blue-400' },
              { label: 'Community', value: '2k+', color: 'text-red-400' },
              { label: 'Open', value: '24/7', color: 'text-white' },
              { label: 'Rating', value: '4.9', color: 'text-yellow-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 duration-300">
                <div className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
