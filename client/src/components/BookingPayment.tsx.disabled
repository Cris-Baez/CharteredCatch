import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, CreditCard, Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// Use runtime validation instead of module-level throw to prevent app crashes
const getStripePromise = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) {
    console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
    return null;
  }
  return loadStripe(key);
};
const stripePromise = getStripePromise();

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  bookingTitle: string;
}

const CheckoutForm = ({ onSuccess, onCancel, amount, bookingTitle }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/user/my-trips",
        },
      });

      setIsLoading(false);

      if (result.error) {
        // Payment failed or was declined
        toast({
          title: "Payment Failed",
          description: result.error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else {
        // Payment succeeded - Stripe redirects for successful payments
        toast({
          title: "Payment Successful",
          description: "Your booking is confirmed! Have a great trip!",
        });
        onSuccess();
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Payment confirmation error:", error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{bookingTitle}</h3>
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
          <DollarSign size={24} />
          {amount.toFixed(2)}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Secure payment processed by Stripe
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        
        <div className="flex gap-3 pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={!stripe || isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

interface BookingPaymentProps {
  bookingId: number;
  bookingTitle: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingPayment({ 
  bookingId, 
  bookingTitle,
  amount,
  isOpen,
  onClose,
  onSuccess
}: BookingPaymentProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if Stripe is properly configured
  if (!stripePromise) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Configuration Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-red-600">
              Payment system is not properly configured. Please contact support.
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  useEffect(() => {
    if (isOpen && bookingId) {
      setIsLoading(true);
      // Create PaymentIntent when dialog opens
      fetch(`/api/bookings/${bookingId}/create-payment-intent`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to create payment intent");
          }
          return res.json();
        })
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          toast({
            title: "Payment Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          console.error("Payment intent error:", error);
          onClose();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, bookingId, toast, onClose]);

  if (!clientSecret && isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-ocean-blue" />
            <span className="ml-2">Setting up secure payment...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!clientSecret) {
    return null;
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
        </DialogHeader>
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0ea5e9',
              }
            }
          }}
        >
          <CheckoutForm 
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
            onCancel={onClose}
            amount={amount}
            bookingTitle={bookingTitle}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}