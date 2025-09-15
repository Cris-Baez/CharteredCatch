// client/src/pages/captain/subscribe.tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HeaderCaptain from "@/components/headercaptain";
import {
  CheckCircle2,
  CreditCard,
  Shield,
  Star,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

type SubscriptionStatus = {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'pending';
  current_period_end: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
} | null;

// Card setup form component
function CardSetupForm({ onSuccess, onError, onCancel }: {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [setupIntent, setSetupIntent] = useState<{ client_secret: string } | null>(null);

  useEffect(() => {
    // Create setup intent when component mounts
    const createSetupIntent = async () => {
      try {
        const response = await fetch("/api/captain/setup-intent", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create setup intent");
        }

        const data = await response.json();
        setSetupIntent(data);
      } catch (error: any) {
        onError(error.message || "Failed to initialize payment setup");
      }
    };

    createSetupIntent();
  }, [onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !setupIntent) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Card element not found");
      setProcessing(false);
      return;
    }

    try {
      // Confirm the setup intent with the card
      const { error, setupIntent: confirmedSetupIntent } = await stripe.confirmCardSetup(
        setupIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        onError(error.message || "Failed to set up payment method");
      } else if (confirmedSetupIntent?.status === "succeeded") {
        // Now create the subscription with the payment method
        const subscriptionResponse = await fetch("/api/captain/subscription/create-with-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            payment_method_id: confirmedSetupIntent.payment_method,
          }),
        });

        if (subscriptionResponse.ok) {
          onSuccess();
        } else {
          const errorData = await subscriptionResponse.json();
          onError(errorData.error || "Failed to create subscription");
        }
      }
    } catch (error: any) {
      onError(error.message || "Payment setup failed");
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-ocean-blue hover:bg-deep-blue"
        >
          {processing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Setting up payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Start Trial with Payment
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        Your payment method will be securely stored. No charges until trial ends.
      </p>
    </form>
  );
}

export default function CaptainSubscribe() {
  const { user, isAuthenticated, isLoading: loadingAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [captainData, setCaptainData] = useState<{verified: boolean} | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated) {
      fetchCaptainData();
      fetchSubscriptionStatus();
    }
  }, [loadingAuth, isAuthenticated, setLocation]);

  const fetchCaptainData = async () => {
    try {
      const response = await fetch("/api/captains", {
        credentials: "include",
      });
      
      if (response.ok) {
        const captains = await response.json();
        const myCaptain = captains.find((c: any) => c.userId === user?.id);
        setCaptainData(myCaptain ? { verified: myCaptain.verified } : null);
      }
    } catch (error) {
      console.error("Error fetching captain data:", error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/captain/subscription", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show payment dialog for Stripe CardElement setup
  const handleSubscribeWithCard = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentDialog(false);
    toast({
      title: "Trial Started!",
      description: "30-day free trial activated with payment method on file.",
    });
    // Refresh subscription status
    await fetchSubscriptionStatus();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Setup Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  // Opción B: "Do it later" (manual/externo)
  const handleSubscribeDoItLater = async () => {
    setSubscribing(true);
    try {
      const response = await fetch("/api/captain/subscription/create", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Trial Started!",
          description: "30-day free trial activated. Add payment method anytime during trial.",
        });
        
        // Refresh subscription status
        await fetchSubscriptionStatus();
      } else {
        throw new Error(data.error || "Failed to create subscription");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Unable to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch("/api/captain/subscription/cancel", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Subscription Canceled",
          description: "Your subscription will end at the current billing period.",
        });
        await fetchSubscriptionStatus();
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error: any) {
      toast({
        title: "Cancel Failed",
        description: error.message || "Unable to cancel subscription.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
        <HeaderCaptain />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-ocean-blue border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
      <HeaderCaptain />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Captain Subscription
          </h1>
          <p className="text-lg text-storm-gray">
            Unlock the full potential of your charter business
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <Card className="mb-8 border-2 border-ocean-blue">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 text-green-500 mr-2" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge 
                    variant={subscription.status === 'active' || subscription.status === 'trialing' ? 'default' : 'destructive'}
                    className="mb-2"
                  >
                    {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
                  </Badge>
                  
                  {subscription.status === 'trialing' && subscription.trial_end && (
                    <p className="text-sm text-storm-gray">
                      Trial ends: {formatDate(subscription.trial_end)}
                    </p>
                  )}
                  
                  {subscription.status === 'active' && (
                    <p className="text-sm text-storm-gray">
                      Next billing: {formatDate(subscription.current_period_end)}
                      {subscription.cancel_at_period_end && " (Will cancel)"}
                    </p>
                  )}
                </div>
                
                {(subscription.status === 'active' || subscription.status === 'trialing') && 
                 !subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Status */}
        {captainData && !captainData.verified && (
          <Card className="mb-8 border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-800">
                <Clock className="w-5 h-5 mr-2" />
                Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-amber-700">
                  Your captain account is pending verification from our team. You'll need to be verified before you can subscribe to our professional plan.
                </p>
                <div className="bg-white/60 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">What happens next:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
                    <li>Our team reviews your captain credentials</li>
                    <li>You'll receive an email when verification is complete</li>
                    <li>Once verified, you can subscribe and start listing charters</li>
                  </ol>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:support@charterly.com">
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plan */}
        {captainData && captainData.verified && !subscription && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-ocean-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              
              <Card className="border-2 border-ocean-blue shadow-lg">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-ocean-blue">
                    Professional Captain
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$49</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-storm-gray mt-2">
                    <span className="font-semibold text-green-600">1 month free trial</span> • Cancel anytime
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>Unlimited charter listings</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>Direct customer payments</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>No booking commissions</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>Advanced analytics dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      <span>Verified captain badge</span>
                    </li>
                  </ul>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-ocean-blue hover:bg-deep-blue" 
                      onClick={handleSubscribeWithCard}
                      disabled={subscribing}
                    >
                      {subscribing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Setting up payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Start Trial with Payment Method
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full border-ocean-blue text-ocean-blue hover:bg-ocean-50" 
                      onClick={handleSubscribeDoItLater}
                      disabled={subscribing}
                    >
                      {subscribing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-ocean-blue border-t-transparent rounded-full mr-2"></div>
                          Starting trial...
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Start Trial (Add Payment Later)
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-storm-gray mt-3">
                    No setup fees • Secure payment processing • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Why Subscribe */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
              <p className="text-storm-gray text-sm">
                Access to advanced analytics and marketing tools to increase bookings and revenue.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Direct Payments</h3>
              <p className="text-storm-gray text-sm">
                Customers pay directly to your account. No platform fees or commissions.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Star className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Premium Features</h3>
              <p className="text-storm-gray text-sm">
                Get verified badge, priority support, and access to beta features.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Can I cancel anytime?</h4>
                <p className="text-storm-gray text-sm">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">What happens after the free trial?</h4>
                <p className="text-storm-gray text-sm">
                  After your 30-day free trial, you'll be charged $49/month. You can cancel before the trial ends to avoid any charges.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">How do customer payments work?</h4>
                <p className="text-storm-gray text-sm">
                  Customers pay directly to your connected bank account. Charterly doesn't hold or process customer payments, keeping things simple for you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Setup Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-ocean-blue" />
              Setup Payment Method
            </DialogTitle>
            <DialogDescription>
              Add your payment method to start your 30-day free trial. No charges until trial ends.
            </DialogDescription>
          </DialogHeader>
          
          {stripePromise && (
            <Elements stripe={stripePromise}>
              <CardSetupForm 
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}