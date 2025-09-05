
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import CharterCard from "@/components/charter-card";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Heart, BookOpen } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

export default function SearchResultsUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filters, setFilters] = useState({
    location: "",
    targetSpecies: "",
    duration: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    setFilters({
      location: params.get("location") || "",
      targetSpecies: params.get("targetSpecies") || "",
      duration: params.get("duration") || "",
    });
  }, [location]);

  const { data: charters, isLoading: loadingCharters } = useQuery<CharterWithCaptain[]>({
    queryKey: ["/api/charters", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.location) params.set("location", filters.location);
      if (filters.targetSpecies) params.set("targetSpecies", filters.targetSpecies);
      if (filters.duration) params.set("duration", filters.duration);
      
      const response = await fetch(`/api/charters?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch charters");
      return response.json();
    },
  });

  const handleSearch = (newFilters: { location: string; targetSpecies: string; duration: string }) => {
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (newFilters.location) params.set("location", newFilters.location);
    if (newFilters.targetSpecies) params.set("targetSpecies", newFilters.targetSpecies);
    if (newFilters.duration) params.set("duration", newFilters.duration);
    
    const queryString = params.toString();
    window.history.replaceState({}, "", queryString ? `/user/search?${queryString}` : "/user/search");
  };

  const clearFilters = () => {
    const emptyFilters = { location: "", targetSpecies: "", duration: "" };
    setFilters(emptyFilters);
    window.history.replaceState({}, "", "/user/search");
  };

  const sortedCharters = charters ? [...charters].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "rating":
        return parseFloat(b.captain.rating) - parseFloat(a.captain.rating);
      case "reviews":
        return b.captain.reviewCount - a.captain.reviewCount;
      default:
        return 0;
    }
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderUser />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Search Bar - more compact on mobile */}
        <div className="mb-4 md:mb-8">
          <SearchBar 
            onSearch={handleSearch}
            initialValues={filters}
          />
        </div>

        {/* Quick Actions for logged users */}
        <div className="mb-6 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 whitespace-nowrap"
              onClick={() => window.location.href = "/user/favorites"}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 whitespace-nowrap"
              onClick={() => window.location.href = "/user/reservations"}
            >
              <BookOpen className="w-4 h-4" />
              My Trips
            </Button>
          </div>
        </div>

        {/* Results Header - more compact */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
              Find Your Perfect Charter
            </h1>
            {!loadingCharters && (
              <p className="text-sm md:text-base text-storm-gray">
                {charters?.length || 0} charters found
                {filters.location && ` in ${filters.location}`}
                {filters.targetSpecies && ` for ${filters.targetSpecies}`}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
            <span className="text-xs md:text-sm text-storm-gray">Sort:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 md:w-48 h-8 md:h-10 text-xs md:text-sm">
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

        {/* Results */}
        {loadingCharters ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg md:rounded-2xl overflow-hidden shadow">
                <div className="w-full h-32 md:h-48 bg-gray-200 animate-pulse" />
                <div className="p-3 md:p-6 space-y-2 md:space-y-4">
                  <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedCharters.length === 0 ? (
          <Card>
            <CardContent className="p-6 md:p-12 text-center">
              <Filter className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No charters found</h3>
              <p className="text-sm md:text-base text-storm-gray mb-6">
                Try adjusting your search criteria or browse all available charters.
              </p>
              <Button onClick={clearFilters} size="sm" className="md:text-base">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {sortedCharters.map((charter) => (
              <CharterCard key={charter.id} charter={charter} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
