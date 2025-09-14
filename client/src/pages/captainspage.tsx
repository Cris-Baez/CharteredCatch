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

      {/* Benefits - Enhanced */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Top Captains Choose Charterly</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the platform that's revolutionizing charter fishing in the Florida Keys. 
              Built by captains, for captains.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left side - Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">10,000+ Active Users</h3>
                <p className="text-gray-700 text-sm">Reach serious anglers actively searching for their next charter experience.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">300% Booking Increase</h3>
                <p className="text-gray-700 text-sm">Average increase in bookings within the first 3 months on our platform.</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Zero Commission</h3>
                <p className="text-gray-700 text-sm">Keep 100% of your earnings. No hidden fees or commission charges.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="bg-orange-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Smart Scheduling</h3>
                <p className="text-gray-700 text-sm">AI-powered booking management that prevents double bookings and optimizes your calendar.</p>
              </div>
            </div>

            {/* Right side - Main feature */}
            <div className="bg-gradient-to-br from-ocean-blue to-clear-blue rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              
              <div className="relative z-10">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Professional Growth Platform</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Get verified captain status, showcase your expertise, and build a reputation that attracts premium clients. 
                  Our verification process helps you stand out from the competition.
                </p>
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Verified Captain Badge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Captain Command Center</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to run your charter business efficiently, all in one powerful dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
                  <MessageCircle className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
                  <h4 className="font-bold text-lg mb-2">Instant Messaging</h4>
                  <p className="text-gray-600 text-sm">Direct communication with customers. Answer questions, build relationships, and close more bookings.</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
                  <Anchor className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
                  <h4 className="font-bold text-lg mb-2">Fleet Management</h4>
                  <p className="text-gray-600 text-sm">Showcase multiple boats, manage different charter types, and optimize your fleet utilization.</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
                  <Target className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
                  <h4 className="font-bold text-lg mb-2">Performance Analytics</h4>
                  <p className="text-gray-600 text-sm">Track your success metrics, understand your customers, and optimize your pricing strategy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - New Structure */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-green-100 text-green-800 rounded-full px-4 py-2 mb-6">
            <Crown className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">Special Launch Offer</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-12">No commissions. No hidden fees. Just grow your business.</p>

          {/* Main Plan Card */}
          <div className="max-w-md mx-auto">
            <Card className="rounded-3xl shadow-2xl border-2 border-gradient-to-r from-yellow-400 to-orange-500 overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-4 px-6">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 mr-2" />
                  <span className="font-bold text-lg">Captain Pro</span>
                </div>
                <div className="text-center">
                  <div className="text-sm opacity-80 line-through">$99/month</div>
                  <div className="text-4xl font-bold">FREE</div>
                  <div className="text-sm">First month, then $49/month</div>
                </div>
              </div>
              
              <CardContent className="p-8 bg-white">
                <div className="space-y-4 mb-8">
                  {[
                    { icon: CheckCircle, text: "Unlimited charter listings" },
                    { icon: Target, text: "Priority search placement" },
                    { icon: MessageCircle, text: "Direct customer messaging" },
                    { icon: Calendar, text: "Booking management tools" },
                    { icon: TrendingUp, text: "Advanced analytics & insights" },
                    { icon: Award, text: "Verified captain badge" },
                    { icon: DollarSign, text: "0% commission fees" },
                    { icon: Shield, text: "24/7 customer support" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-left">
                      <feature.icon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Link href="/signup">
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free Month
                  </Button>
                </Link>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  No credit card required • Cancel anytime • 30-day money-back guarantee
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">No Commission Fees</h3>
              <p className="text-gray-600 text-sm">Keep 100% of your earnings. We only charge a simple monthly subscription.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Increase Bookings</h3>
              <p className="text-gray-600 text-sm">Our captains see an average 300% increase in bookings within 3 months.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Full Support</h3>
              <p className="text-gray-600 text-sm">Dedicated account manager and 24/7 support to help you succeed.</p>
            </div>
          </div>
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
