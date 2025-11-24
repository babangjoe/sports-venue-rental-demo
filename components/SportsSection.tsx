'use client';

import { Target, Zap, Dribbble, ShuffleIcon as Shuttlecock, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Sport {
  id: number;
  sport_name: string;
  sport_type: string;
  description: string;
  is_available: number;
}

const sportConfig: Record<string, { icon: any, color: string }> = {
  'futsal': { icon: Target, color: 'from-emerald-500 to-green-600' },
  'mini-soccer': { icon: Zap, color: 'from-blue-500 to-cyan-600' },
  'basketball': { icon: Dribbble, color: 'from-orange-500 to-red-600' },
  'badminton': { icon: Shuttlecock, color: 'from-purple-500 to-pink-600' },
  'padel': { icon: Activity, color: 'from-yellow-500 to-orange-600' },
};

const SportCard = ({ sport }: { sport: Sport }) => {
  const config = sportConfig[sport.sport_type] || { icon: Target, color: 'from-gray-500 to-slate-600' };
  const Icon = config.icon;
  
  return (
    <div className="bg-[#404040] rounded-2xl p-8 shadow-lg border border-white/5 hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full">
      <div>
        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${config.color} mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4">
          {sport.sport_name}
        </h3>
        
        <p className="text-gray-300 leading-relaxed mb-6 flex-grow">
          {sport.description}
        </p>
      </div>
      
      <a href="/booking" className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all inline-block text-center group-hover:bg-blue-600 group-hover:border-blue-600`}>
        Lihat Detail
      </a>
    </div>
  );
};

export default function SportsSection() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch('/api/sports');
        const result = await response.json();
        if (Array.isArray(result)) {
          setSports(result);
        } else if (result.data) {
          setSports(result.data);
        }
      } catch (error) {
        console.error('Error fetching sports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  const isCarouselActive = sports.length > 4;

  if (loading) {
    return (
      <section id="sports" className="py-20 bg-[#2b2b2b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          Loading sports...
        </div>
      </section>
    );
  }

  return (
    <section id="sports" className="py-20 bg-[#2b2b2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">Sports</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Pilihan olahraga terlengkap dengan lapangan yang berstandard internasional
          </p>
        </div>

        {isCarouselActive ? (
          <div className="flex justify-center">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-[95%]"
            >
              <CarouselContent>
                {sports.map((sport) => (
                  <CarouselItem key={sport.id} className="md:basis-1/2 lg:basis-1/4 h-auto pl-6">
                    <SportCard sport={sport} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center -mx-4">
            {sports.map((sport) => (
              <div key={sport.id} className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8">
                <SportCard sport={sport} />
              </div>
            ))}
          </div>
        )}

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
