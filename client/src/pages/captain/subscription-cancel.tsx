import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionCancel() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-600">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              No worries! Your payment was cancelled and no charges were made.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <p className="font-medium text-blue-900">You can still:</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Start a free trial without payment method</li>
                <li>• Try the payment process again anytime</li>
                <li>• Add payment details later during your trial</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              asChild
              className="w-full"
              data-testid="button-try-again"
            >
              <Link href="/captain/subscribe">
                <CreditCard className="w-4 h-4 mr-2" />
                Try Payment Again
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full"
              data-testid="button-back"
            >
              <Link href="/captain/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}