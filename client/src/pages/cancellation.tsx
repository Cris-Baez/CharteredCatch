import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Umbrella, RefreshCw } from "lucide-react";

export default function Cancellation() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cancellation Policy</h1>
          <p className="text-lg text-storm-gray">
            Understanding our booking cancellation and refund policies
          </p>
        </div>

        <Alert className="mb-8">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Cancellation policies may vary by captain. Always review the specific 
            cancellation terms for your charter before booking.
          </AlertDescription>
        </Alert>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Customer Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                More than 48 Hours Before Trip
              </h3>
              <p className="text-storm-gray">
                <strong>Full Refund (100%)</strong> - Cancel your booking up to 48 hours before your scheduled 
                departure time and receive a complete refund to your original payment method.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                24-48 Hours Before Trip
              </h3>
              <p className="text-storm-gray">
                <strong>Partial Refund (50%)</strong> - Cancellations made between 24-48 hours before departure 
                will receive a 50% refund. The remaining amount covers captain preparation costs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Less than 24 Hours Before Trip
              </h3>
              <p className="text-storm-gray">
                <strong>No Refund (0%)</strong> - Cancellations made less than 24 hours before departure 
                are not eligible for refunds, as captains have already committed resources to your trip.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Umbrella className="w-5 h-5 mr-2" />
              Weather-Related Cancellations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Captain's Decision:</strong> Captains have the final authority to cancel trips due to unsafe weather conditions, 
              including high winds, storms, or dangerous sea conditions.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Weather Cancellation Options:</h4>
              <ul className="list-disc pl-6 space-y-1 text-blue-800">
                <li>Full refund to original payment method</li>
                <li>Reschedule to next available date at same rate</li>
                <li>Credit toward future booking (valid for 1 year)</li>
              </ul>
            </div>
            
            <p className="text-sm text-storm-gray">
              <em>Weather cancellations are typically decided 2-4 hours before departure time based on current 
              and forecasted conditions.</em>
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Captain Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If a captain needs to cancel your trip for reasons other than weather (equipment failure, emergency, etc.), 
              you will receive:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full refund within 3-5 business days</li>
              <li>Priority rebooking assistance</li>
              <li>Potential upgrade to premium charter at no extra cost</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>No-Show Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Customer No-Show:</strong> Failure to arrive at the designated meeting point within 30 minutes 
              of scheduled departure time will result in trip cancellation with no refund.
            </p>
            <p>
              <strong>Communication is Key:</strong> If you're running late, contact your captain immediately. 
              Most captains will accommodate minor delays when possible.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Special Circumstances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Medical Emergencies</h4>
              <p className="text-storm-gray">
                In case of documented medical emergencies, we may offer full refunds or rescheduling options 
                regardless of timing. Medical documentation may be required.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Military Deployment</h4>
              <p className="text-storm-gray">
                Active military personnel receiving sudden deployment orders may be eligible for full refunds 
                with proper military documentation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Natural Disasters</h4>
              <p className="text-storm-gray">
                Trips affected by hurricanes, tropical storms, or other natural disasters will receive full refunds 
                or rescheduling options.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How to Cancel Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-6 space-y-2">
              <li>Log into your Charterly account</li>
              <li>Navigate to "My Bookings"</li>
              <li>Find your trip and click "Cancel Booking"</li>
              <li>Select your reason for cancellation</li>
              <li>Confirm cancellation and refund method</li>
            </ol>
            
            <Alert>
              <AlertDescription>
                <strong>Need Help?</strong> Contact our support team at (305) 555-0123 or support@charterly.com 
                for assistance with cancellations or special circumstances.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Refund Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Processing Time:</strong> Approved refunds are processed within 3-5 business days to your original payment method.
            </p>
            <p>
              <strong>Bank Processing:</strong> Depending on your bank or credit card company, it may take an additional 
              3-7 business days for the refund to appear in your account.
            </p>
            <p>
              <strong>Refund Confirmation:</strong> You will receive email confirmation once your refund has been processed.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}