// src/pages/captain-detail.tsx
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CharterCard from "@/components/charter-card";
import {
  Star,
  Shield,
  MapPin,
  Briefcase,
  Award,
  MessageCircle,
} from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

interface Captain {
  id: number;
  userId: string;
  bio: string;
  experience: string;
  licenseNumber: string;
  location: string;
  avatar: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

export default function CaptainDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Query capitán
  const { data: captain, isLoading } = useQuery<Captain>({
    queryKey: ["captain", id],
    queryFn: async () => {
      const res = await fetch(`/api/captains/${id}`);
      if (!res.ok) throw new Error("Failed to fetch captain");
      return res.json();
    },
    enabled: !!id,
  });

  // Query charters de este capitán
  const { data: charters } = useQuery<CharterWithCaptain[]>({
    queryKey: ["charters-by-captain", id],
    queryFn: async () => {
      const res = await fetch(`/api/charters?captainId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch charters");
      return res.json();
    },
    enabled: !!id,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
          <div className="h-40 bg-gray-200 rounded-lg mb-6" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!captain) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="text-center p-10">
              <h1 className="text-2xl font-bold mb-4">Captain Not Found</h1>
              <Button onClick={() => setLocation("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fullName = `${captain.user.firstName ?? ""} ${
    captain.user.lastName ?? ""
  }`.trim();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header del capitán */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-12">
          <Avatar className="w-32 h-32 border-4 border-white shadow-md">
            <AvatarImage src={captain.avatar || ""} />
            <AvatarFallback>{fullName[0] || "C"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900">
              Captain {fullName || "Unknown"}
            </h1>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-3">
              {captain.verified && (
                <Badge className="bg-green-500 text-white text-xs flex items-center">
                  <Shield className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              <div className="flex items-center text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-semibold">
                  {captain.rating || "New"}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                  ({captain.reviewCount} reviews)
                </span>
              </div>
            </div>

            <p className="text-gray-600 mt-4 max-w-2xl mx-auto lg:mx-0">
              {captain.bio}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mt-5 justify-center lg:justify-start">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {captain.location}
              </span>
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {captain.experience}
              </span>
              <span className="flex items-center">
                <Award className="w-4 h-4 mr-1" />
                License {captain.licenseNumber}
              </span>
            </div>

            <div className="mt-6 flex justify-center lg:justify-start">
              <Button
                className="bg-ocean-blue hover:bg-deep-blue text-white"
                onClick={() => setLocation("/messages")}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Message Captain
              </Button>
            </div>
          </div>
        </div>

        {/* Charters del capitán */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Available Charters</h2>
          {charters && charters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {charters.map((charter) => (
                <CharterCard key={charter.id} charter={charter} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              This captain has no active charters at the moment.
            </p>
          )}
        </div>

        {/* Recursos para capitanes */}
        <Card>
          <CardHeader>
            <CardTitle>Captain Resources</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-3">
            <p>
              As a captain, you have access to powerful tools to grow your
              business and reach more customers.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Manage your charters, bookings, and earnings in your dashboard.</li>
              <li>Upgrade to premium subscriptions for better visibility.</li>
              <li>Access exclusive resources and training for captains.</li>
              <li>Follow our safety and quality standards to build trust.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
