import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, User as UserIcon } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

export default function HomeUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Traemos recomendaciones de charters
  const { data: recommendedCharters, isLoading: loadingCharters, error } =
    useQuery<CharterWithCaptain[]>({
      queryKey: ["charters"],
      queryFn: async () => {
        const response = await fetch("/api/charters");
        if (!response.ok) {
          throw new Error("Failed to fetch charters");
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const charters = recommendedCharters?.length
    ? recommendedCharters
    : []; // Inicialmente vacío si no hay datos del backend

  const handleSearch = (filters: {
    location: string;
    targetSpecies: string;
    duration: string;
    date: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.targetSpecies) params.set("targetSpecies", filters.targetSpecies);
    if (filters.duration) params.set("duration", filters.duration);
    if (filters.date) params.set("date", filters.date);

    const queryString = params.toString();
    window.location.href = queryString ? `/user/search?${queryString}` : "/user/search";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Bienvenida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Angler"} 🎣
          </h1>
          <p className="text-gray-600">
            Ready for your next fishing adventure?
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <SearchBar onSearch={handleSearch} />
        </motion.div>

        {/* Recommended for you */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Recommended for you
          </h2>
          {loadingCharters ? (
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
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Failed to load recommendations</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : charters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No charters available at the moment</p>
              <Button onClick={() => setLocation("/user/search")} variant="outline">
                Browse All Charters
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Carousel */}
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {charters.map((charter, idx) => (
                    <motion.div
                      key={charter.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="flex-shrink-0 w-72"
                    >
                      <Card className="overflow-hidden shadow hover:shadow-lg transition">
                        <img
                          src={charter.images?.[0] || "/placeholder.jpg"}
                          alt={charter.title}
                          className="h-40 w-full object-cover"
                        />
                        <CardContent className="p-4 space-y-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {charter.title}
                          </h3>
                          <p className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            {charter.location}
                          </p>
                          <p className="flex items-center text-gray-600 text-sm">
                            <UserIcon className="w-4 h-4 mr-1" />
                            Capt. {charter.captain?.name}
                          </p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                              {charter.captain?.rating}
                            </span>
                            <span className="font-semibold text-ocean-blue">
                              ${charter.price}
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
                {charters.map((charter, idx) => (
                  <motion.div
                    key={charter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden shadow hover:shadow-lg transition">
                      <img
                        src={charter.images?.[0] || "/placeholder.jpg"}
                        alt={charter.title}
                        className="h-40 w-full object-cover"
                      />
                      <CardContent className="p-4 space-y-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {charter.title}
                        </h3>
                        <p className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {charter.location}
                        </p>
                        <p className="flex items-center text-gray-600 text-sm">
                          <UserIcon className="w-4 h-4 mr-1" />
                          Capt. {charter.captain?.name}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                            {charter.captain?.rating}
                          </span>
                          <span className="font-semibold text-ocean-blue">
                            ${charter.price}
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
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Popular near you
          </h2>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {charters.slice().reverse().map((charter, idx) => (
                <motion.div
                  key={`popular-${charter.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="flex-shrink-0 w-72"
                >
                  <Card className="overflow-hidden shadow hover:shadow-lg transition">
                    <img
                      src={charter.images?.[0] || "/placeholder.jpg"}
                      alt={charter.title}
                      className="h-40 w-full object-cover"
                    />
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {charter.title}
                      </h3>
                      <p className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {charter.location}
                      </p>
                      <p className="flex items-center text-gray-600 text-sm">
                        <UserIcon className="w-4 h-4 mr-1" />
                        Capt. {charter.captain?.name}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                          {charter.captain?.rating}
                        </span>
                        <span className="font-semibold text-ocean-blue">
                          ${charter.price}
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
            {charters.slice().reverse().map((charter, idx) => (
              <motion.div
                key={`popular-${charter.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden shadow hover:shadow-lg transition">
                  <img
                    src={charter.images?.[0] || "/placeholder.jpg"}
                    alt={charter.title}
                    className="h-40 w-full object-cover"
                  />
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {charter.title}
                    </h3>
                    <p className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {charter.location}
                    </p>
                    <p className="flex items-center text-gray-600 text-sm">
                      <UserIcon className="w-4 h-4 mr-1" />
                      Capt. {charter.captain?.name}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                        {charter.captain?.rating}
                      </span>
                      <span className="font-semibold text-ocean-blue">
                        ${charter.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Top Rated Charters */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Top rated charters
          </h2>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {charters.slice(0, 3).map((charter, idx) => (
                <motion.div
                  key={`top-rated-${charter.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="flex-shrink-0 w-72"
                >
                  <Card className="overflow-hidden shadow hover:shadow-lg transition">
                    <img
                      src={charter.images?.[0] || "/placeholder.jpg"}
                      alt={charter.title}
                      className="h-40 w-full object-cover"
                    />
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {charter.title}
                      </h3>
                      <p className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {charter.location}
                      </p>
                      <p className="flex items-center text-gray-600 text-sm">
                        <UserIcon className="w-4 h-4 mr-1" />
                        Capt. {charter.captain?.name}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                          {charter.captain?.rating}
                        </span>
                        <span className="font-semibold text-ocean-blue">
                          ${charter.price}
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
            {charters.slice(0, 3).map((charter, idx) => (
              <motion.div
                key={`top-rated-${charter.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden shadow hover:shadow-lg transition">
                  <img
                    src={charter.images?.[0] || "/placeholder.jpg"}
                    alt={charter.title}
                    className="h-40 w-full object-cover"
                  />
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {charter.title}
                    </h3>
                    <p className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {charter.location}
                    </p>
                    <p className="flex items-center text-gray-600 text-sm">
                      <UserIcon className="w-4 h-4 mr-1" />
                      Capt. {charter.captain?.name}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                        {charter.captain?.rating}
                      </span>
                      <span className="font-semibold text-ocean-blue">
                        ${charter.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}