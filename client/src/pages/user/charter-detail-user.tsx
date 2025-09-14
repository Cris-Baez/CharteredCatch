import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import {
  MapPin,
  Clock,
  Users,
  Star,
  MessageCircle,
  Calendar as CalendarIcon,
  Shield,
  Fish,
  Anchor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ReviewForm from "@/components/ui/review-form";

import type { CharterWithCaptain } from "@shared/schema";

/* ===========================
   Tipos y schema
=========================== */
const bookingSchema = z.object({
  tripDate: z.date(),
  guests: z.number().min(1),
  message: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

type Me = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
};

/* ===========================
   Componente
=========================== */
export default function CharterDetailUser() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // 1) Usuario autenticado (protección de ruta)
  const {
    data: me,
    isLoading: loadingMe,
    isError: authError,
  } = useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) throw new Error("unauthorized");
      return res.json();
    },
  });

  useEffect(() => {
    if (authError) setLocation("/login");
  }, [authError, setLocation]);

  // 2) Charter
  const { data: charter, isLoading } = useQuery<CharterWithCaptain>({
    queryKey: ["charter", id],
    queryFn: async () => {
      const res = await fetch(`/api/charters/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch charter");
      return res.json();
    },
    enabled: !!id && !authError,
  });

  // 3) Form
  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { guests: 1, message: "" },
  });

  /* ===========================
     Helpers
  =========================== */
  const images =
    charter?.images?.length
      ? charter.images
      : [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop",
        ];

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActive(idx);
  };

  /* ===========================
     Actions
  =========================== */
  const handleBooking = async (data: BookingForm) => {
    if (!charter || !me) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // backend takes userId from session for security
          charterId: charter.id,
          tripDate: data.tripDate.toISOString(),
          guests: data.guests,
          totalPrice: charter.price,
          status: "pending",
          message: data.message || "",
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      const created = await res.json(); // se espera { id, ... }

      setIsBookingOpen(false);

      toast({
        title: "Booking Requested!",
        description: "Your booking request has been sent to the captain. You'll be notified when it's confirmed and ready for payment.",
      });

      // Redirect to my-trips to see pending booking
      setLocation("/user/my-trips");
    } catch (err) {
      console.error(err);
      setIsBookingOpen(false);
      toast({
        title: "Booking Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = async () => {
    if (!charter || !me) return;
    const receiverId = charter.captain?.userId ? String(charter.captain.userId) : "";
    try {
      // 1) Intento crear/obtener hilo específico (ajusta a tu backend)
      const threadRes = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: receiverId,
          charterId: charter.id,
        }),
      });

      if (threadRes.ok) {
        const data = await threadRes.json(); // se espera { threadId }
        if (data?.threadId) {
          setLocation(`/user/messages?threadId=${encodeURIComponent(String(data.threadId))}`);
          return;
        }
      }

      // 2) Fallback: crea un primer mensaje y navega con query
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          senderId: me.id,
          receiverId: receiverId,
          charterId: charter.id,
          content: `Hi! I'm interested in your charter: ${charter.title}`,
        }),
      });

      // Usa query params para que /user/messages abra esa conversación
      setLocation(`/user/messages?to=${encodeURIComponent(receiverId)}&charterId=${encodeURIComponent(String(charter.id))}`);
    } catch (err) {
      console.error(err);
      // Último fallback: abre mensajes con los hints
      setLocation(`/user/messages?to=${encodeURIComponent(receiverId)}&charterId=${encodeURIComponent(String(charter.id))}`);
    }
  };

  /* ===========================
     Loading/Not found
  =========================== */
  if (loadingMe || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderUser />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-60 bg-gray-200 rounded-lg mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-7 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="h-60 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (authError) return null; // redirigimos en useEffect
  if (!charter) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderUser />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-10 text-center">
              <h1 className="text-2xl font-bold mb-4">Charter Not Found</h1>
              <Button onClick={() => setLocation("/user/home")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ===========================
     UI
  =========================== */
  return (
    <div className="min-h-screen bg-background">
      <HeaderUser />

      {/* HERO de imágenes */}
      <div className="mb-6 relative">
        {/* Desktop → grid compacto estilo Airbnb */}
        <div className="hidden md:grid grid-cols-3 gap-2 h-[360px] rounded-xl overflow-hidden">
          <img
            src={images[0]}
            alt="main"
            className="col-span-2 object-cover w-full h-full"
          />
          <div className="grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`thumb-${i}`}
                className="object-cover w-full h-full"
              />
            ))}
          </div>
        </div>

        {/* Mobile → carrusel swipe */}
        <div
          ref={scrollerRef}
          className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-56 rounded-xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            <div key={i} className="snap-center shrink-0 w-full h-full">
              <img src={src} alt={`img-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Flechas móvil */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => active > 0 && scrollToIndex(active - 1)}
              className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => active < images.length - 1 && scrollToIndex(active + 1)}
              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-5">
            <h1 className="text-2xl md:text-3xl font-bold">{charter.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" /> {charter.location}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> {charter.duration}
              </span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> {charter.maxGuests} guests
              </span>
              <span className="flex items-center">
                <Fish className="w-3.5 h-3.5 mr-1" /> {charter.targetSpecies}
              </span>
            </div>

            {/* Capitán */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={charter.captain?.avatar || ""} useDefaultForCaptain />
                  <AvatarFallback>
                    {charter.captain?.name?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    Captain {charter.captain?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {charter.captain?.verified && (
                      <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5">
                        <Shield className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-semibold">
                        {charter.captain?.rating ?? "New"}
                      </span>
                      {typeof charter.captain?.reviewCount === "number" && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({charter.captain.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                {charter.captain?.bio}
              </CardContent>
            </Card>

            {/* About */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">About this charter</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                <p>{charter.description}</p>
                {charter.boatSpecs && (
                  <p className="mt-3">
                    <Anchor className="w-4 h-4 inline mr-1" />
                    {charter.boatSpecs}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {charter.reviews?.length ? (
                  charter.reviews.map((rev) => (
                    <div key={rev.id} className="border-b last:border-0 pb-2">
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-700">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Subtle Review Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 text-xs"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Write a review
              </Button>
            </div>
          </div>

          {/* Sidebar de reserva (sticky debajo del header) */}
          <div>
            <Card className="sticky top-28 rounded-2xl shadow-lg border border-gray-100">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-black">
                    ${charter.price}
                  </span>
                  <span className="text-xs text-gray-500">/trip</span>
                </div>
                <Button
                  className="w-full bg-ocean-blue hover:bg-blue-800 text-sm"
                  onClick={() => setIsBookingOpen(true)}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" /> Book Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleMessage}
                >
                  <MessageCircle className="w-4 h-4 mr-1" /> Message Captain
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de reserva — responsive y con scroll interno */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="w-[96vw] sm:max-w-lg max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Book Your Charter</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBooking)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="tripDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(d) => d < new Date()}
                          className="rounded-md border max-w-full"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guests</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from(
                            { length: charter.maxGuests },
                            (_, i) => i + 1
                          ).map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-ocean-blue hover:bg-blue-800 text-sm"
                >
                  Confirm Booking - ${charter.price}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="w-[96vw] sm:max-w-lg max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <ReviewForm 
              charterId={charter.id}
              charterTitle={charter.title}
              onSuccess={() => {
                setIsReviewModalOpen(false);
                // Refresh the page data after successful review submission
                window.location.reload();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

/* Ocultar scrollbars en el carrusel móvil */
const style = document.createElement("style");
style.innerHTML = `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`;
document.head.appendChild(style);
