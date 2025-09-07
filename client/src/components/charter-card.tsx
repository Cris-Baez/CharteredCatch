import { useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

interface CharterCardProps {
  charter: CharterWithCaptain;
  onViewOnMap?: (charter: CharterWithCaptain) => void;
  /** Si es true, navega a /user/charters/:id */
  userMode?: boolean;
}

export default function CharterCard({
  charter,
  onViewOnMap,
  userMode = false,
}: CharterCardProps) {
  const images =
    charter.images && charter.images.length > 0
      ? charter.images
      : [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop",
        ];

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const total = images.length;

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActive(idx);
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  // URL dinámico según modo
  const detailUrl = userMode
    ? `/user/charters/${charter.id}`
    : `/charters/${charter.id}`;

  return (
    <Card className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Carrusel */}
      <div className="relative group">
        <Link href={detailUrl}>
          <a aria-label={`Open charter ${charter.title}`} className="block">
            <div
              ref={scrollerRef}
              onScroll={onScroll}
              className="w-full h-44 md:h-48 flex snap-x snap-mandatory scroll-smooth overflow-x-auto overflow-y-hidden no-scrollbar"
            >
              {images.map((src, i) => (
                <div key={i} className="snap-center shrink-0 w-full h-full">
                  <img
                    src={src}
                    alt={`${charter.title} - ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </a>
        </Link>

        {/* Flechas (solo desktop) */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (active > 0) scrollToIndex(active - 1);
              }}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (active < total - 1) scrollToIndex(active + 1);
              }}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Contador */}
        {total > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {active + 1}/{total}
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-4 md:p-5">
        {/* Capitán */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9 md:w-10 md:h-10">
              <AvatarImage src={charter.captain?.avatar || ""} />
              <AvatarFallback>{charter.captain?.name?.[0] || "C"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-xs md:text-sm">
                Capt. {charter.captain?.name || "Unknown"}
              </h3>
              {charter.captain?.verified && (
                <Badge className="bg-green-500 text-white text-[10px] px-1 py-0.5 mt-0.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-500 text-xs md:text-sm">
              <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
              <span className="ml-1 font-semibold">
                {charter.captain?.rating || "New"}
              </span>
              {charter.captain?.reviewCount !== undefined && (
                <span className="text-gray-500 ml-1">
                  ({charter.captain.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Charter Info */}
        <Link href={detailUrl}>
          <h4 className="text-base md:text-lg font-semibold mb-1 hover:text-ocean-blue cursor-pointer line-clamp-1">
            {charter.title}
          </h4>
        </Link>
        <p className="text-storm-gray text-xs md:text-sm mb-3 line-clamp-2">
          {charter.description}
        </p>

        {/* Detalles */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-storm-gray mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {charter.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {charter.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {charter.maxGuests} guests
          </span>
        </div>

        {/* Precio + botón */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg md:text-xl font-bold text-black">
              ${charter.price}
            </span>
            <span className="text-storm-gray text-xs"> /trip</span>
          </div>
          {onViewOnMap && (
            <Button
              variant="outline"
              size="sm"
              className="text-ocean-blue border-ocean-blue hover:bg-ocean-blue hover:text-white text-xs md:text-sm"
              onClick={() => onViewOnMap(charter)}
            >
              View on Map
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* 🚫 Ocultar scrollbar sin quitar scroll */
const style = document.createElement("style");
style.innerHTML = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
document.head.appendChild(style);
