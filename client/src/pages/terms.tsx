import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-storm-gray">Last updated: December 2024</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>1. Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By accessing and using Charterly, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>2. Booking and Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Booking Confirmation:</strong> All bookings are subject to availability and captain confirmation.
              You will receive a confirmation email once your booking is accepted.
            </p>
            <p>
              <strong>Payment:</strong> Full payment is required at the time of booking confirmation.
              We accept major credit cards and secure payment methods.
            </p>
            <p>
              <strong>Pricing:</strong> All prices are listed in USD and include applicable taxes unless otherwise specified.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>3. Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Customer Cancellations:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>More than 48 hours before trip: Full refund</li>
              <li>24-48 hours before trip: 50% refund</li>
              <li>Less than 24 hours: No refund</li>
            </ul>
            <p>
              <strong>Weather Cancellations:</strong> In case of unsafe weather conditions, 
              trips may be rescheduled or fully refunded at the captain's discretion.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4. Safety and Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Safety Requirements:</strong> All passengers must follow captain instructions and wear provided safety equipment.
              Passengers participate at their own risk.
            </p>
            <p>
              <strong>Age Restrictions:</strong> Children under 18 must be accompanied by an adult guardian.
              Life jackets are required for all passengers under 13.
            </p>
            <p>
              <strong>Prohibited Items:</strong> Illegal substances, excessive alcohol consumption, and dangerous items are strictly prohibited.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>5. Captain Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Licensing:</strong> All captains must hold valid USCG licenses and maintain current certifications.
            </p>
            <p>
              <strong>Insurance:</strong> Captains must carry appropriate commercial marine insurance coverage.
            </p>
            <p>
              <strong>Verification:</strong> Charterly verifies captain credentials before approval to operate on our platform.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>6. Platform Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Account Responsibility:</strong> Users are responsible for maintaining account security and accuracy of information.
            </p>
            <p>
              <strong>Prohibited Conduct:</strong> Users may not engage in fraudulent activities, harassment, or misuse of the platform.
            </p>
            <p>
              <strong>Content:</strong> Users retain rights to their content but grant Charterly license to use for platform operations.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Any disputes arising from use of this service will be resolved through binding arbitration in accordance with 
              the rules of the American Arbitration Association in the state of Florida.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>8. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              For questions about these Terms of Service, please contact us at:
              <br />
              Email: legal@charterly.com
              <br />
              Phone: (305) 555-0123
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}