import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import HeaderCaptain from "@/components/headercaptain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Ship,
  Plus,
  Edit,
  Eye,
  Search,
  MapPin,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";

/** Charter type aligned with your backend schema */
type Charter = {
  id: number;
  captainId: number;
  title: string;
  description: string | null;
  location: string;
  lat?: number | null;
  lng?: number | null;
  targetSpecies: string | null;
  duration: string | null;
  maxGuests: number;
  price: number;
  boatSpecs?: string | null;
  included?: string | null;
  images?: string[] | null;
  available: boolean;
  isListed: boolean;
};

export default function CaptainCharters() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const { data: charters, isLoading, isError, refetch } = useQuery<Charter[]>({
    queryKey: ["/api/captain/charters"],
    queryFn: async () => {
      const res = await fetch("/api/captain/charters", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch charters");
      return res.json();
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // filtro local por título, ubicación, especies, specs
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!charters || !q) return charters || [];
    return charters.filter((c) => {
      const haystack = [
        c.title,
        c.location,
        c.targetSpecies || "",
        c.boatSpecs || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [charters, query]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={64} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-storm-gray mb-6">
              Please log in to access your captain dashboard
            </p>
            <Button asChild>
              <Link href="/api/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header unificado */}
      <HeaderCaptain />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">My Charter Listings</h2>
              <p className="text-storm-gray">
                Manage and optimize your fishing charter listings
              </p>
            </div>
            <Button asChild>
              <Link href="/captain/charters/new">
                <Plus className="w-4 h-4 mr-2" />
                Create New Charter
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray"
                size={20}
              />
              <Input
                placeholder="Search your charters…"
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear
            </Button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">Failed to load your charters.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((charter) => {
              const image =
                (charter.images && charter.images[0]) || "/fishing1.jpg";
              return (
                <Card
                  key={charter.id}
                  className="hover:shadow-lg transition-shadow overflow-hidden rounded-xl"
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt={charter.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge
                        variant={charter.isListed ? "default" : "secondary"}
                        className={
                          charter.isListed ? "" : "bg-gray-200 text-gray-700"
                        }
                      >
                        {charter.isListed ? "Published" : "Unpublished"}
                      </Badge>
                      <Badge
                        className={
                          charter.available
                            ? "bg-green-600 text-white"
                            : "bg-gray-400 text-white"
                        }
                      >
                        {charter.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {charter.title}
                    </h3>

                    <div className="space-y-2 mb-4 text-sm text-storm-gray">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{charter.location}</span>
                      </div>
                      {charter.duration && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{charter.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Up to {charter.maxGuests} guests</span>
                      </div>
                      <div className="flex items-center font-semibold text-ocean-blue">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{fmtUSD(charter.price)}</span>
                      </div>

                      {(charter.targetSpecies || charter.boatSpecs) && (
                        <div className="pt-2 border-t text-xs text-gray-600">
                          {charter.targetSpecies && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Species:
                              </span>{" "}
                              {charter.targetSpecies}
                            </div>
                          )}
                          {charter.boatSpecs && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Boat:
                              </span>{" "}
                              {charter.boatSpecs}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Preview público */}
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/charters/${charter.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Link>
                      </Button>
                      {/* Edit (ruta interna) */}
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/captain/charters/${charter.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Ship className="mx-auto mb-4 text-storm-gray" size={80} />
              <h3 className="text-xl font-semibold mb-2">No Charters Listed</h3>
              <p className="text-storm-gray mb-6">
                Start earning by creating your first fishing charter listing
              </p>
              <Button asChild>
                <Link href="/captain/charters/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Charter
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Tips for Better Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Photography</h4>
                <ul className="space-y-1">
                  <li>• Use high-quality photos of your boat</li>
                  <li>• Show fishing equipment and amenities</li>
                  <li>• Include action shots of fishing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Descriptions</h4>
                <ul className="space-y-1">
                  <li>• Mention target species and techniques</li>
                  <li>• Highlight included equipment and services</li>
                  <li>• Share your experience and local knowledge</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
