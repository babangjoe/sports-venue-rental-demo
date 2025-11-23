'use client';

import { Target, Zap, Dribbble, ShuffleIcon as Shuttlecock } from 'lucide-react';

const sports = [
  {
    icon: Target,
    title: 'Futsal',
    description: 'Lapangan futsal berkualitas tinggi dengan rumput sintetis premium dan sistem pencahayaan terbaik.',
    color: 'from-emerald-500 to-green-600'
  },
  {
    icon: Zap,
    title: 'Mini Soccer',
    description: 'Lapangan mini soccer outdoor dengan standar internasional untuk pengalaman bermain yang maksimal.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Dribbble,
    title: 'Basketball',
    description: 'Lapangan basket indoor dengan lantai parket dan ring berkualitas profesional.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Shuttlecock,
    title: 'Badminton',
    description: 'Lapangan badminton indoor ber-AC dengan kualitas shuttlecock dan net standar BWF.',
    color: 'from-purple-500 to-pink-600'
  }
];

export default function SportsSection() {
  return (
    <section id="sports" className="py-20 bg-[#2b2b2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">Sports</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose your favorite sport and enjoy premium facilities with international standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sports.map((sport, index) => (
            <div
              key={index}
              className="bg-[#404040] rounded-2xl p-8 shadow-lg border border-white/5 hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all duration-300 group cursor-pointer"
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${sport.color} mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <sport.icon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {sport.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                {sport.description}
              </p>
              
              <a href="/booking" className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all inline-block text-center group-hover:bg-blue-600 group-hover:border-blue-600`}>
                View Schedule
              </a>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="bg-white/5 rounded-2xl p-6 mb-4 inline-block group-hover:bg-yellow-500/20 transition-colors">
              <div className="text-3xl">🏆</div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Premium Facilities</h4>
            <p className="text-gray-400">International standard equipment and courts</p>
          </div>
          <div className="text-center group">
            <div className="bg-white/5 rounded-2xl p-6 mb-4 inline-block group-hover:bg-blue-500/20 transition-colors">
              <div className="text-3xl">⏰</div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Flexible Booking</h4>
            <p className="text-gray-400">Easy and fast 24/7 online booking system</p>
          </div>
          <div className="text-center group">
            <div className="bg-white/5 rounded-2xl p-6 mb-4 inline-block group-hover:bg-green-500/20 transition-colors">
              <div className="text-3xl">💰</div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Affordable Price</h4>
            <p className="text-gray-400">Competitive pricing packages with various options</p>
          </div>
        </div>
      </div>
    </section>
  );
}