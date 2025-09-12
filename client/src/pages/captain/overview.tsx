// src/pages/captain/overview.tsx
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

// Header del panel de capitán (nuevo componente reusable)
import HeaderCaptain from "@/components/headercaptain";

// UI base
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Ship,
  Plus,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageSquare,
  Shield,
  Star,
  MapPin,
  Eye,
  Pencil,
  CreditCard,
} from "lucide-react";

/* ========= Tipos compatibles con tu backend ========= */
type CaptainRow = {
  id: number;
  userId: string;
  bio?: string | null;
  experience?: string | null;
  licenseNumber?: string | null;
  location?: string | null;
  avatar?: string | null;
  verified?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  user?: { firstName?: string | null; lastName?: string | null };
};

type Charter = {
  id: number;
  captainId: number;
  title: string;
  description?: string | null;
  location?: string | null;
  images: string[];
  price: number;
  isListed: boolean;
  captain?: {
    id: number;
    name?: string;
    avatar?: string | null;
    verified?: boolean | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
};

export default function CaptainOverview() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Proteger ruta
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  /* === Mi registro de capitán === */
  const {
    data: myCaptain,
    isLoading: capLoading,
  } = useQuery({
    enabled: !!user?.id,
    queryKey: ["captain", user?.id],
    queryFn: async (): Promise<CaptainRow | null> => {
      const r = await fetch("/api/captains", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load captain");
      const list: CaptainRow[] = await r.json();
      return list.find((c) => c.userId === user!.id) ?? null;
    },
    staleTime: 60_000,
  });

  /* === Mis charters === */
  const {
    data: myCharters,
    isLoading: chLoading,
  } = useQuery({
    enabled: !!myCaptain?.id,
    queryKey: ["charters", { captainId: myCaptain?.id }],
    queryFn: async (): Promise<Charter[]> => {
      const r = await fetch(`/api/charters?captainId=${myCaptain!.id}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to load charters");
      return r.json();
    },
  });

  const heroImage = useMemo(() => {
    const img =
      myCharters?.find((c) => c.images && c.images.length)?.images?.[0] ||
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=60&auto=format&fit=crop";
    return img;
  }, [myCharters]);

  const captainName =
    (myCaptain?.user &&
      [myCaptain.user.firstName, myCaptain.user.lastName].filter(Boolean).join(" ")) ||
    user?.firstName ||
    "Captain";

  // Stats derivadas del backend existente
  const totalListings = myCharters?.length ?? 0;
  const listedCount = myCharters?.filter((c) => c.isListed).length ?? 0;
  const unlistedCount = Math.max(totalListings - listedCount, 0);
  const ratingTxt =
    typeof myCaptain?.rating === "number" ? myCaptain.rating.toFixed(1) : "—";
  const reviewsTxt = myCaptain?.reviewCount ?? 0;

  if (isLoading || capLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="mx-auto mb-4 text-ocean-blue animate-pulse" size={48} />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar separado y reusable */}
      <HeaderCaptain />

      {/* HERO con imagen y card */}
      <section className="relative">
        <div
          className="h-48 md:h-64 w-full bg-center bg-cover"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05)), url(${heroImage})`,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
          <Card className="rounded-2xl overflow-hidden shadow-xl border-none bg-white/95 backdrop-blur">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    Welcome back, {captainName}!
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    {myCaptain?.verified ? (
                      <span className="inline-flex items-center text-green-600">
                        <Shield className="w-4 h-4 mr-1" /> Verified captain
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-600">
                        <Shield className="w-4 h-4 mr-1" /> Verification pending
                      </span>
                    )}
                    {typeof myCaptain?.rating === "number" && (
                      <span className="inline-flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        {ratingTxt} ({reviewsTxt})
                      </span>
                    )}
                    {myCaptain?.location && (
                      <span className="inline-flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-ocean-blue" />
                        {myCaptain.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones principales */}
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-ocean-blue hover:bg-blue-800 text-white" asChild>
                    <Link href="/captain/charters/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Charter
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/captain/calendar">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Manage Calendar
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/captain/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/captain/profile">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CONTENIDO */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* ===== Stats ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard
            icon={<CalendarIcon className="h-6 w-6 lg:h-8 lg:w-8 text-ocean-blue" />}
            label="Total Listings"
            value={chLoading ? "…" : totalListings}
          />
          <StatCard
            icon={<Ship className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />}
            label="Listed"
            value={chLoading ? "…" : listedCount}
          />
          <StatCard
            icon={<Ship className="h-6 w-6 lg:h-8 lg:w-8 text-amber-600" />}
            label="Unlisted"
            value={chLoading ? "…" : unlistedCount}
          />
          <StatCard
            icon={<Star className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" />}
            label="Rating / Reviews"
            value={
              typeof myCaptain?.rating === "number"
                ? `${ratingTxt} / ${reviewsTxt}`
                : "—"
            }
          />
        </div>

        {/* ===== Quick Actions + Recent Bookings ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/captain/charters/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Charter
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/captain/calendar">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Manage Calendar
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/captain/analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/captain/bookings">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Bookings
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-ocean-blue/5 to-seafoam-50 border-ocean-blue/20 hover:from-ocean-blue/10 hover:to-seafoam-100" asChild>
                <Link href="/captain/subscribe">
                  <CreditCard className="w-4 h-4 mr-2 text-ocean-blue" />
                  <span className="text-ocean-blue font-medium">Manage Subscription</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Connect your bookings page to see recent activity here.
              </p>
              <Button variant="ghost" className="w-full mt-4 text-sm" asChild>
                <Link href="/captain/bookings">View All Bookings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ===== Charters grid ===== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">Your Charters</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/captain/charters">Manage all</Link>
            </Button>
          </div>

          {chLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden h-64 animate-pulse">
                  <div className="h-36 bg-gray-200" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !myCharters?.length ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <div className="text-3xl">🛥️</div>
                <h3 className="text-lg font-semibold">You have no charters yet</h3>
                <p className="text-gray-600">
                  Create your first listing and start receiving bookings.
                </p>
                <Button className="bg-ocean-blue hover:bg-blue-800 text-white" asChild>
                  <Link href="/captain/charters/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create charter
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {myCharters.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="h-36 w-full overflow-hidden">
                        <img
                          src={
                            c.images?.[0] ||
                            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop"
                          }
                          alt={c.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-semibold truncate">
                              {c.title}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-ocean-blue" />
                              {c.location ?? "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${c.price}</div>
                            <div className="text-xs text-gray-500">per trip</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            {c.isListed ? (
                              <Badge className="bg-green-600 text-white">Listed</Badge>
                            ) : (
                              <Badge variant="secondary">Unlisted</Badge>
                            )}
                            {typeof c.captain?.rating === "number" && (
                              <span className="inline-flex items-center text-sm text-yellow-600">
                                <Star className="w-4 h-4 mr-1" />
                                {c.captain.rating?.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/charters/${c.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="bg-ocean-blue hover:bg-blue-800 text-white"
                              asChild
                            >
                              <Link href="/captain/charters">Manage</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ================== Subcomponentes ================== */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-3 lg:ml-4 min-w-0 flex-1">
            <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">
              {label}
            </p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
