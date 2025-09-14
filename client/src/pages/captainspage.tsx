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

      {/* Hero - Simple */}
      <section className="bg-blue-600 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Join Charterly as a Captain
          </h1>
          
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Manage your charter business and connect with customers. Simple monthly subscription, no commission fees.
          </p>

          <Link href="/signup">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg" data-testid="button-join-captain">
              Get Started
            </Button>
          </Link>
        </div>
      </section>


      {/* Pricing */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">          
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscription</h2>
          <p className="text-gray-600 mb-8">Simple monthly pricing. No commissions.</p>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">$49</div>
                <div className="text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  Unlimited charter listings
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  Direct customer messaging
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  Booking management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  0% commission fees
                </li>
              </ul>

              <Link href="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" data-testid="button-start-subscription">
                  Start Subscription
                </Button>
              </Link>
            </CardContent>
          </Card>
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
                    <div className="flex items-center text-green-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 font-medium">{captain.rating || "New"}</span>
                      {captain.reviewCount !== undefined && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({captain.reviewCount})
                        </span>
                      )}
                    </div>
                    {captain.verified && (
                      <Badge className="bg-green-600 text-white flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{captain.bio || "No bio available."}</p>
                  <div className="flex justify-between mt-2">
                    <Link href={`/captains/${captain.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid={`button-view-profile-${captain.id}`}>View Profile</Button>
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
