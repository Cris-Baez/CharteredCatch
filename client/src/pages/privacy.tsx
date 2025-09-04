import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-storm-gray">Last updated: December 2024</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Personal Information:</strong> When you create an account, we collect your name, email address, 
              phone number, and payment information necessary to process bookings.
            </p>
            <p>
              <strong>Usage Data:</strong> We automatically collect information about how you use our platform, 
              including IP addresses, browser type, and pages visited.
            </p>
            <p>
              <strong>Location Data:</strong> With your permission, we may collect location data to help you find nearby charters.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and manage your charter bookings</li>
              <li>Communicate with you about your trips and account</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our platform and develop new features</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Comply with legal obligations and prevent fraud</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>3. Information Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>With Captains:</strong> We share necessary booking information with captains to facilitate your charter experience.
            </p>
            <p>
              <strong>Service Providers:</strong> We may share data with trusted third-party services that help us operate our platform,
              such as payment processors and email services.
            </p>
            <p>
              <strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and safety.
            </p>
            <p>
              <strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred as part of the business assets.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p>
              <strong>Encryption:</strong> All sensitive data is encrypted in transit and at rest using industry-standard protocols.
            </p>
            <p>
              <strong>Access Controls:</strong> We limit access to personal information to employees and contractors who need it for business purposes.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>5. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Request data portability</li>
              <li>Object to certain processing activities</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>6. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use cookies and similar technologies to enhance your experience on our platform. 
              Cookies help us remember your preferences and analyze how you use our service.
            </p>
            <p>
              You can control cookie settings through your browser preferences, though some features may not work properly if cookies are disabled.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>8. International Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If you are accessing our service from outside the United States, please be aware that your information 
              may be transferred to and processed in the United States where our servers are located.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>9. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>10. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@charterly.com
              <br />
              Phone: (305) 555-0123
              <br />
              Address: 123 Ocean Drive, Key Largo, FL 33037
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}