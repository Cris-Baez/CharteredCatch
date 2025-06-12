import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import CharterCard from "@/components/charter-card";
import FishingAssistant from "@/components/fishing-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Clock, Users, Search, MessageCircle, Calendar, Shield, DollarSign, Headphones, Bot } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";




export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const fishingPhotos = [
    { 
      src: `data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#87CEEB"/>
              <stop offset="50%" style="stop-color:#4682B4"/>
              <stop offset="100%" style="stop-color:#191970"/>
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean1)"/>
          <path d="M0,200 Q200,150 400,200 T800,200 L800,400 L0,400 Z" fill="#1E3A8A" opacity="0.3"/>
          <circle cx="650" cy="100" r="40" fill="#FFD700" opacity="0.8"/>
          <path d="M100,250 Q150,200 200,250 Q250,300 300,250" stroke="#FF6B6B" stroke-width="4" fill="none"/>
          <rect x="90" y="240" width="20" height="8" fill="#8B4513"/>
        </svg>
      `)}`, 
      alt: 'Deep sea fishing with colorful rods and reels' 
    },
    { 
      src: `data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#40E0D0"/>
              <stop offset="100%" style="stop-color:#008B8B"/>
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean2)"/>
          <ellipse cx="200" cy="200" rx="25" ry="15" fill="#FFD700"/>
          <ellipse cx="250" cy="180" rx="25" ry="15" fill="#FFD700"/>
          <ellipse cx="300" cy="220" rx="25" ry="15" fill="#FFD700"/>
          <ellipse cx="350" cy="200" rx="25" ry="15" fill="#FFD700"/>
          <ellipse cx="400" cy="190" rx="25" ry="15" fill="#FFD700"/>
        </svg>
      `)}`, 
      alt: 'School of tropical yellowtail fish underwater' 
    },
    { 
      src: `data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#87CEEB"/>
              <stop offset="100%" style="stop-color:#4169E1"/>
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean3)"/>
          <path d="M300,250 Q350,200 400,250 Q450,300 500,250" fill="#32CD32" opacity="0.6"/>
          <ellipse cx="400" cy="230" rx="40" ry="20" fill="#32CD32"/>
          <path d="M380,225 L420,225 L430,215 L420,235 Z" fill="#228B22"/>
          <circle cx="390" cy="225" r="3" fill="#000"/>
          <path d="M400,180 L420,160 L440,180" stroke="#FFF" stroke-width="3" fill="none"/>
        </svg>
      `)}`, 
      alt: 'Mahi-mahi jumping out of crystal blue water' 
    },
    { 
      src: `data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#00CED1"/>
              <stop offset="100%" style="stop-color:#008080"/>
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean4)"/>
          <ellipse cx="400" cy="200" rx="60" ry="30" fill="#32CD32" opacity="0.8"/>
          <ellipse cx="350" cy="190" rx="15" ry="25" fill="#228B22"/>
          <circle cx="350" cy="185" r="4" fill="#000"/>
          <path d="M320,190 Q340,180 360,190" fill="#228B22"/>
        </svg>
      `)}`, 
      alt: 'Underwater view of mahi-mahi swimming' 
    },
    { 
      src: `data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean5" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#4682B4"/>
              <stop offset="100%" style="stop-color:#2F4F4F"/>
            </linearGradient>
          </defs>
          <rect width="800" height="400" fill="url(#ocean5)"/>
          <ellipse cx="400" cy="250" rx="80" ry="40" fill="#8B4513"/>
          <ellipse cx="350" cy="240" rx="20" ry="30" fill="#A0522D"/>
          <circle cx="350" cy="230" r="5" fill="#000"/>
          <path d="M300,240 Q330,220 360,240" fill="#A0522D"/>
          <path d="M100,100 Q400,150 700,100" stroke="#C0C0C0" stroke-width="2" fill="none" opacity="0.6"/>
        </svg>
      `)}`, 
      alt: 'Large grouper fish underwater with net' 
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % fishingPhotos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [fishingPhotos.length]);

  const { data: featuredCharters, isLoading } = useQuery<CharterWithCaptain[]>({
    queryKey: ["/api/charters"],
  });

  const handleSearch = (filters: { location: string; targetSpecies: string; duration: string }) => {
    const searchParams = new URLSearchParams();
    if (filters.location) searchParams.set("location", filters.location);
    if (filters.targetSpecies) searchParams.set("targetSpecies", filters.targetSpecies);
    if (filters.duration) searchParams.set("duration", filters.duration);

    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Slideshow */}
      <section className="relative overflow-hidden">
        <div className="h-96 md:h-[500px] relative">
          {/* Slideshow Images */}
          {fishingPhotos.map((photo, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="h-full bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.2), rgba(30, 64, 175, 0.4)), url('${photo.src}')`
                }}
              />
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {fishingPhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                The Smarter Way to Book Fishing Charters
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-100">
                Connect with verified captains. No hidden fees. Book your perfect fishing adventure.
              </p>

              <SearchBar onSearch={handleSearch} />

              <div className="mt-6">
                <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Need Help Choosing? Ask Our Fishing Assistant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <FishingAssistant onClose={() => setAssistantOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charters Section */}
      <section className="py-16 bg-sea-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Charters
            </h2>
            <p className="text-xl text-storm-gray">
              Handpicked captains ready for your next adventure
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                  <div className="w-full h-48 bg-gray-200 animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCharters?.slice(0, 3).map((charter) => (
                <CharterCard key={charter.id} charter={charter} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setLocation("/search")}
              className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
            >
              View All Charters
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Charterly Works
            </h2>
            <p className="text-xl text-storm-gray">
              Book your perfect fishing charter in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-white text-2xl" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Search & Compare</h3>
              <p className="text-storm-gray">
                Find verified captains by location, species, and trip type. Compare ratings, prices, and availability.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="text-white text-2xl" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect & Plan</h3>
              <p className="text-storm-gray">
                Message captains directly to ask questions, discuss your trip, and get personalized fishing advice.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-white text-2xl" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Book & Fish</h3>
              <p className="text-storm-gray">
                Book instantly with real-time availability. Pay the captain directly with no hidden fees or commissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 ocean-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose Charterly?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verified Captains</h3>
                <p className="text-blue-100">All captains are licensed, insured, and safety certified</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Hidden Fees</h3>
                <p className="text-blue-100">What you see is what you pay - no booking fees or commissions</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-Time Booking</h3>
                <p className="text-blue-100">Instant availability and booking confirmation</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Direct Support</h3>
                <p className="text-blue-100">Message captains directly and get expert fishing advice</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Captain CTA Section */}
      <section className="py-16 bg-sea-foam">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Are You a Charter Captain?
          </h2>
          <p className="text-xl text-storm-gray mb-8">
            Join Charterly and keep 100% of your earnings. No commissions, just more bookings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-ocean-blue text-2xl mb-3">0%</div>
                <h3 className="font-semibold mb-2">Commission</h3>
                <p className="text-sm text-storm-gray">Keep every dollar you earn</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="text-ocean-blue text-2xl mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">More Customers</h3>
                <p className="text-sm text-storm-gray">Reach serious anglers nationwide</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-ocean-blue text-2xl mb-3">📱</div>
                <h3 className="font-semibold mb-2">Easy Management</h3>
                <p className="text-sm text-storm-gray">Simple tools for bookings & scheduling</p>
              </CardContent>
            </Card>
          </div>

          <Button 
            size="lg" 
            className="bg-ocean-blue hover:bg-blue-800 text-white"
            onClick={() => setLocation("/captain/dashboard")}
          >
            Join as a Captain
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}