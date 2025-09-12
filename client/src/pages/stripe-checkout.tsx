import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, ArrowLeft } from "lucide-react";
import Header from "@/components/header";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type Booking = {
  id: number;
  userId: string;
  charterId: number;
  tripDate: string;
  guests: number;
  totalPrice: number;
  status: string;
  message?: string;
  charter?: {
    id: number;
    title: string;
    location: string;
    images?: string[];
    captain?: {
      id: number;
      name?: string;
      user?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
};

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/success?booking=${bookingId}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <PaymentElement />
      </div>
      
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation('/bookings')}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-ocean-blue hover:bg-blue-800"
        >
          {processing ? (
            "Processing..."
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function StripeCheckout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Get booking ID from URL params
  const bookingId = new URLSearchParams(window.location.search).get('booking');

  useEffect(() => {
    if (!bookingId) {
      setError("No booking specified");
      setLoading(false);
      return;
    }

    const fetchBookingAndPaymentIntent = async () => {
      try {
        // Fetch booking details
        const bookingRes = await fetch(`/api/bookings/${bookingId}`, {
          credentials: "include",
        });
        
        if (!bookingRes.ok) {
          throw new Error("Failed to load booking");
        }
        
        const bookingData = await bookingRes.json();
        setBooking(bookingData);

        // Check if booking is confirmed
        if (bookingData.status !== "confirmed") {
          setError("Booking must be confirmed by captain before payment");
          setLoading(false);
          return;
        }

        // Create payment intent
        const paymentRes = await fetch(`/api/bookings/${bookingId}/create-payment-intent`, {
          method: "POST",
          credentials: "include",
        });

        if (!paymentRes.ok) {
          const error = await paymentRes.json();
          throw new Error(error.error || "Failed to create payment intent");
        }

        const { clientSecret } = await paymentRes.json();
        setClientSecret(clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndPaymentIntent();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Payment Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => setLocation('/bookings')} variant="outline">
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
              <h2 className="text-xl font-bold mb-2">Payment Not Available</h2>
              <p className="text-gray-600 mb-4">
                This booking is not ready for payment yet. The captain needs to confirm your booking first.
              </p>
              <Button onClick={() => setLocation('/bookings')}>
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Secure payment powered by Stripe. Your payment goes directly to the captain.
          </p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{booking.charter?.title}</h3>
                <p className="text-gray-600">{booking.charter?.location}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {new Date(booking.tripDate).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline">
                    {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-green-700 bg-green-50">
                    Confirmed
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-ocean-blue">
                  {formatMoney(booking.totalPrice)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm bookingId={bookingId!} />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Your payment is secure and encrypted. Payments go directly to the captain.</p>
        </div>
      </div>
    </div>
  );
}