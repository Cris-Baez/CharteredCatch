import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// UI base del proyecto
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Íconos
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Star,
  MessageCircle,
  ArrowRight,
  Anchor,
  Clock,
  Shield,
  X,
  DollarSign,
  Info,
  ExternalLink,
  CreditCard,
} from "lucide-react";

// Tipos (según /api/bookings/me + /api/charters/:id del backend)
import type { CharterWithCaptain } from "@shared/schema";
import BookingPayment from "@/components/BookingPayment";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
  id: number;
  userId: string;
  charterId: number;
  tripDate: string; // ISO
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  message?: string | null;
  createdAt?: string;
  charter?: CharterWithCaptain; // viene embebido desde /api/bookings/me
}

function statusBadge(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-600 text-white">Confirmed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "completed":
      return <Badge className="bg-gray-500 text-white">Completed</Badge>;
    default:
      return <Badge>—</Badge>;
  }
}

export default function MyTrips() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Redirección si no está logueado
  if (!authLoading && !isAuthenticated) {
    setLocation("/login");
  }

  // =========================
  // FETCH BOOKINGS DEL USUARIO
  // =========================
  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ["bookings", "me"],
    queryFn: async () => {
      const r = await fetch("/api/bookings/me", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch bookings");
      return r.json();
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  // =========================
  // Estado de UI
  // =========================
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const today = startOfDay(new Date());

  // Mensajería (dialog)
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [msgBooking, setMsgBooking] = useState<Booking | null>(null);

  // Detalles (dialog)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);

  // Pago (dialog)
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  // Fechas con reserva (para marcar en calendario)
  const bookedDates = useMemo(() => {
    if (!bookings) return new Set<string>();
    const s = new Set<string>();
    bookings.forEach((b) => {
      const d = startOfDay(parseISO(b.tripDate));
      s.add(d.toISOString());
    });
    return s;
  }, [bookings]);

  // Filtros derivados
  const upcoming = useMemo(() => {
    const arr = (bookings ?? []).filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        isAfter(startOfDay(parseISO(b.tripDate)), today),
    );
    // sort by date asc
    return arr.sort(
      (a, b) => parseISO(a.tripDate).getTime() - parseISO(b.tripDate).getTime(),
    );
  }, [bookings, today]);

  const past = useMemo(() => {
    const arr = (bookings ?? []).filter(
      (b) =>
        b.status === "completed" ||
        b.status === "cancelled" ||
        isBefore(startOfDay(parseISO(b.tripDate)), today),
    );
    // sort by date desc
    return arr.sort(
      (a, b) => parseISO(b.tripDate).getTime() - parseISO(a.tripDate).getTime(),
    );
  }, [bookings, today]);

  const selectedDayTrips = useMemo(() => {
    if (!selectedDate || !bookings) return [];
    return bookings.filter((b) =>
      isSameDay(parseISO(b.tripDate), selectedDate),
    );
  }, [selectedDate, bookings]);

  // =========================
  // Mutations
  // =========================

  // Cancelar booking
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const r = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || "Cancel failed");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      toast({ title: "Trip cancelled" });
      setDetailsOpen(false); // cierra modal si estaba abierto
    },
    onError: (e: any) => {
      toast({
        title: "Cancel failed",
        description: String(e?.message || e),
        variant: "destructive",
      });
    },
  });

  // Enviar mensaje
  const messageMutation = useMutation({
    mutationFn: async (payload: {
      receiverId: string;
      charterId: number;
      content: string;
    }) => {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed to send message");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Message sent" });
      setMsgContent("");
      setMsgOpen(false);
    },
    onError: () =>
      toast({ title: "Failed to send message", variant: "destructive" }),
  });

  // =========================
  // Helpers
  // =========================
  const canCancel = (b: Booking) => {
    const tripD = startOfDay(parseISO(b.tripDate));
    return (
      (b.status === "confirmed" || b.status === "pending") &&
      isAfter(tripD, today)
    );
  };

  const captainName = (c?: CharterWithCaptain) => c?.captain?.name || "Captain";

  const openDetails = (b: Booking) => {
    setDetailsBooking(b);
    setDetailsOpen(true);
  };

  const rebook = (b: Booking) => {
    const ymd = format(parseISO(b.tripDate), "yyyy-MM-dd");
    setLocation(
      `/charters/${b.charterId}?rebook=1&date=${ymd}&guests=${b.guests}`,
    );
  };

  const openMessage = (b: Booking) => {
    setMsgBooking(b);
    setMsgContent("");
    setMsgOpen(true);
  };

  const openPayment = (b: Booking) => {
    setPaymentBooking(b);
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh bookings after successful payment
    refetch();
    toast({
      title: "Payment Successful",
      description: "Your trip is fully booked! Check your email for confirmation.",
    });
  };

  const sendMessage = () => {
    if (!msgBooking) return;
    if (!msgContent.trim()) {
      toast({ title: "Write a message first", variant: "destructive" });
      return;
    }
    const receiverId = msgBooking.charter?.captain?.userId;
    if (!receiverId) {
      toast({ title: "Captain user not found", variant: "destructive" });
      return;
    }
    messageMutation.mutate({
      receiverId,
      charterId: msgBooking.charterId,
      content: msgContent.trim(),
    });
  };

  const heroTitle = user?.firstName
    ? `My Trips, ${user.firstName}`
    : "My Trips";

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
        {/* Título / Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-ocean-blue" />
            {heroTitle}
          </h1>
          <p className="text-gray-600">
            Track your upcoming adventures, check past trips, or plan a new one.
          </p>
        </motion.div>

        {/* Calendario + Panel del día seleccionado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario (sticky en desktop) */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    booked: Array.from(bookedDates).map((iso) => parseISO(iso)),
                  }}
                  modifiersClassNames={{
                    booked: "bg-ocean-blue/10 text-ocean-blue rounded-md",
                  }}
                  className="rounded-md border"
                />

                {/* Chips resumen */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="text-gray-700">
                    {bookings?.length ?? 0} total
                  </Badge>
                  <Badge className="bg-green-600 text-white">
                    {upcoming.length} upcoming
                  </Badge>
                  <Badge className="bg-gray-600 text-white">
                    {past.length} past
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Panel del día (móvil y desktop) */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {format(selectedDate, "PPP")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedDayTrips.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          No trips on this date.
                        </p>
                      ) : (
                        selectedDayTrips.map((b) => (
                          <div
                            key={`sd-${b.id}`}
                            className="p-3 rounded-lg border hover:shadow-sm transition bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">
                                {b.charter?.title ?? "Charter"}
                              </div>
                              {statusBadge(b.status)}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {b.charter?.location ?? "—"}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetails(b)}
                              >
                                View details
                              </Button>
                              <div className="flex gap-2">
                                {b.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => openPayment(b)}
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Pay
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="bg-ocean-blue hover:bg-blue-800 text-white"
                                  onClick={() => openMessage(b)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista: Upcoming / Past */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid grid-cols-2 w-full md:w-auto">
                <TabsTrigger value="upcoming">Upcoming Trips</TabsTrigger>
                <TabsTrigger value="past">Past Trips</TabsTrigger>
              </TabsList>

              {/* Upcoming */}
              <TabsContent value="upcoming" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="h-40 bg-gray-200 animate-pulse" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-center py-10">
                    <p className="text-red-500 mb-4">
                      Failed to load your trips.
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : upcoming.length === 0 ? (
                  <EmptyState
                    title="No upcoming trips"
                    subtitle="When you book a trip, it will appear here."
                    ctaLabel="Find a charter"
                    onCta={() => setLocation("/")}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                      {upcoming.map((b) => (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.25 }}
                        >
                          <TripCard
                            booking={b}
                            canCancel={canCancel(b)}
                            onCancel={() => cancelMutation.mutate(b.id)}
                            onViewDetails={() => openDetails(b)}
                            onMessage={() => openMessage(b)}
                            onRebook={() => rebook(b)}
                            onPayment={() => openPayment(b)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              {/* Past */}
              <TabsContent value="past" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="h-40 bg-gray-200 animate-pulse" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-center py-10">
                    <p className="text-red-500 mb-4">
                      Failed to load your trips.
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : past.length === 0 ? (
                  <EmptyState
                    title="No past trips yet"
                    subtitle="Your completed or cancelled trips will appear here."
                    ctaLabel="Explore charters"
                    onCta={() => setLocation("/")}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {past.map((b) => (
                      <TripCard
                        key={b.id}
                        booking={b}
                        canCancel={false}
                        onCancel={() => {}}
                        onViewDetails={() => openDetails(b)}
                        onMessage={() => openMessage(b)}
                        onRebook={() => rebook(b)}
                        onPayment={() => openPayment(b)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      {/* Dialog para pago de booking */}
      {paymentBooking && (
        <BookingPayment
          bookingId={paymentBooking.id}
          bookingTitle={paymentBooking.charter?.title || "Charter Trip"}
          amount={paymentBooking.totalPrice}
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Dialog para enviar mensaje al capitán */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message the Captain</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Charter:{" "}
              <span className="font-medium">
                {msgBooking?.charter?.title ?? "—"}
              </span>
            </div>
            <Textarea
              placeholder="Ask about availability, details, or special requests…"
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMsgOpen(false)}>
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
            <Button
              className="bg-ocean-blue hover:bg-blue-800 text-white"
              onClick={sendMessage}
              disabled={messageMutation.isPending}
            >
              {messageMutation.isPending ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalles del booking */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-ocean-blue" />
              Booking Details
            </DialogTitle>
          </DialogHeader>

          {detailsBooking ? (
            <div className="space-y-5">
              {/* Charter resumen */}
              <div className="flex items-start gap-4">
                <img
                  src={
                    detailsBooking.charter?.images?.[0] ||
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop"
                  }
                  alt={detailsBooking.charter?.title || "Charter"}
                  className="w-28 h-20 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {detailsBooking.charter?.title ?? "Charter"}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {detailsBooking.charter?.location ?? "—"}
                        </span>
                        <span className="inline-flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {detailsBooking.charter?.duration ?? "—"}
                        </span>
                        <span className="inline-flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {detailsBooking.guests} guests
                        </span>
                      </div>
                    </div>
                    {statusBadge(detailsBooking.status)}
                  </div>

                  {/* Capitán */}
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={detailsBooking.charter?.captain?.avatar || ""} useDefaultForCaptain />
                      <AvatarFallback>
                        {detailsBooking.charter?.captain?.name?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <div className="font-medium">
                        Captain {captainName(detailsBooking.charter)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        {detailsBooking.charter?.captain?.verified && (
                          <span className="inline-flex items-center text-xs text-green-600">
                            <Shield className="w-3 h-3 mr-1" /> Verified
                          </span>
                        )}
                        {typeof detailsBooking.charter?.captain?.rating === "number" && (
                          <span className="inline-flex items-center text-xs text-yellow-600">
                            <Star className="w-3 h-3 mr-1" />
                            {detailsBooking.charter?.captain?.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos del booking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-xl">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="font-semibold">Trip</div>
                    <div className="text-gray-700">
                      Date:{" "}
                      <span className="font-medium">
                        {format(parseISO(detailsBooking.tripDate), "PPP")}
                      </span>
                    </div>
                    <div className="text-gray-700">
                      Booking ID:{" "}
                      <span className="font-medium">#{detailsBooking.id}</span>
                    </div>
                    {detailsBooking.createdAt && (
                      <div className="text-gray-700">
                        Created:{" "}
                        <span className="font-medium">
                          {format(parseISO(detailsBooking.createdAt), "PPP p")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-xl">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment
                    </div>
                    <div className="text-gray-700">
                      Total:{" "}
                      <span className="font-semibold">
                        ${detailsBooking.totalPrice}
                      </span>
                    </div>
                    {detailsBooking.message && (
                      <div className="text-gray-700">
                        Note:{" "}
                        <span className="font-medium">
                          {detailsBooking.message}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Acciones del booking */}
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => openMessage(detailsBooking)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Captain
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation(`/user/charters/${detailsBooking.charterId}`)}
                >
                  Open charter <ExternalLink className="w-4 h-4 ml-2" />
                </Button>

                <Button variant="outline" onClick={() => rebook(detailsBooking)}>
                  <Anchor className="w-4 h-4 mr-2" />
                  Rebook
                </Button>

                {canCancel(detailsBooking) && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(detailsBooking.id)}
                  >
                    Cancel Trip
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No booking selected.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =============================
   COMPONENTES AUXILIARES
   ============================= */

function TripCard({
  booking,
  canCancel,
  onCancel,
  onViewDetails,
  onMessage,
  onRebook,
  onPayment,
}: {
  booking: Booking;
  canCancel: boolean;
  onCancel: () => void;
  onViewDetails: () => void;
  onMessage: () => void;
  onRebook: () => void;
  onPayment?: () => void;
}) {
  const d = parseISO(booking.tripDate);
  const charter = booking.charter;

  const image =
    charter?.images?.[0] ||
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop";

  return (
    <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="flex flex-col md:flex-row">
        {/* Imagen */}
        <div className="md:w-64 h-40 md:h-auto overflow-hidden">
          <img
            src={image}
            alt={charter?.title ?? "Charter"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contenido */}
        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">
                  {charter?.title ?? "Charter"}
                </CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {charter?.location ?? "—"}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {charter?.duration ?? "—"}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {booking.guests} guests
                  </span>
                </div>
              </div>
              {statusBadge(booking.status)}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Capitán */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={charter?.captain?.avatar || ""} useDefaultForCaptain />
                  <AvatarFallback>
                    {charter?.captain?.name?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">
                    Captain {charter?.captain?.name || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    {charter?.captain?.verified && (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <Shield className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                    {typeof charter?.captain?.rating === "number" && (
                      <span className="inline-flex items-center text-xs text-yellow-600">
                        <Star className="w-3 h-3 mr-1" />
                        {charter?.captain?.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fecha + Total */}
              <div className="text-right text-sm">
                <div className="font-semibold">{format(d, "PPP")}</div>
                <div className="text-gray-600">
                  Total:{" "}
                  <span className="font-semibold">${booking.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                className="bg-ocean-blue hover:bg-blue-800 text-white"
                onClick={onViewDetails}
              >
                View details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {booking.status === "confirmed" && onPayment && (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onPayment}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              )}

              <Button variant="outline" onClick={onMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Captain
              </Button>

              <Button variant="outline" onClick={onRebook}>
                <Anchor className="w-4 h-4 mr-2" />
                Rebook
              </Button>

              {canCancel && (
                <Button variant="destructive" onClick={onCancel}>
                  Cancel Trip
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-10 text-center space-y-3">
        <div className="text-2xl">🎣</div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-600">{subtitle}</p>
        <Button
          onClick={onCta}
          className="bg-ocean-blue hover:bg-blue-800 text-white"
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
