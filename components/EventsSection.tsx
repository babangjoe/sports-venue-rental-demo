'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect } from 'react';

// Data event dummy
const events = [
  {
    id: 1,
    title: "Mini Soccer Trofeo Cup 2024",
    date: "25 Agustus 2024",
    time: "08:00 - 17:00",
    location: "Lapangan Mini Soccer A",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop",
    category: "Tournament"
  },
  {
    id: 2,
    title: "Celebrity Padel Exhibition",
    date: "1 September 2024",
    time: "19:00 - 22:00",
    location: "Padel Center Court",
    image: "https://images.unsplash.com/photo-1554068865-2484cd665469?q=80&w=1000&auto=format&fit=crop",
    category: "Special Event"
  },
  {
    id: 3,
    title: "Nobar Big Match: Liverpool vs MU",
    date: "15 September 2024",
    time: "21:30 - Selesai",
    location: "SportArena Lounge",
    image: "https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=1000&auto=format&fit=crop",
    category: "Nobar"
  },
  {
    id: 4,
    title: "Badminton Weekend Fun Games",
    date: "Setiap Sabtu",
    time: "09:00 - 12:00",
    location: "Badminton Hall",
    image: "https://images.unsplash.com/photo-1626224583764-847890e0b3b9?q=80&w=1000&auto=format&fit=crop",
    category: "Community"
  },
  {
    id: 5,
    title: "Basketball Coaching Clinic",
    date: "20 September 2024",
    time: "15:00 - 18:00",
    location: "Basketball Court 1",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop",
    category: "Workshop"
  }
];

export default function EventsSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <section id="events" className="py-20 bg-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upcoming <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Events</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Jangan lewatkan keseruan event olahraga, turnamen, dan nobar di SportArena!
          </p>
        </div>

        <div className="relative group max-w-5xl mx-auto">
          <Carousel
            setApi={setApi}
            plugins={[plugin.current]}
            className="w-full rounded-3xl overflow-hidden shadow-2xl"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-0">
              {events.map((event) => (
                <CarouselItem key={event.id} className="pl-0 basis-full">
                  <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                    {/* Background Image */}
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
                      <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs md:text-sm font-bold rounded-full mb-4 shadow-lg">
                          {event.category}
                        </span>
                        
                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                          {event.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 md:gap-8 text-gray-300 mb-6">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            <span className="text-sm md:text-base">{event.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-pink-500" />
                            <span className="text-sm md:text-base">{event.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5 text-orange-500" />
                            <span className="text-sm md:text-base">{event.location}</span>
                          </div>
                        </div>

                        <button className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold transition-colors">
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Arrows - Visible on Hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 border-none bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 border-none bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full" />
            </div>

            {/* Dots Indicator - Bottom Left */}
            <div className="absolute bottom-6 right-6 flex space-x-2 z-30">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    current === index + 1 ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </Carousel>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Ingin mengadakan event di SportArena?
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:-translate-y-1">
            Hubungi Kami
          </button>
        </div>
      </div>
    </section>
  );
}
