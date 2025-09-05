import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, MessageCircle } from "lucide-react";

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["/api/user/bookings"],
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Angler"} 🎣
          </h1>
          <p className="text-gray-600">Here’s your next adventure</p>
        </motion.div>

        {/* Próximas reservas */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upcoming Trips</h2>
          {loadingBookings ? (
            <p className="text-gray-500">Loading your trips…</p>
          ) : bookings?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((trip: any, idx: number) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <img
                      src={trip.charter.images?.[0] || "/placeholder.jpg"}
                      alt={trip.charter.title}
                      className="h-40 w-full object-cover"
                    />
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">{trip.charter.title}</h3>
                      <p className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {trip.charter.location}
                      </p>
                      <p className="flex items-center text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {trip.date}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="font-semibold text-ocean-blue">${trip.charter.price}</span>
                        <button className="text-sm text-gray-500 hover:text-ocean-blue flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message Captain
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming trips yet. Start exploring!</p>
          )}
        </section>

        {/* Favoritos */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Favorites</h2>
          <p className="text-gray-500">Coming soon…</p>
        </section>

        {/* Historial */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Past Trips</h2>
          <p className="text-gray-500">You don’t have past trips yet.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
