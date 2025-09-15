import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Users,
  DollarSign,
  MessageCircle,
  Calendar,
  BarChart3,
  Shield,
  Search,
  Map,
  Star,
  Settings,
  Database,
  Code,
  Smartphone,
  Globe,
  CreditCard,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";

export default function AppOverview() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Charterly
          </h1>
          <p className="text-xl md:text-2xl mb-4">
            Complete Fishing Charter Booking Platform
          </p>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">
            A modern web application that connects anglers with professional, verified captains across the Florida Keys for a seamless, commission-free booking experience.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5">
            <Badge className="bg-white text-blue-700 hover:bg-white/90">Commission-Free</Badge>
            <Badge className="bg-white text-blue-700 hover:bg-white/90">$49/mo for Captains</Badge>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">General Overview</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Charterly</strong> is a full-featured platform for booking fishing charters in the Florida Keys. It connects fishing enthusiasts with vetted captains, prioritizing safety, transparency, and direct communication.
                </p>
                <p>
                  Built with a modern web stack, the app supports four distinct roles—public visitors, registered users, captains, and administrators—each with dedicated pages and tools for discovery, booking management, messaging, analytics, and payments.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Current Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">37</div>
                      <div className="text-sm text-gray-600">Total Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-sm text-gray-600">User Types</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">$49</div>
                      <div className="text-sm text-gray-600">Subscription / Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">0%</div>
                      <div className="text-sm text-gray-600">Commission</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Technology Stack</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>React 18</strong> – Primary framework</li>
                  <li><strong>TypeScript</strong> – Static typing for reliability</li>
                  <li><strong>Vite</strong> – Fast build tool & dev server</li>
                  <li><strong>Wouter</strong> – Lightweight routing</li>
                  <li><strong>TanStack Query</strong> – Data fetching & caching</li>
                  <li><strong>React Hook Form</strong> – Robust form handling</li>
                  <li><strong>Zod</strong> – Schema-based validation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Node.js</strong> – Runtime</li>
                  <li><strong>Express.js</strong> – Web framework</li>
                  <li><strong>TypeScript</strong> – Language</li>
                  <li><strong>PostgreSQL</strong> – Relational database</li>
                  <li><strong>Drizzle ORM</strong> – SQL-first ORM</li>
                  <li><strong>bcrypt</strong> – Password hashing</li>
                  <li><strong>Express Sessions</strong> – Session management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  UI/UX & APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Radix UI</strong> – Primitive components</li>
                  <li><strong>shadcn/ui</strong> – Design system</li>
                  <li><strong>Tailwind CSS</strong> – Utility-first styling</li>
                  <li><strong>Lucide React</strong> – Icon library</li>
                  <li><strong>Mapbox GL</strong> – Interactive maps</li>
                  <li><strong>Stripe</strong> – Payment processing</li>
                  <li><strong>Replit Auth</strong> – Authentication</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types & Pages */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">User Types & Capabilities</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Public Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Public Users (14 pages)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Homepage</strong> – Charter discovery</li>
                  <li>• <strong>Search & Filters</strong> – By location, target species, duration</li>
                  <li>• <strong>Charter Details</strong> – Full information & booking flow</li>
                  <li>• <strong>AI Assistant</strong> – Personalized recommendations</li>
                  <li>• <strong>Captain Directory</strong> – Profiles & verifications</li>
                  <li>• <strong>Legal Information</strong> – Terms, privacy, and policies</li>
                  <li>• <strong>Support & Help</strong> – Help center and contact</li>
                  <li>• <strong>Safety</strong> – Safety standards and guidelines</li>
                  <li>• <strong>Login / Sign Up</strong> – User authentication</li>
                </ul>
              </CardContent>
            </Card>

            {/* Registered Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registered Users (7 pages)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Personal Dashboard</strong> – Quick search & suggestions</li>
                  <li>• <strong>My Trips</strong> – Manage active and past bookings</li>
                  <li>• <strong>Messaging</strong> – Direct chat with captains</li>
                  <li>• <strong>User Profile</strong> – Account settings & preferences</li>
                  <li>• <strong>Advanced Search</strong> – Enhanced filters & map view</li>
                  <li>• <strong>Charter Details</strong> – Book with saved info</li>
                  <li>• <strong>Help Center</strong> – Personalized support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Captains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Captains (15 pages)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Main Dashboard</strong> – Activity summary</li>
                  <li>• <strong>Charter Management</strong> – Create, edit, list charters</li>
                  <li>• <strong>Bookings</strong> – Manage confirmations & statuses</li>
                  <li>• <strong>Calendar</strong> – Availability and scheduling</li>
                  <li>• <strong>Messaging</strong> – Communicate with clients</li>
                  <li>• <strong>Earnings</strong> – Income tracking and reports</li>
                  <li>• <strong>Analytics</strong> – Performance metrics</li>
                  <li>• <strong>Pro Profile</strong> – Account & business settings</li>
                  <li>• <strong>Payments</strong> – Payment methods configuration</li>
                  <li>• <strong>Subscription</strong> – Monthly plan management</li>
                </ul>
              </CardContent>
            </Card>

            {/* Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Administrators (1 page)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Admin Panel</strong> – Full platform oversight</li>
                  <li>• User and captain management</li>
                  <li>• Content moderation</li>
                  <li>• Captain verification</li>
                  <li>• Global reporting & analytics</li>
                  <li>• System configuration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-16 px-6 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Business Model</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Captain Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">$49</div>
                  <div className="text-gray-600">per month</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Unlimited charter listings</li>
                  <li>✓ Direct messaging with clients</li>
                  <li>✓ Advanced booking management</li>
                  <li>✓ Analytics and reports</li>
                  <li>✓ Priority support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  No Commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">0%</div>
                  <div className="text-gray-600">commission</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Captains keep 100% of their earnings</li>
                  <li>✓ Direct payments between users and captains</li>
                  <li>✓ Multiple payment methods supported</li>
                  <li>✓ No hidden fees</li>
                  <li>✓ Full price transparency</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Free Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-purple-600">Free</div>
                  <div className="text-gray-600">forever</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Unlimited charter search</li>
                  <li>✓ Book without restrictions</li>
                  <li>✓ Messaging with captains</li>
                  <li>✓ Trip management</li>
                  <li>✓ Ratings and reviews</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Advanced Search</h3>
                <p className="text-sm text-gray-600">
                  Filter by location, target species, trip duration, and available dates.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Map className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Interactive Maps</h3>
                <p className="text-sm text-gray-600">
                  Explore charters on Mapbox GL for intuitive, visual navigation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <MessageCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Direct Messaging</h3>
                <p className="text-sm text-gray-600">
                  Real-time chat between users and captains for coordination and details.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Booking Management</h3>
                <p className="text-sm text-gray-600">
                  End-to-end bookings with confirmations, status updates, and cancellations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Reviews System</h3>
                <p className="text-sm text-gray-600">
                  Ratings and comments to maintain service quality and trust.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Captain Verification</h3>
                <p className="text-sm text-gray-600">
                  Verification process to ensure professionalism and safety.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">
                  Performance metrics and reports for captains and admins.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <CreditCard className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Multiple Payment Options</h3>
                <p className="text-sm text-gray-600">
                  Support for bank transfer, PayPal, Venmo, Zelle, and Cash App.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Database Schema */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Database Structure</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>users</strong> – User information</li>
                  <li><strong>captains</strong> – Captain profiles</li>
                  <li><strong>charters</strong> – Charter listings</li>
                  <li><strong>bookings</strong> – User reservations</li>
                  <li><strong>messages</strong> – Messaging system</li>
                  <li><strong>reviews</strong> – Ratings and reviews</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supporting Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>sessions</strong> – Session management</li>
                  <li><strong>availability</strong> – Charter availability</li>
                  <li><strong>captainPaymentInfo</strong> – Payment information</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Characteristics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>PostgreSQL</strong> as the main database</li>
                  <li>• <strong>Drizzle ORM</strong> for queries</li>
                  <li>• <strong>Automatic migrations</strong></li>
                  <li>• <strong>Optimized indexes</strong></li>
                  <li>• <strong>Validation with Zod</strong></li>
                  <li>• <strong>TypeScript types</strong> generated automatically</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Demo */}
      <section className="py-16 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Mail className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Email</h3>
              <p>contact@charterly.com</p>
            </div>

            <div>
              <Phone className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Phone</h3>
              <p>+1 (555) 123-4567</p>
            </div>

            <div>
              <Globe className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Website</h3>
              <p>www.charterly.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg">
              Thanks
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
