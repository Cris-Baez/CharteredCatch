import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock, Star } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

interface MapPopupCardProps {
  charter: CharterWithCaptain;
  onClose: () => void;
  onViewDetails: () => void;
}

export default function MapPopupCard({
  charter,
  onClose,
  onViewDetails,
}: MapPopupCardProps) {
  return (
    <Card className="w-72 bg-white rounded-xl shadow-lg overflow-hidden">
      <img
        src={
          charter.images?.[0] ||
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop"
        }
        alt={charter.title}
        className="w-full h-32 object-cover"
      />
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {charter.title}
          </h3>
          <Badge className="bg-ocean-blue/10 text-ocean-blue text-[10px]">
            {charter.boatSpecs}
          </Badge>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          {charter.description}
        </p>

        <div className="flex items-center text-xs text-gray-500 mb-2 gap-2">
          <MapPin className="w-3 h-3" />
          {charter.location}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mb-3">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" /> {charter.duration}
          </span>
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" /> {charter.maxGuests} guests
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="ml-1 text-sm font-medium">
              {charter.captain.rating}
            </span>
          </div>
          <div className="text-sm font-bold text-gray-900">
            ${charter.price}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-gray-500"
          >
            Close
          </Button>
          <Button
            size="sm"
            className="bg-ocean-blue text-white hover:bg-blue-800"
            onClick={onViewDetails}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
