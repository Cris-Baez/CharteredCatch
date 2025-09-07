import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Map, { Marker, Popup, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import CharterCard from "@/components/charter-card";
import MapPopupCard from "@/components/MapPopupCard";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter, Ship, MapPin } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || "pk.eyJ1Ijoic2hha2EzMzMiLCJhIjoiY21ldGZ2NjkwMGNwNjJrcG93ZHEzdTZkOCJ9.Ymjjhd5zG5nwwdRAx5TZMw";

/** Util: parse float seguro desde string/number/undefined */
function toFloat(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  const n = typeof x === "number" ? x : parseFloat(String(x));
  return Number.isFinite(n) ? n : null;
}

/** Util: centra el mapa en un charter */
function centerOnCharter(
  mapRef: React.RefObject<MapRef>,
  charter: CharterWithCaptain,
  zoom = 11
) {
  const lat = toFloat(charter.lat);
  const lng = toFloat(charter.lng);
  if (!mapRef.current || lat === null || lng === null) return;
  mapRef.current.easeTo({ center: [lng, lat], zoom, duration: 600 });
}

export default function SearchResults() {
  const [locationStr] = useLocation();
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filters, setFilters] = useState({
    location: "",
    targetSpecies: "",
    duration: "",
  });

  // Popup seleccionado (desktop y mobile)
  const [selectedCharterId, setSelectedCharterId] = useState<number | null>(null);

  // Mobile map sheet
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  // Map refs (desktop y móvil)
  const desktopMapRef = useRef<MapRef | null>(null);
  const mobileMapRef = useRef<MapRef | null>(null);

  // Parse URL params
  useEffect(() => {
    const params = new URLSearchParams(locationStr.split("?")[1] || "");
    setFilters({
      location: params.get("location") || "",
      targetSpecies: params.get("targetSpecies") || "",
      duration: params.get("duration") || "",
    });
  }, [locationStr]);

  // Query de charters
  const { data: charters, isLoading } = useQuery<CharterWithCaptain[]>({
    queryKey: ["/api/charters", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.location) params.set("location", filters.location);
      if (filters.targetSpecies) params.set("targetSpecies", filters.targetSpecies);
      if (filters.duration) params.set("duration", filters.duration);
      const res = await fetch(`/api/charters?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch charters");
      return res.json();
    },
  });

  // Ordenar resultados
  const sortedCharters = useMemo(() => {
    if (!charters) return [];
    const list = [...charters];
    list.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "rating":
          return parseFloat(b.captain.rating || "0") - parseFloat(a.captain.rating || "0");
        case "reviews":
          return (b.captain.reviewCount || 0) - (a.captain.reviewCount || 0);
        default:
          return 0;
      }
    });
    return list;
  }, [charters, sortBy]);

  // Geolocalización: centrado inicial si el user lo permite
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        desktopMapRef.current?.easeTo({ center: [longitude, latitude], zoom: 9, duration: 600 });
      },
      () => {
        // si falla, no hacemos nada. El mapa queda en su default
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // SearchBar ⇒ filtros + URL
  const handleSearch = (newFilters: { location: string; targetSpecies: string; duration: string }) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.location) params.set("location", newFilters.location);
    if (newFilters.targetSpecies) params.set("targetSpecies", newFilters.targetSpecies);
    if (newFilters.duration) params.set("duration", newFilters.duration);
    const queryString = params.toString();
    window.history.replaceState({}, "", queryString ? `/search?${queryString}` : "/search");
  };

  const clearFilters = () => {
    const empty = { location: "", targetSpecies: "", duration: "" };
    setFilters(empty);
    window.history.replaceState({}, "", "/search");
  };

  // Cuando presionas "View on Map" en el card:
  const handleViewOnMap = useCallback((charter: CharterWithCaptain) => {
    setSelectedCharterId(charter.id);

    // Desktop: mueve el mapa de la derecha y abre popup
    centerOnCharter(desktopMapRef, charter);

    // Móvil: abrir sheet con mapa y centrar
    setMobileMapOpen(true);
    setTimeout(() => {
      // resize por si el map se inicializa oculto
      mobileMapRef.current?.resize();
      centerOnCharter(mobileMapRef, charter);
    }, 350);
  }, []);

  const selectedCharter = useMemo(
    () => (selectedCharterId ? sortedCharters.find((c) => c.id === selectedCharterId) || null : null),
    [selectedCharterId, sortedCharters]
  );

  // Centrar mapa (desktop) si cambia selectedCharter desde otro lado (ej, pinch en marker)
  useEffect(() => {
    if (selectedCharter) centerOnCharter(desktopMapRef, selectedCharter);
  }, [selectedCharter]);

  // Helper: marker click
  const onMarkerClick = (e: any, charter: CharterWithCaptain, target: "desktop" | "mobile") => {
    e?.originalEvent?.stopPropagation?.();
    setSelectedCharterId(charter.id);
    if (target === "desktop") {
      centerOnCharter(desktopMapRef, charter);
    } else {
      centerOnCharter(mobileMapRef, charter);
    }
  };

  // Vista inicial del mapa (fallback)
  const initialCenter = useMemo(() => {
    // si hay resultados con lat/lng, centra en el primero
    const firstWithCoords = sortedCharters.find((c) => toFloat(c.lat) !== null && toFloat(c.lng) !== null);
    if (firstWithCoords) {
      return { lng: toFloat(firstWithCoords.lng)!, lat: toFloat(firstWithCoords.lat)!, zoom: 6 };
    }
    // default Caribe/Florida
    return { lng: -80, lat: 25, zoom: 4 };
  }, [sortedCharters]);

  // Fallback si no hay token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-2">Mapbox token missing</h2>
              <p className="text-storm-gray">
                Define <code className="font-mono">VITE_MAPBOX_TOKEN</code> en tu entorno para habilitar el mapa.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* SearchBar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <SearchBar onSearch={handleSearch} initialValues={filters} />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
        {/* LISTA */}
        <div className="lg:col-span-2">
          {/* Header de resultados */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Search Results</h1>
              {!isLoading && (
                <p className="text-storm-gray">
                  {sortedCharters.length} charters found
                  {filters.location && ` in ${filters.location}`}
                  {filters.targetSpecies && ` for ${filters.targetSpecies}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 md:mt-0">
              <span className="text-sm text-storm-gray">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow h-72 animate-pulse" />
              ))}
            </div>
          ) : sortedCharters.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No charters found</h3>
                <p className="text-storm-gray mb-6">Try adjusting your filters or browse all.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedCharters.map((charter) => (
                <CharterCard
                  key={charter.id}
                  charter={charter}
                  onViewOnMap={() => handleViewOnMap(charter)}
                />
              ))}
            </div>
          )}
        </div>

        {/* MAPA DESKTOP (sticky, bordeado) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
              <div className="aspect-square w-full">
                <Map
                  ref={desktopMapRef}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{
                    longitude: initialCenter.lng,
                    latitude: initialCenter.lat,
                    zoom: initialCenter.zoom,
                    bearing: 0,
                    pitch: 0,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/outdoors-v12"
                >
                  {sortedCharters.map((c) => {
                    const lat = toFloat(c.lat);
                    const lng = toFloat(c.lng);
                    if (lat === null || lng === null) return null;
                    return (
                      <Marker
                        key={c.id}
                        longitude={lng}
                        latitude={lat}
                        anchor="bottom"
                        onClick={(e: any) => onMarkerClick(e, c, "desktop")}
                      >
                        <div className="relative">
                          <Ship className="w-8 h-8 text-ocean-blue drop-shadow-lg" />
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ocean-blue rounded-full" />
                        </div>
                      </Marker>
                    );
                  })}

                  {selectedCharter && toFloat(selectedCharter.lat) !== null && toFloat(selectedCharter.lng) !== null && (
                    <Popup
                      longitude={toFloat(selectedCharter.lng)!}
                      latitude={toFloat(selectedCharter.lat)!}
                      onClose={() => setSelectedCharterId(null)}
                      closeOnClick={false}
                      anchor="top"
                      maxWidth="320px"
                    >
                      <MapPopupCard charter={selectedCharter} />
                    </Popup>
                  )}
                </Map>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN FLOTANTE PARA ABRIR MAPA EN MÓVIL */}
      <div className="lg:hidden fixed bottom-5 left-0 right-0 flex justify-center z-40">
        <Sheet open={mobileMapOpen} onOpenChange={setMobileMapOpen}>
          <SheetTrigger asChild>
            <Button className="bg-ocean-blue hover:bg-blue-800 text-white shadow-xl rounded-full px-5 py-5">
              <MapPin className="w-5 h-5 mr-2" />
              Open Map
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-2xl overflow-hidden">
            <div className="h-full w-full">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-semibold">Charters Map</div>
                <Button variant="ghost" size="sm" onClick={() => setMobileMapOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="h-[calc(85vh-56px)] w-full">
                <Map
                  ref={mobileMapRef}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{
                    longitude: initialCenter.lng,
                    latitude: initialCenter.lat,
                    zoom: initialCenter.zoom,
                    bearing: 0,
                    pitch: 0,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/outdoors-v12"
                  onLoad={() => {
                    // asegura tamaño tras abrir el sheet
                    setTimeout(() => mobileMapRef.current?.resize(), 200);
                  }}
                >
                  {sortedCharters.map((c) => {
                    const lat = toFloat(c.lat);
                    const lng = toFloat(c.lng);
                    if (lat === null || lng === null) return null;
                    return (
                      <Marker
                        key={`m-${c.id}`}
                        longitude={lng}
                        latitude={lat}
                        anchor="bottom"
                        onClick={(e: any) => onMarkerClick(e, c, "mobile")}
                      >
                        <div className="relative">
                          <Ship className="w-9 h-9 text-ocean-blue drop-shadow-xl" />
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-ocean-blue rounded-full" />
                        </div>
                      </Marker>
                    );
                  })}

                  {selectedCharter && toFloat(selectedCharter.lat) !== null && toFloat(selectedCharter.lng) !== null && (
                    <Popup
                      longitude={toFloat(selectedCharter.lng)!}
                      latitude={toFloat(selectedCharter.lat)!}
                      onClose={() => setSelectedCharterId(null)}
                      closeOnClick={false}
                      anchor="top"
                      maxWidth="320px"
                    >
                      <MapPopupCard charter={selectedCharter} />
                    </Popup>
                  )}
                </Map>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Footer />
    </div>
  );
}
