import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import CharterCard from "@/components/charter-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Search, MessageCircle, Calendar, Shield, DollarSign, Headphones } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  
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
      
      {/* Hero Section */}
      <section className="relative">
        <div 
          className="h-96 md:h-[500px] bg-cover bg-center relative"
          style={{
            backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.1), rgba(30, 64, 175, 0.3)), url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')`
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                The Smarter Way to Book Fishing Charters
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-100">
                Connect with verified captains. No hidden fees. Book your perfect fishing adventure.
              </p>
              
              <SearchBar onSearch={handleSearch} />
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
