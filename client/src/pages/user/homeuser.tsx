import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// UI
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  MapPin,
  Star,
  User as UserIcon,
  X,
  Map as MapIcon,
  Filter,
} from "lucide-react";

// Mapa
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  type MapRef,
} from "react-map-gl";

// Tipos
import type { CharterWithCaptain } from "@shared/schema";

// Componentes existentes
import CharterCard from "@/components/charter-card";
// @ts-ignore  // usamos tu componente existente
import MapPopupCard from "@/components/MapPopupCard";

const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic2hha2EzMzMiLCJhIjoiY21ldGZ2NjkwMGNwNjJrcG93ZHEzdTZkOCJ9.Ymjjhd5zG5nwwdRAx5TZMw";

type Filters = {
  location: string;
  targetSpecies: string;
  duration: string;
  date?: string;
};

type Mode = "home" | "search";

export default function HomeUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // =========================
  // ESTADO DE LA PÁGINA
  // =========================
  const [mode, setMode] = useState<Mode>("home"); // "home" (recomendaciones) | "search" (resultados con mapa)
  const [filters, setFilters] = useState<Filters>({
    location: "",
    targetSpecies: "",
    duration: "",
    date: "",
  });

  // =========================
  // RECOMENDADOS (MODO HOME)
  // =========================
  const {
    data: recommendedCharters,
    isLoading: loadingRecommended,
    error: errorRecommended,
  } = useQuery<CharterWithCaptain[]>({
    queryKey: ["charters", "home-recommended"],
    queryFn: async () => {
      const response = await fetch("/api/charters");
      if (!response.ok) throw new Error("Failed to fetch charters");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: mode === "home",
  });

  // =========================
  // RESULTADOS (MODO SEARCH)
  // =========================
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.location) p.set("location", filters.location);
    if (filters.targetSpecies) p.set("targetSpecies", filters.targetSpecies);
    if (filters.duration) p.set("duration", filters.duration);
    // la API actual no filtra por date, pero preservamos el valor
    if (filters.date) p.set("date", filters.date);
    return p.toString();
  }, [filters]);

  const {
    data: searchCharters,
    isLoading: loadingSearch,
    error: errorSearch,
  } = useQuery<CharterWithCaptain[]>({
    queryKey: ["charters", "search", filters],
    queryFn: async () => {
      const url = queryString ? `/api/charters?${queryString}` : "/api/charters";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch charters");
      return res.json();
    },
    enabled: mode === "search",
    // en v5 ya no existe keepPreviousData. Con staleTime y mismo key evitamos parpadeos.
  });

  // =========================
  // GEOLOCALIZACIÓN
  // =========================
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 25, // Miami fallback
    lng: -80,
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // keep fallback
        },
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 }
      );
    }
  }, []);

  // =========================
  // MAPA (MODO SEARCH)
  // =========================
  const mapRef = useRef<MapRef | null>(null);
  const [selected, setSelected] = useState<CharterWithCaptain | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  const handleViewOnMap = (c: CharterWithCaptain) => {
    setSelected(c);
    const targetLng = c.lng ?? userCoords.lng;
    const targetLat = c.lat ?? userCoords.lat;
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [targetLng, targetLat],
        zoom: Math.max((mapRef.current.getZoom?.() as number) ?? 6, 11),
        duration: 900,
        essential: true,
      });
    }
    // en móvil, abrimos el overlay del mapa si está cerrado
    if (mobileMapOpen === false) {
      setMobileMapOpen(true);
    }
  };

  const onSearch = (newFilters: Filters) => {
    setFilters(newFilters);
    setMode("search");
    // scroll a la sección de resultados
    requestAnimationFrame(() => {
      const el = document.getElementById("results-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const homeCharters: CharterWithCaptain[] = recommendedCharters ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />

      {/* HERO + SEARCH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Angler"} 🎣
          </h1>
          <p className="text-gray-600">Ready for your next fishing adventure?</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <SearchBar onSearch={onSearch} />
          {mode === "search" && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-gray-700">
                {filters.location || "Anywhere"}
              </Badge>
              {filters.targetSpecies && (
                <Badge variant="secondary" className="text-gray-700">
                  {filters.targetSpecies}
                </Badge>
              )}
              {filters.duration && (
                <Badge variant="secondary" className="text-gray-700">
                  {filters.duration}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setMode("home")}
              >
                Back to Home
              </Button>
            </div>
          )}
        </motion.div>

        {/* =========================
            CONTENIDO HOME (RECOMENDACIONES)
           ========================= */}
        <AnimatePresence initial={false}>
          {mode === "home" && (
            <motion.div
              key="home-sections"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              {/* Recommended for you */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Recommended for you
                </h2>

                {loadingRecommended ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <div className="h-40 bg-gray-200 animate-pulse" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : errorRecommended ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">
                      Failed to load recommendations
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : homeCharters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No charters available at the moment
                    </p>
                    <Button onClick={() => setMode("search")} variant="outline">
                      Browse All Charters
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile Carousel */}
                    <div className="md:hidden">
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {homeCharters.map((c: CharterWithCaptain, idx: number) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.06 }}
                            className="flex-shrink-0 w-72"
                            onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                          >
                            <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl">
                              <img
                                src={c.images?.[0] || "/placeholder.jpg"}
                                alt={c.title}
                                className="h-40 w-full object-cover"
                              />
                              <CardContent className="p-4 space-y-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {c.title}
                                </h3>
                                <p className="flex items-center text-gray-600 text-sm">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {c.location}
                                </p>
                                <p className="flex items-center text-gray-600 text-sm">
                                  <UserIcon className="w-4 h-4 mr-1" />
                                  Capt. {c.captain?.name}
                                </p>
                                <div className="flex justify-between items-center mt-3">
                                  <span className="flex items-center text-yellow-500">
                                    <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                                    {c.captain?.rating}
                                  </span>
                                  <span className="font-semibold text-ocean-blue">
                                    ${c.price}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                      {homeCharters.map((c: CharterWithCaptain, idx: number) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.06 }}
                          onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                        >
                          <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl cursor-pointer">
                            <img
                              src={c.images?.[0] || "/placeholder.jpg"}
                              alt={c.title}
                              className="h-40 w-full object-cover"
                            />
                            <CardContent className="p-4 space-y-2">
                              <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                              <p className="flex items-center text-gray-600 text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                {c.location}
                              </p>
                              <p className="flex items-center text-gray-600 text-sm">
                                <UserIcon className="w-4 h-4 mr-1" />
                                Capt. {c.captain?.name}
                              </p>
                              <div className="flex justify-between items-center mt-3">
                                <span className="flex items-center text-yellow-500">
                                  <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                                  {c.captain?.rating}
                                </span>
                                <span className="font-semibold text-ocean-blue">
                                  ${c.price}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Popular Near You */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Popular near you
                </h2>

                {/* Mobile Carousel */}
                <div className="md:hidden">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {homeCharters
                      .slice()
                      .reverse()
                      .map((c: CharterWithCaptain, idx: number) => (
                        <motion.div
                          key={`popular-${c.id}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.06 }}
                          className="flex-shrink-0 w-72"
                          onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                        >
                          <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl">
                            <img
                              src={c.images?.[0] || "/placeholder.jpg"}
                              alt={c.title}
                              className="h-40 w-full object-cover"
                            />
                            <CardContent className="p-4 space-y-2">
                              <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                              <p className="flex items-center text-gray-600 text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                {c.location}
                              </p>
                              <p className="flex items-center text-gray-600 text-sm">
                                <UserIcon className="w-4 h-4 mr-1" />
                                Capt. {c.captain?.name}
                              </p>
                              <div className="flex justify-between items-center mt-3">
                                <span className="flex items-center text-yellow-500">
                                  <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                                  {c.captain?.rating}
                                </span>
                                <span className="font-semibold text-ocean-blue">
                                  ${c.price}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {homeCharters
                    .slice()
                    .reverse()
                    .map((c: CharterWithCaptain, idx: number) => (
                      <motion.div
                        key={`popular-${c.id}`}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.06 }}
                        onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                      >
                        <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl cursor-pointer">
                          <img
                            src={c.images?.[0] || "/placeholder.jpg"}
                            alt={c.title}
                            className="h-40 w-full object-cover"
                          />
                          <CardContent className="p-4 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                            <p className="flex items-center text-gray-600 text-sm">
                              <MapPin className="w-4 h-4 mr-1" />
                              {c.location}
                            </p>
                            <p className="flex items-center text-gray-600 text-sm">
                              <UserIcon className="w-4 h-4 mr-1" />
                              Capt. {c.captain?.name}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="flex items-center text-yellow-500">
                                <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                                {c.captain?.rating}
                              </span>
                              <span className="font-semibold text-ocean-blue">
                                ${c.price}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </section>

              {/* Top rated */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Top rated charters
                </h2>
                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {homeCharters.slice(0, 3).map((c: CharterWithCaptain, idx: number) => (
                      <motion.div
                        key={`top-${c.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.06 }}
                        className="flex-shrink-0 w-72"
                        onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                      >
                        <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl">
                          <img
                            src={c.images?.[0] || "/placeholder.jpg"}
                            alt={c.title}
                            className="h-40 w-full object-cover"
                          />
                          <CardContent className="p-4 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {c.title}
                            </h3>
                            <p className="flex items-center text-gray-600 text-sm">
                              <MapPin className="w-4 h-4 mr-1" />
                              {c.location}
                            </p>
                            <p className="flex items-center text-gray-600 text-sm">
                              <UserIcon className="w-4 h-4 mr-1" />
                              Capt. {c.captain?.name}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="flex items-center text-yellow-500">
                                <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                                {c.captain?.rating}
                              </span>
                              <span className="font-semibold text-ocean-blue">
                                ${c.price}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {homeCharters.slice(0, 3).map((c: CharterWithCaptain, idx: number) => (
                    <motion.div
                      key={`top-${c.id}`}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.06 }}
                      onClick={() => (window.location.href = `/user/charters/${c.id}`)}
                    >
                      <Card className="overflow-hidden shadow hover:shadow-lg transition rounded-2xl cursor-pointer">
                        <img
                          src={c.images?.[0] || "/placeholder.jpg"}
                          alt={c.title}
                          className="h-40 w-full object-cover"
                        />
                        <CardContent className="p-4 space-y-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {c.title}
                          </h3>
                          <p className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            {c.location}
                          </p>
                          <p className="flex items-center text-gray-600 text-sm">
                            <UserIcon className="w-4 h-4 mr-1" />
                            Capt. {c.captain?.name}
                          </p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                              {c.captain?.rating}
                            </span>
                            <span className="font-semibold text-ocean-blue">
                              ${c.price}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ANCLA DE RESULTADOS */}
        <div id="results-anchor" />

        {/* =========================
            CONTENIDO SEARCH (LIST + MAP)
           ========================= */}
        <AnimatePresence initial={false}>
          {mode === "search" && (
            <motion.div
              key="search-sections"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              {/* Barra de herramientas (móvil) */}
              <div className="flex items-center justify-between lg:hidden mb-3">
                <span className="text-sm text-gray-600">
                  {loadingSearch
                    ? "Loading…"
                    : `${(searchCharters?.length ?? 0)} results`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMobileMapOpen(true)}
                  >
                    <MapIcon className="w-4 h-4 mr-1" />
                    Open Map
                  </Button>
                  <Button size="sm" variant="outline">
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LISTA */}
                <div className="lg:col-span-2 space-y-4">
                  {loadingSearch ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="h-44 bg-gray-200 animate-pulse" />
                          <CardContent className="p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : errorSearch ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4">Failed to load results</p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  ) : (searchCharters?.length ?? 0) === 0 ? (
                    <div className="text-gray-600">No charters match your filters.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(searchCharters as CharterWithCaptain[]).map(
                        (c: CharterWithCaptain) => (
                          <CharterCard
                            key={c.id}
                            charter={c}
                            onViewOnMap={handleViewOnMap}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* MAPA DESKTOP (sticky, bordeado) */}
                <div className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-24">
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                      <Map
                        ref={mapRef}
                        mapboxAccessToken={MAPBOX_TOKEN}
                        initialViewState={{
                          longitude: userCoords.lng,
                          latitude: userCoords.lat,
                          zoom: 7,
                          bearing: 0,
                          pitch: 0,
                        }}
                        style={{ width: "100%", height: "calc(100vh - 7rem)" }}
                        mapStyle="mapbox://styles/mapbox/outdoors-v12"
                      >
                        <NavigationControl position="top-left" />
                        <GeolocateControl position="top-left" />
                        {(searchCharters ?? []).map((c: CharterWithCaptain) =>
                          typeof c.lng === "number" && typeof c.lat === "number" ? (
                            <Marker
                              key={c.id}
                              longitude={c.lng}
                              latitude={c.lat}
                              onClick={() => handleViewOnMap(c)}
                            >
                              <div
                                className="w-9 h-9 rounded-full bg-white shadow ring-2 ring-ocean-blue grid place-items-center cursor-pointer hover:scale-105 transition"
                                title={c.title}
                              >
                                <span className="text-lg" role="img" aria-label="boat">
                                  🚤
                                </span>
                              </div>
                            </Marker>
                          ) : null
                        )}

                        {selected &&
                          typeof selected.lng === "number" &&
                          typeof selected.lat === "number" && (
                            <Popup
                              longitude={selected.lng}
                              latitude={selected.lat}
                              anchor="bottom"
                              closeOnClick={false}
                              onClose={() => setSelected(null)}
                            >
                              <MapPopupCard
                                charter={selected}
                                onClose={() => setSelected(null)}
                                onViewDetails={(id: number) => {
                                  window.location.href = `/user/charters/${id}`;
                                }}
                              />
                            </Popup>
                          )}
                      </Map>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAPA MÓVIL (overlay) */}
              <AnimatePresence>
                {mobileMapOpen && (
                  <motion.div
                    className="fixed inset-0 z-50 bg-white"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  >
                    <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-white/90 backdrop-blur border-b">
                      <div className="text-sm text-gray-700">
                        {searchCharters?.length ?? 0} results
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMobileMapOpen(false)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Close
                        </Button>
                      </div>
                    </div>

                    <div className="w-full h-full pt-12">
                      <Map
                        ref={mapRef}
                        mapboxAccessToken={MAPBOX_TOKEN}
                        initialViewState={{
                          longitude: userCoords.lng,
                          latitude: userCoords.lat,
                          zoom: 7,
                          bearing: 0,
                          pitch: 0,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="mapbox://styles/mapbox/outdoors-v12"
                      >
                        <NavigationControl position="top-left" />
                        <GeolocateControl position="top-left" />
                        {(searchCharters ?? []).map((c: CharterWithCaptain) =>
                          typeof c.lng === "number" && typeof c.lat === "number" ? (
                            <Marker
                              key={`m-${c.id}`}
                              longitude={c.lng}
                              latitude={c.lat}
                              onClick={() => handleViewOnMap(c)}
                            >
                              <div
                                className="w-10 h-10 rounded-full bg-white shadow ring-2 ring-ocean-blue grid place-items-center cursor-pointer hover:scale-105 transition"
                                title={c.title}
                              >
                                <span className="text-xl" role="img" aria-label="boat">
                                  🚤
                                </span>
                              </div>
                            </Marker>
                          ) : null
                        )}

                        {selected &&
                          typeof selected.lng === "number" &&
                          typeof selected.lat === "number" && (
                            <Popup
                              longitude={selected.lng}
                              latitude={selected.lat}
                              anchor="bottom"
                              closeOnClick={false}
                              onClose={() => setSelected(null)}
                            >
                              <MapPopupCard
                                charter={selected}
                                onClose={() => setSelected(null)}
                                onViewDetails={(id: number) => {
                                  window.location.href = `/user/charters/${id}`;
                                }}
                              />
                            </Popup>
                          )}
                      </Map>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
