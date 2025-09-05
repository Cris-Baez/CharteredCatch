import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, User as UserIcon } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

export default function HomeUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Traemos recomendaciones de charters
  const { data: recommendedCharters, isLoading: loadingCharters } =
    useQuery<CharterWithCaptain[]>({
      queryKey: ["/api/charters/recommended"],
    });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  // Datos mock (ajustados al tipo real CharterWithCaptain)
  const mockCharters: CharterWithCaptain[] = [
    {
      id: 1,
      title: "Sunset Reef Adventure",
      location: "Key West, FL",
      price: "450", // 👈 string porque en tu schema es VARCHAR/TEXT
      images: ["/attached_assets/image_1749589187411.png"],
      captain: {
        userId: "u1",
        bio: "Experienced captain",
        experience: "10 years",
        licenseNumber: "ABC123",
        location: "Key West, FL",
        avatar: null,
        verified: true,
        rating: "4.8",
        reviewCount: 120,
        name: "Captain Mike",
      },
    },
    {
      id: 2,
      title: "Deep Sea Mahi Hunt",
      location: "Miami, FL",
      price: "850",
      images: ["/attached_assets/image_1749589049214.png"],
      captain: {
        userId: "u2",
        bio: "Specialist in Mahi fishing",
        experience: "7 years",
        licenseNumber: "XYZ789",
        location: "Miami, FL",
        avatar: null,
        verified: true,
        rating: "5.0",
        reviewCount: 98,
        name: "XYZ789",
      },
    },
  ];

  const charters = recommendedCharters?.length
    ? recommendedCharters
    : mockCharters;

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
            Welcome back, {user?.first_name || "Angler"} 🎣
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

        {/* Categorías rápidas */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Charters", href: "/search", icon: "🛥️" },
              { name: "Captains", href: "/captains", icon: "👨‍✈️" },
              { name: "Bookings", href: "/user/dashboard", icon: "📅" },
              { name: "Messages", href: "/messages", icon: "💬" },
            ].map((cat, idx) => (
              <motion.a
                key={cat.name}
                href={cat.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow hover:shadow-md transition"
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="font-semibold text-gray-700">
                  {cat.name}
                </span>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Recomendaciones */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Recommended for you
          </h2>
          {loadingCharters ? (
            <p className="text-gray-500">Loading recommendations…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

