'use client';

import { Target, Zap, Dribbble, ShuffleIcon as Shuttlecock, Activity, X, DollarSign, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from './ui/button';

interface Sport {
  id: number;
  sport_name: string;
  sport_type: string;
  description: string;
  is_available: number;
}

interface Field {
  id: number;
  field_name: string;
  field_code: string;
  sport_id: number;
  price_per_hour: number;
  description: string;
  url_image?: string;
  images?: string[];
  is_available: number;
}

const sportConfig: Record<string, { icon: any, color: string }> = {
  'futsal': { icon: Target, color: 'from-emerald-500 to-green-600' },
  'mini-soccer': { icon: Zap, color: 'from-blue-500 to-cyan-600' },
  'basketball': { icon: Dribbble, color: 'from-orange-500 to-red-600' },
  'badminton': { icon: Shuttlecock, color: 'from-purple-500 to-pink-600' },
  'padel': { icon: Activity, color: 'from-yellow-500 to-orange-600' },
};

const SportCard = ({ sport, onDetailClick }: { sport: Sport; onDetailClick: (sport: Sport) => void }) => {
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
      
      <button 
        onClick={() => onDetailClick(sport)}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all inline-block text-center group-hover:bg-blue-600 group-hover:border-blue-600`}
      >
        Lihat Detail
      </button>
    </div>
  );
};

// Helper to get dummy image based on sport type
const getSportImage = (type: string, customUrl?: string) => {
  if (customUrl) {
     // Check if it is a Google Drive link
     if (customUrl.includes('drive.google.com')) {
         // Try to convert to a viewable link if it's a standard share link
         // Standard share link: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
         // Direct view link (often works for img tags if public): https://drive.google.com/uc?export=view&id=FILE_ID
         
         const match = customUrl.match(/\/d\/(.+?)(\/|$)/);
         if (match && match[1]) {
             return `https://drive.google.com/uc?export=view&id=${match[1]}`;
         }
     }
     return customUrl;
  }

  switch (type) {
    case 'futsal': return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1000&auto=format&fit=crop';
    case 'mini-soccer': return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop';
    case 'basketball': return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop';
    case 'badminton': return 'https://images.unsplash.com/photo-1626224583764-847890e0b3b9?q=80&w=1000&auto=format&fit=crop';
    case 'padel': return 'https://images.unsplash.com/photo-1554068865-2484cd665469?q=80&w=1000&auto=format&fit=crop'; // Generic court/tennis
    default: return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop'; // Generic gym
  }
};

// Component for Image Carousel per Field
const FieldImageCarousel = ({ images, defaultImage, fieldName, isAvailable }: { images?: string[], defaultImage: string, fieldName: string, isAvailable: number }) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Combine images: if images array exists and has length > 0, use it. Otherwise use defaultImage (from url_image or placeholder)
  // We want to ensure at least one image is shown.
  const imageList = images && images.length > 0 ? images : [defaultImage];

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
    <div className="relative h-full w-full overflow-hidden group">
        <Carousel setApi={setApi} className="w-full h-full">
            <CarouselContent className="h-full ml-0">
                {imageList.map((src, index) => (
                    <CarouselItem key={index} className="pl-0 h-full">
                        <img 
                            src={getSportImage('', src)} 
                            alt={`${fieldName} - ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            
            {/* Only show controls if more than 1 image */}
            {imageList.length > 1 && (
                <>
                    {/* Navigation Buttons - Centered Bottom Above Dots */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <CarouselPrevious className="static translate-y-0 h-8 w-8 border-none bg-black/30 text-white hover:bg-black/50 rounded-full" />
                        <CarouselNext className="static translate-y-0 h-8 w-8 border-none bg-black/30 text-white hover:bg-black/50 rounded-full" />
                    </div>
                    
                    {/* Dots Indicator for Images */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                        {imageList.map((_, index) => (
                            <div 
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                                    current === index + 1 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </Carousel>

        <div className="absolute inset-0 bg-gradient-to-t from-[#2b2b2b] via-transparent to-transparent opacity-90 pointer-events-none"></div>
        
        {/* Status Badge Overlay */}
        <div className="absolute top-4 right-4 z-20">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md ${
                isAvailable 
                ? 'bg-emerald-500/80 text-white border border-emerald-400/50' 
                : 'bg-red-500/80 text-white border border-red-400/50'
            }`}>
                {isAvailable ? 'Aktif' : 'Tidak Aktif'}
            </span>
        </div>
    </div>
  );
};

export default function SportsSection() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  // Carousel API state to track current slide
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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

  const handleDetailClick = async (sport: Sport) => {
    setSelectedSport(sport);
    setLoadingFields(true);
    try {
      const response = await fetch(`/api/fields?sportId=${sport.id}`);
      const result = await response.json();
      setFields(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
    // Disable scrolling on body
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDetail = () => {
    setSelectedSport(null);
    setFields([]);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

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
                    <SportCard sport={sport} onDetailClick={handleDetailClick} />
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
                <SportCard sport={sport} onDetailClick={handleDetailClick} />
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

      {/* Detail Popup Modal */}
      {selectedSport && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseDetail}
        >
          <div 
            className="bg-[#333] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - REMOVE THIS as it is now redundant with the new layout, or simplify it */}
            {/* The user wanted the image *above* the information, so the header in the modal might be better placed or removed. 
                Actually, let's keep a minimal header or just the close button. 
                The request said: "menampilkan gambar dari lapangan yang di maksud dengan size yang besar lalu dibawahnya baru informasi Nama Lapangan, Tarif dan Description"
                So the sport info (Sport Name) is less critical on the slide itself, but maybe good to keep as a context.
                I will remove the old header to maximize space for the image and info. 
            */}
            
            {/* Close Button (Top Left) - Floating over image/content now */}
            <button 
              onClick={handleCloseDetail}
              className="absolute top-6 left-6 z-30 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-md border border-white/10"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>


            {/* Content */}
            <div className="flex-grow flex flex-col overflow-hidden">
              {loadingFields ? (
                 <div className="flex flex-col items-center justify-center py-12 space-y-4 h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-gray-400">Memuat data lapangan...</p>
                 </div>
              ) : fields.length > 0 ? (
                <div className="flex-grow flex flex-col relative">
                  <Carousel 
                    setApi={setApi} 
                    className="w-full h-full"
                    opts={{
                      loop: true,
                    }}
                  >
                    <CarouselContent className="h-full ml-0">
                      {fields.map((field) => (
                        <CarouselItem key={field.id} className="pl-0 h-full">
                          <div className="flex flex-col h-full bg-[#2b2b2b]">
                            {/* Large Image Area - Increased height to 3/4 (approx 70vh) */}
                            <div className="relative h-[65vh] w-full">
                                <FieldImageCarousel 
                                    images={field.images} 
                                    defaultImage={getSportImage(selectedSport.sport_type, field.url_image)}
                                    fieldName={field.field_name}
                                    isAvailable={field.is_available}
                                />
                            </div>

                            {/* Info Area - Compacted to fit roughly 1/4 (approx 25vh) */}
                            <div className="flex-grow px-8 py-6 flex flex-col justify-between bg-[#2b2b2b]">
                              <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-bold text-white mb-0">{field.field_name}</h2>
                                
                                <div className="text-right">
                                   <span className="text-xl font-bold text-emerald-400">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(field.price_per_hour)} <span className="text-sm font-normal text-gray-400">(per jam)</span>
                                   </span>
                                </div>
                              </div>

                              <div className="mb-4">
                                 <p className="text-gray-400 text-sm leading-snug line-clamp-2">
                                   {field.description || "Lapangan dengan kualitas standar internasional, dilengkapi dengan penerangan LED dan lantai vinyl premium untuk kenyamanan bermain."}
                                 </p>
                              </div>

                              <div className="mt-1">
                                <Button 
                                  className={`w-full h-10 text-sm font-bold rounded-lg shadow-md transition-all transform hover:scale-[1.01] ${
                                    field.is_available 
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-blue-500/20'
                                      : 'bg-gray-600 text-gray-300 cursor-not-allowed hover:bg-gray-600'
                                  }`}
                                  onClick={() => {
                                     if (field.is_available) {
                                        window.location.href = `/booking?sport=${selectedSport.sport_type}&field=${field.id}`;
                                     } else {
                                        alert('Lapangan yang Anda pilih tidak aktif (belum bisa digunakan), silakan pilih lapangan yang lain.');
                                     }
                                  }}
                                >
                                  {field.is_available ? 'Book Now' : 'Tidak Tersedia'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    
                    {/* Navigation Controls */}
                    {fields.length > 1 && (
                      <>
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
                          <CarouselPrevious className="static translate-y-0 h-12 w-12 border-2 border-white/20 bg-black/40 text-white hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all" />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
                          <CarouselNext className="static translate-y-0 h-12 w-12 border-2 border-white/20 bg-black/40 text-white hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all" />
                        </div>
                        
                        {/* Dots Indicator */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                          {fields.map((_, index) => (
                             <div 
                               key={index}
                               className={`h-2 rounded-full transition-all duration-300 ${
                                 current === index + 1 ? 'w-8 bg-blue-500' : 'w-2 bg-white/30'
                               }`}
                             />
                          ))}
                        </div>
                      </>
                    )}
                  </Carousel>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#2b2b2b] m-8 rounded-xl border border-dashed border-white/10">
                  <p className="text-gray-400 text-lg">Belum ada lapangan terdaftar untuk {selectedSport.sport_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

