import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, Star, Shield } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

interface CharterCardProps {
  charter: CharterWithCaptain;
}

export default function CharterCard({ charter }: CharterCardProps) {
  return (
    <Card className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img
        src={charter.images?.[0] || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop"}
        alt={charter.title}
        className="w-full h-48 object-cover"
      />
      
      <CardContent className="p-6">
        {/* Captain Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={charter.captain.avatar || ""} />
              <AvatarFallback>
                {charter.captain.user.firstName[0]}{charter.captain.user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                Captain {charter.captain.user.firstName} {charter.captain.user.lastName}
              </h3>
              <div className="flex items-center">
                {charter.captain.verified && (
                  <Badge className="bg-verified-green text-white text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-500 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 font-semibold">{charter.captain.rating}</span>
              <span className="text-gray-500 text-sm ml-1">
                ({charter.captain.reviewCount})
              </span>
            </div>
          </div>
        </div>
        
        {/* Charter Info */}
        <h4 className="text-lg font-semibold mb-2">{charter.title}</h4>
        <p className="text-storm-gray text-sm mb-3 line-clamp-2">
          {charter.description}
        </p>
        
        {/* Details */}
        <div className="flex items-center text-sm text-storm-gray mb-4 space-x-4">
          <span className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {charter.location}
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {charter.duration}
          </span>
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            Up to {charter.maxGuests}
          </span>
        </div>
        
        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-ocean-blue">
              ${charter.price}
            </span>
            <span className="text-storm-gray text-sm">/trip</span>
          </div>
          <Link href={`/charters/${charter.id}`}>
            <Button className="bg-ocean-blue hover:bg-blue-800 text-white">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
