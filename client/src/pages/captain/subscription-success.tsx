import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { CheckCircle2, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionSuccess() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // Get session_id from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      processSubscription(sessionId);
    } else {
      setProcessing(false);
    }
  }, [isAuthenticated, setLocation]);

  const processSubscription = async (sessionId: string) => {
    try {
      // Here we could optionally verify the session with backend
      // For now, we'll just show success and refresh subscription status
      
      toast({
        title: "🎉 Payment Successful!",
        description: "Your 30-day free trial is now active with payment method on file.",
      });
      
      setProcessing(false);
    } catch (error) {
      console.error("Error processing subscription:", error);
      toast({
        title: "Processing Error",
        description: "Payment succeeded but there was an error. Please contact support.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Subscription Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              🎉 Your Captain Professional Plan is now active!
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900">30-Day Free Trial</p>
              <p className="text-sm text-blue-700">
                Your payment method is securely stored. You'll be charged $49/month after your trial ends.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              asChild
              className="w-full"
              data-testid="button-dashboard"
            >
              <Link href="/captain/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full"
              data-testid="button-profile"
            >
              <Link href="/captain/profile">
                <User className="w-4 h-4 mr-2" />
                Complete Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}