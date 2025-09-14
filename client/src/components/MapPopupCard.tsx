// src/components/MapPopupCard.tsx
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
  const imgSrc =
    charter.images?.[0] ||
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80&auto=format&fit=crop";

  const rating =
    charter.captain?.rating != null
      ? Number(charter.captain.rating).toFixed(1)
      : "0.0";

  const reviews = charter.captain?.reviewCount ?? 0;

  return (
    <Card className="w-[200px] md:w-[220px] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Imagen compacta con tag de precio */}
      <div className="relative">
        <img
          src={imgSrc}
          alt={charter.title}
          className="w-full h-20 md:h-24 object-cover"
          loading="lazy"
        />
        <div data-testid={`price-badge-${charter.id}`} className="absolute bottom-1 left-1.5 rounded bg-black/60 text-white text-[10px] px-1 py-0.5 font-semibold">
          ${charter.price}
        </div>
      </div>

      <CardContent className="p-2 space-y-1.5">
        {/* Título + badge specs */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-xs font-semibold text-gray-900 line-clamp-1">
            {charter.title}
          </h3>
          {charter.boatSpecs && (
            <Badge className="bg-ocean-blue/10 text-ocean-blue text-[9px] max-w-[90px] truncate">
              {charter.boatSpecs}
            </Badge>
          )}
        </div>

        {/* Descripción mini */}
        {charter.description && (
          <p className="text-[11px] text-gray-600 line-clamp-2 leading-snug">
            {charter.description}
          </p>
        )}

        {/* Meta compacta */}
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{charter.location}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center">
              <Clock className="w-3 h-3 mr-0.5" />
              {charter.duration}
            </span>
            <span className="inline-flex items-center">
              <Users className="w-3 h-3 mr-0.5" />
              {charter.maxGuests}
            </span>
          </div>
        </div>

        {/* Rating + Precio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-yellow-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="ml-1 text-[11px] font-medium text-gray-900">
              {rating}
            </span>
            {reviews ? (
              <span className="ml-1 text-[10px] text-gray-500">({reviews})</span>
            ) : null}
          </div>
          <div className="text-sm font-bold text-gray-900">
            ${charter.price}
          </div>
        </div>

        {/* Acciones mini */}
        <div className="flex justify-end gap-1 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            data-testid={`button-close-${charter.id}`}
            className="h-6 px-2 text-[11px] text-gray-600"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={onViewDetails}
            data-testid={`button-details-${charter.id}`}
            className="h-6 px-2 text-[11px] bg-ocean-blue text-white hover:bg-blue-800"
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

