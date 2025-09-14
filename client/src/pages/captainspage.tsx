// client/src/pages/captains.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Shield, Star, Briefcase, Anchor, DollarSign, Users, 
  TrendingUp, Calendar, MessageCircle, Award, Zap, Target,
  CheckCircle, Crown, Sparkles
} from "lucide-react";
import { Link } from "wouter";
interface Captain {
  id: number;
  userId: number;
  avatar?: string;
  bio?: string;
  experience?: string;
  licenseNumber?: string;
  location?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  user: {
    firstName?: string;
    lastName?: string;
  };
}

export default function CaptainsPage() {
  const [search, setSearch] = useState("");

  const { data: captains, isLoading } = useQuery<Captain[]>({
    queryKey: ["captains"],
    queryFn: async () => {
      const res = await fetch("/api/captains");
      if (!res.ok) throw new Error("Failed to fetch captains");
      return res.json();
    },
  });

  const filtered = captains?.filter(
    (c) =>
      c.user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero - Modern Design */}
      <section className="relative bg-gradient-to-br from-ocean-blue via-clear-blue to-storm-gray text-white py-24 px-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-400/20 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Start Your Journey Today</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Turn Your Passion Into
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Profit
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-blue-50">
            Join Florida Keys' premier charter platform. Connect with thousands of anglers, 
            manage your business seamlessly, and earn more than ever before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-ocean-blue font-semibold px-8 py-4 text-lg rounded-full backdrop-blur-sm">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-blue-200">Active Captains</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-blue-200">Monthly Bookings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-1">$2M+</div>
              <div className="text-blue-200">Captain Earnings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
          <Users className="w-10 h-10 text-ocean-blue mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Reach More Clients</h3>
          <p className="text-gray-600 text-sm">Get discovered by thousands of anglers and tourists worldwide.</p>
        </div>
        <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
          <DollarSign className="w-10 h-10 text-ocean-blue mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Secure Payments</h3>
          <p className="text-gray-600 text-sm">Receive payments safely and quickly with our trusted system.</p>
        </div>
        <div className="p-6 border rounded-xl shadow hover:shadow-lg transition">
          <Anchor className="w-10 h-10 text-ocean-blue mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Captain Tools</h3>
          <p className="text-gray-600 text-sm">Manage bookings, calendars, and client messages in one place.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-gray-50 py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">Subscription Plans</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Free", price: "$0", features: ["Basic Listing", "Up to 5 photos", "Community Support"] },
            { name: "Pro", price: "$29/mo", features: ["Priority Listing", "Unlimited photos", "Messaging Tools"] },
            { name: "Premium", price: "$99/mo", features: ["Featured Captain Badge", "Advanced Analytics", "24/7 Support"] },
          ].map((plan) => (
            <Card key={plan.name} className="rounded-xl shadow-lg hover:shadow-xl transition">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold text-ocean-blue mb-4">{plan.price}</p>
                <ul className="text-gray-600 text-sm space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <Button className="bg-ocean-blue text-white w-full">Choose Plan</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Captains directory */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Meet Our Captains</h2>
        <Input
          placeholder="Search captains by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-8"
        />
        {isLoading ? (
          <p className="text-center text-gray-500">Loading captains...</p>
        ) : !filtered?.length ? (
          <p className="text-center text-gray-500">No captains found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((captain) => (
              <Card key={captain.id} className="rounded-xl shadow hover:shadow-lg transition">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={captain.avatar || ""} useDefaultForCaptain />
                      <AvatarFallback>{captain.user.firstName?.[0] || "C"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-black">{captain.user.firstName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {captain.location || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 font-medium">{captain.rating || "New"}</span>
                      {captain.reviewCount !== undefined && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({captain.reviewCount})
                        </span>
                      )}
                    </div>
                    {captain.verified && (
                      <Badge className="bg-green-500 text-white flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{captain.bio || "No bio available."}</p>
                  <div className="flex justify-between mt-2">
                    <Link href={`/captains/${captain.id}`}>
                      <Button size="sm" className="bg-ocean-blue text-white">View Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
