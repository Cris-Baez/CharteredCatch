import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
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
import type { CharterWithCaptain } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  tripDate: z.date(),
  guests: z.number().min(1),
  message: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

export default function CharterDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { data: charter, isLoading } = useQuery<CharterWithCaptain>({
    queryKey: ["charter", id],
    queryFn: async () => {
      const res = await fetch(`/api/charters/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch charter");
      return res.json();
    },
    enabled: !!id,
  });

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { guests: 1, message: "" },
  });

  // ======== Helpers de UI ========
  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActive(idx);
  };

  // ======== Gatekeeper de autenticación ========
  const requireAuth = (cb: () => void) => {
    // Si está cargando el estado auth, no hagas nada; el usuario volverá a pulsar
    if (authLoading) return;
    if (!isAuthenticated) {
      const next = `/charters/${id ?? ""}`;
      setLocation(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    cb();
  };

  // ======== Acciones ========
  const handleBooking = async (data: BookingForm) => {
    if (!charter) return;

    // Seguridad extra: si no está logueado, redirige
    if (!isAuthenticated) {
      const next = `/charters/${id ?? ""}`;
      setLocation(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        // userId lo debe inferir el backend desde la sesión
        charterId: charter.id,
        tripDate: data.tripDate, // Date; tu backend debe parsearlo (ISO)
        guests: data.guests,
        totalPrice: charter.price, // si tu backend lo calcula, puedes omitirlo
        status: "pending",
        message: data.message || "",
      }),
    });

    if (!res.ok) {
      toast({
        title: "Booking Failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking Requested!",
      description: "Your booking request has been sent to the captain. You'll be notified when it's confirmed and ready for payment.",
    });
    setIsBookingOpen(false);
    setLocation("/user/my-trips");
  };

  const handleMessage = async () => {
    if (!charter) return;

    // Gateo por login
    if (!isAuthenticated) {
      const next = `/charters/${id ?? ""}`;
      setLocation(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        // senderId lo toma el backend de la sesión
        receiverId: charter.captain?.userId,
        charterId: charter.id,
        content: `Hi! I'm interested in your charter: ${charter.title}`,
      }),
    });

    setLocation("/messages");
  };

  // ======== Loading / fallback ========
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-60 bg-gray-200 rounded-lg mb-6" />
        </div>
      </div>
    );
  }
  if (!charter) return <p>No charter found</p>;

  const rawImages = Array.isArray(charter.images) ? charter.images.filter(Boolean) : [] as string[];
  const images: string[] = rawImages.length > 0
    ? rawImages
    : [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop",
      ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero imágenes */}
      <div className="mb-6 relative">
        {/* Desktop → grid compacto */}
        <div className="hidden md:grid grid-cols-3 gap-2 h-[350px] rounded-lg overflow-hidden">
          <img src={images[0]} alt="main" className="col-span-2 object-cover w-full h-full" />
          <div className="grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((src, i) => (
              <img key={i} src={src} alt="thumb" className="object-cover w-full h-full" />
            ))}
          </div>
        </div>

        {/* Mobile → carrusel */}
        <div
          ref={scrollerRef}
          className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-56 rounded-lg"
        >
          {images.map((src, i) => (
            <div key={i} className="snap-center shrink-0 w-full h-full">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Flechas móvil */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => active > 0 && scrollToIndex(active - 1)}
              className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => active < images.length - 1 && scrollToIndex(active + 1)}
              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-5">
            <h1 className="text-2xl font-bold">{charter.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {charter.location}</span>
              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {charter.duration}</span>
              <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {charter.maxGuests} guests</span>
              <span className="flex items-center"><Fish className="w-3 h-3 mr-1" /> {charter.targetSpecies}</span>
            </div>

            {/* Capitán */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={charter.captain?.avatar || ""} useDefaultForCaptain />
                  <AvatarFallback>{charter.captain?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">Captain {charter.captain?.name}</p>
                  {charter.captain?.verified && (
                    <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5 mt-1">
                      <Shield className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {charter.captain?.bio}
              </CardContent>
            </Card>

            {/* Descripción */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>{charter.description}</p>
                {charter.boatSpecs && (
                  <p className="mt-2"><Anchor className="w-4 h-4 inline mr-1" /> {charter.boatSpecs}</p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Reviews</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {charter.reviews?.length ? (
                  charter.reviews.map((rev) => (
                    <div key={rev.id} className="border-b last:border-0 pb-2">
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-600">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-28 rounded-2xl shadow-lg border border-gray-100">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-black">${charter.price}</span>
                  <span className="text-xs text-gray-500">/trip</span>
                </div>
                <Button
                  className="w-full bg-ocean-blue hover:bg-blue-800 text-sm"
                  onClick={() => requireAuth(() => setIsBookingOpen(true))}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" /> Book Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => requireAuth(handleMessage)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" /> Message Captain
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking modal (con gating en onOpenChange también) */}
      <Dialog
        open={isBookingOpen}
        onOpenChange={(open) => {
          if (open) {
            requireAuth(() => setIsBookingOpen(true));
          } else {
            setIsBookingOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Book Your Charter</DialogTitle></DialogHeader>
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
                        {Array.from({ length: charter.maxGuests }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
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
                    <FormControl><Textarea {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-ocean-blue hover:bg-blue-800 text-sm">
                Confirm Booking - ${charter.price}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

/* Ocultar scrollbars */
const style = document.createElement("style");
style.innerHTML = `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`;
document.head.appendChild(style);
