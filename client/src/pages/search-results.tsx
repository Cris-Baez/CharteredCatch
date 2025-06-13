import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import CharterCard from "@/components/charter-card";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

export default function SearchResults() {
  const [location] = useLocation();
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filters, setFilters] = useState({
    location: "",
    targetSpecies: "",
    duration: "",
  });

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    setFilters({
      location: params.get("location") || "",
      targetSpecies: params.get("targetSpecies") || "",
      duration: params.get("duration") || "",
    });
  }, [location]);

  const { data: charters, isLoading } = useQuery<CharterWithCaptain[]>({
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
    
    // If no filters, just go to /search without query params
    const queryString = params.toString();
    window.history.replaceState({}, "", queryString ? `/search?${queryString}` : "/search");
  };

  const clearFilters = () => {
    const emptyFilters = { location: "", targetSpecies: "", duration: "" };
    setFilters(emptyFilters);
    window.history.replaceState({}, "", "/search");
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            initialValues={filters}
          />
        </div>

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Search Results
            </h1>
            {!isLoading && (
              <p className="text-storm-gray">
                {charters?.length || 0} charters found
                {filters.location && ` in ${filters.location}`}
                {filters.targetSpecies && ` for ${filters.targetSpecies}`}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-sm text-storm-gray">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedCharters.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No charters found</h3>
              <p className="text-storm-gray mb-6">
                Try adjusting your search criteria or browse all available charters.
              </p>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
