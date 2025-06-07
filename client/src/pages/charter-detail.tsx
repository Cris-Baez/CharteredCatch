import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Clock, Users, Star, MessageCircle, Calendar as CalendarIcon, Shield, Fish, Anchor } from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

const bookingSchema = z.object({
  tripDate: z.date(),
  guests: z.number().min(1),
  message: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function CharterDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data: charter, isLoading } = useQuery<CharterWithCaptain>({
    queryKey: [`/api/charters/${id}`],
    enabled: !!id,
  });

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guests: 1,
      message: "",
    },
  });

  const handleBooking = async (data: BookingForm) => {
    try {
      const bookingData = {
        userId: 1, // Mock user ID - in real app this would come from auth
        charterId: charter.id,
        tripDate: data.tripDate,
        guests: data.guests,
        totalPrice: charter.price,
        status: "pending",
        message: data.message || "",
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      console.log("Booking created successfully");
      setIsBookingOpen(false);
      // Redirect to messages or confirmation
      setLocation("/messages");
    } catch (error) {
      console.error("Error creating booking:", error);
      // In a real app, show error message to user
    }
  };

  const handleMessage = () => {
    setLocation(`/messages?captainId=${charter?.captain.userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-96 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!charter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Charter Not Found</h1>
              <p className="text-storm-gray mb-6">The charter you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation("/")}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Charter Images */}
        <div className="mb-8">
          <img
            src={charter.images?.[0] || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop"}
            alt={charter.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{charter.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-storm-gray mb-4">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {charter.location}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {charter.duration}
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Up to {charter.maxGuests} guests
                </span>
                <span className="flex items-center">
                  <Fish className="w-4 h-4 mr-1" />
                  {charter.targetSpecies}
                </span>
              </div>
            </div>

            {/* Captain Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={charter.captain.avatar || ""} />
                    <AvatarFallback>
                      {charter.captain.user.firstName[0]}{charter.captain.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Captain {charter.captain.user.firstName} {charter.captain.user.lastName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {charter.captain.verified && (
                        <Badge className="bg-verified-green text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 font-semibold">{charter.captain.rating}</span>
                        <span className="text-gray-500 text-sm ml-1">
                          ({charter.captain.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-storm-gray mb-4">{charter.captain.bio}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Experience:</strong> {charter.captain.experience}
                  </div>
                  <div>
                    <strong>License:</strong> {charter.captain.licenseNumber}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Charter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-storm-gray mb-4">{charter.description}</p>
                
                {charter.boatSpecs && (
                  <div className="mb-4">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Anchor className="w-4 h-4 mr-2" />
                      Boat Specifications
                    </h4>
                    <p className="text-storm-gray">{charter.boatSpecs}</p>
                  </div>
                )}

                {charter.included && (
                  <div>
                    <h4 className="font-semibold mb-2">What's Included</h4>
                    <p className="text-storm-gray">{charter.included}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {charter.reviews.length === 0 ? (
                  <p className="text-storm-gray">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {charter.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center text-yellow-500">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-storm-gray">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-storm-gray">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-ocean-blue">
                    ${charter.price}
                  </span>
                  <span className="text-storm-gray text-sm">/trip</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-ocean-blue hover:bg-blue-800"
                  onClick={() => setIsBookingOpen(true)}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleMessage}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Captain
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Trip Details</h4>
                  <div className="space-y-2 text-sm text-storm-gray">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{charter.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Guests:</span>
                      <span>{charter.maxGuests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Species:</span>
                      <span>{charter.targetSpecies}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Your Charter</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBooking)} className="space-y-4">
              <FormField
                control={form.control}
                name="tripDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <Select 
                      value={field.value?.toString() || "1"}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select guests" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: charter.maxGuests }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i === 0 ? "guest" : "guests"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Captain (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requests or questions?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-ocean-blue hover:bg-blue-800">
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
