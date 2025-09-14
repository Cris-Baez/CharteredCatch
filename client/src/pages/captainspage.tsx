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

      {/* Hero - Ocean Theme */}
      <section className="bg-ocean-blue text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center bg-clear-blue rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Professional Charter Platform</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Grow Your Charter Business
            <span className="block text-tropical-teal">
              in the Florida Keys
            </span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-100 leading-relaxed">
            Connect with thousands of anglers, manage bookings efficiently, and boost your revenue. 
            Join 500+ professional captains already using Charterly to grow their business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button className="bg-tropical-teal hover:bg-tropical-teal/90 text-white font-bold px-8 py-3 text-lg rounded-lg" data-testid="button-join-captain">
                <Anchor className="w-5 h-5 mr-2" />
                Join as Captain
              </Button>
            </Link>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg rounded-lg" data-testid="button-view-demo">
              <Calendar className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>

          {/* Real Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-clear-blue/50 rounded-xl p-4 text-center" data-testid="stat-active-captains">
              <div className="text-xl md:text-2xl font-bold mb-1">500+</div>
              <div className="text-blue-100 text-xs md:text-sm">Active Captains</div>
            </div>
            <div className="bg-clear-blue/50 rounded-xl p-4 text-center" data-testid="stat-annual-bookings">
              <div className="text-xl md:text-2xl font-bold mb-1">12,000+</div>
              <div className="text-blue-100 text-xs md:text-sm">Annual Bookings</div>
            </div>
            <div className="bg-clear-blue/50 rounded-xl p-4 text-center" data-testid="stat-avg-trip-value">
              <div className="text-xl md:text-2xl font-bold mb-1">$850</div>
              <div className="text-blue-100 text-xs md:text-sm">Avg. Trip Value</div>
            </div>
            <div className="bg-clear-blue/50 rounded-xl p-4 text-center" data-testid="stat-platform-rating">
              <div className="text-xl md:text-2xl font-bold mb-1">4.9⭐</div>
              <div className="text-blue-100 text-xs md:text-sm">Platform Rating</div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
            {/* Left side - Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-sea-foam border border-ocean-blue/20 p-5 rounded-xl">
                <div className="bg-ocean-blue w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-ocean-blue">15,000+ Active Anglers</h3>
                <p className="text-gray-600 text-sm">Serious fishing enthusiasts actively booking charters in the Florida Keys year-round.</p>
              </div>

              <div className="bg-sea-foam border border-tropical-teal/20 p-5 rounded-xl">
                <div className="bg-tropical-teal w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-tropical-teal">40% More Bookings</h3>
                <p className="text-gray-600 text-sm">Average increase in charter bookings for captains in their first year on the platform.</p>
              </div>

              <div className="bg-sea-foam border border-clear-blue/20 p-5 rounded-xl">
                <div className="bg-clear-blue w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-clear-blue">$0 Commission Fees</h3>
                <p className="text-gray-600 text-sm">Keep 100% of your charter earnings. We only charge a simple monthly subscription.</p>
              </div>

              <div className="bg-sea-foam border border-storm-gray/20 p-5 rounded-xl">
                <div className="bg-storm-gray w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-storm-gray">Advanced Calendar</h3>
                <p className="text-gray-600 text-sm">Smart booking system that prevents conflicts and maximizes your charter schedule.</p>
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
          <div className="bg-sea-foam rounded-2xl p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-ocean-blue">Professional Captain Tools</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage your charter business efficiently, all in one dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center">
                <div className="bg-white rounded-xl p-4 md:p-6 border border-ocean-blue/20">
                  <MessageCircle className="w-8 md:w-10 h-8 md:h-10 text-ocean-blue mx-auto mb-3" />
                  <h4 className="font-bold text-sm md:text-base mb-2">Direct Messaging</h4>
                  <p className="text-gray-600 text-xs md:text-sm">Real-time chat with customers. Answer questions and close more bookings.</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-xl p-4 md:p-6 border border-tropical-teal/20">
                  <Anchor className="w-8 md:w-10 h-8 md:h-10 text-tropical-teal mx-auto mb-3" />
                  <h4 className="font-bold text-sm md:text-base mb-2">Charter Management</h4>
                  <p className="text-gray-600 text-xs md:text-sm">Manage multiple boats, trips, and charter types from one place.</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-xl p-4 md:p-6 border border-clear-blue/20">
                  <Target className="w-8 md:w-10 h-8 md:h-10 text-clear-blue mx-auto mb-3" />
                  <h4 className="font-bold text-sm md:text-base mb-2">Business Analytics</h4>
                  <p className="text-gray-600 text-xs md:text-sm">Track revenue, customer data, and optimize your pricing strategy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 md:py-16 px-6 bg-gradient-to-b from-ocean-blue to-clear-blue text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Real Captain Success Stories</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              See how captains are growing their businesses with Charterly's platform and tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-tropical-teal rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Captain Mike Rodriguez</h4>
                  <p className="text-blue-200 text-xs">Key Largo Fishing</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-3">"Doubled my bookings in 6 months. The messaging system helps me connect with clients before they even book."</p>
              <div className="text-xs text-blue-200">
                <span className="font-semibold">+120%</span> increase in revenue
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-verified-green rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">SJ</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Captain Sarah Johnson</h4>
                  <p className="text-blue-200 text-xs">Islamorada Charters</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-3">"No more commission fees means I keep every dollar I earn. The analytics help me price my trips perfectly."</p>
              <div className="text-xs text-blue-200">
                <span className="font-semibold">$18,000+</span> saved on commissions yearly
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-storm-gray rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">TC</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Captain Tom Chen</h4>
                  <p className="text-blue-200 text-xs">Marathon Sportfishing</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-3">"The booking calendar prevents double bookings and the customer quality is much higher than other platforms."</p>
              <div className="text-xs text-blue-200">
                <span className="font-semibold">4.9⭐</span> average customer rating
              </div>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold mb-1">85%</div>
              <div className="text-blue-200 text-xs md:text-sm">Captain Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold mb-1">$1,200</div>
              <div className="text-blue-200 text-xs md:text-sm">Avg. Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold mb-1">24hr</div>
              <div className="text-blue-200 text-xs md:text-sm">Avg. Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold mb-1">95%</div>
              <div className="text-blue-200 text-xs md:text-sm">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Simple Plan */}
      <section className="bg-sea-foam py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-ocean-blue">Simple Monthly Subscription</h2>
          <p className="text-lg text-gray-600 mb-12">No commissions. No hidden fees. One simple price to grow your business.</p>

          {/* Main Plan Card */}
          <div className="max-w-lg mx-auto">
            <Card className="rounded-xl shadow-lg border border-ocean-blue/20 overflow-hidden">
              <div className="bg-ocean-blue text-white py-6 px-6">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 mr-2" />
                  <span className="font-bold text-lg">Captain Professional</span>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">$49</div>
                  <div className="text-blue-100">per month</div>
                </div>
              </div>
              
              <CardContent className="p-6 bg-white">
                <div className="space-y-3 mb-8">
                  {[
                    { icon: CheckCircle, text: "Unlimited charter listings" },
                    { icon: Target, text: "Priority search placement" },
                    { icon: MessageCircle, text: "Direct customer messaging" },
                    { icon: Calendar, text: "Advanced booking management" },
                    { icon: TrendingUp, text: "Performance analytics & insights" },
                    { icon: Award, text: "Verified captain badge" },
                    { icon: DollarSign, text: "0% commission on bookings" },
                    { icon: Shield, text: "Priority customer support" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-left">
                      <feature.icon className="w-4 h-4 text-tropical-teal mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Link href="/signup">
                  <Button className="w-full bg-tropical-teal hover:bg-tropical-teal/90 text-white font-bold py-3 text-lg rounded-lg" data-testid="button-start-subscription">
                    <Anchor className="w-5 h-5 mr-2" />
                    Start Subscription
                  </Button>
                </Link>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Cancel anytime • No setup fees • 30-day money-back guarantee
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="bg-ocean-blue/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-ocean-blue" />
              </div>
              <h3 className="font-bold text-base mb-2">Keep 100% of Earnings</h3>
              <p className="text-gray-600 text-sm">No commission fees. All payments go directly to you.</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-tropical-teal/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-tropical-teal" />
              </div>
              <h3 className="font-bold text-base mb-2">More Bookings</h3>
              <p className="text-gray-600 text-sm">Captains average 40% more bookings in their first year.</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-clear-blue/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-clear-blue" />
              </div>
              <h3 className="font-bold text-base mb-2">Professional Support</h3>
              <p className="text-gray-600 text-sm">Dedicated support team to help you succeed.</p>
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
          data-testid="input-captain-search"
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
                    <div className="flex items-center text-verified-green">
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
                      <Button size="sm" className="bg-ocean-blue text-white" data-testid={`button-view-profile-${captain.id}`}>View Profile</Button>
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
