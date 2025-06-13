import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MessageCircle, Calendar, Shield, DollarSign, Clock, Headphones } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How Charterly Works
          </h1>
          <p className="text-xl text-storm-gray max-w-3xl mx-auto">
            Booking your perfect fishing charter is simple. Connect directly with verified captains, 
            no middleman fees, and enjoy transparent pricing every step of the way.
          </p>
        </div>

        {/* Main Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-8">
            <CardContent className="p-0">
              <div className="w-20 h-20 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Search & Compare</h3>
              <p className="text-storm-gray text-lg leading-relaxed">
                Browse verified captains by location, target species, and trip type. 
                Compare ratings, prices, and availability to find your perfect match.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8">
            <CardContent className="p-0">
              <div className="w-20 h-20 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. Connect & Plan</h3>
              <p className="text-storm-gray text-lg leading-relaxed">
                Message captains directly to ask questions, discuss your trip details, 
                and get personalized fishing advice from local experts.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8">
            <CardContent className="p-0">
              <div className="w-20 h-20 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Book & Fish</h3>
              <p className="text-storm-gray text-lg leading-relaxed">
                Book instantly with real-time availability. Pay the captain directly 
                with no hidden fees or commissions - just great fishing.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why Choose Charterly */}
        <section className="py-12 bg-sea-foam rounded-2xl mb-16">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Charterly?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verified Captains</h3>
                <p className="text-storm-gray">All captains are licensed, insured, and safety certified</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Hidden Fees</h3>
                <p className="text-storm-gray">What you see is what you pay - no booking fees or commissions</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-Time Booking</h3>
                <p className="text-storm-gray">Instant availability and booking confirmation</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ocean-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Direct Support</h3>
                <p className="text-storm-gray">Message captains directly and get expert fishing advice</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Process */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12">The Complete Process</h2>
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">Finding Your Perfect Charter</h3>
                <p className="text-storm-gray text-lg mb-4">
                  Use our advanced search filters to find charters that match your specific needs. 
                  Filter by location, target species, trip duration, boat size, and more.
                </p>
                <ul className="text-storm-gray space-y-2">
                  <li>• Search by specific fish species you want to target</li>
                  <li>• Filter by trip type (inshore, offshore, deep sea)</li>
                  <li>• Compare captain ratings and reviews</li>
                  <li>• Check real-time availability</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-sea-foam p-8 rounded-xl">
                <div className="text-center">
                  <Search className="text-ocean-blue mx-auto mb-4" size={64} />
                  <p className="text-storm-gray">Browse hundreds of verified fishing charters</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">Direct Communication</h3>
                <p className="text-storm-gray text-lg mb-4">
                  Connect directly with captains through our secure messaging system. 
                  Ask questions, discuss trip details, and get local fishing insights.
                </p>
                <ul className="text-storm-gray space-y-2">
                  <li>• Ask about current fishing conditions</li>
                  <li>• Discuss equipment and what to bring</li>
                  <li>• Confirm meeting location and time</li>
                  <li>• Get personalized fishing tips</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-sea-foam p-8 rounded-xl">
                <div className="text-center">
                  <MessageCircle className="text-ocean-blue mx-auto mb-4" size={64} />
                  <p className="text-storm-gray">Chat directly with experienced captains</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">Secure Booking & Payment</h3>
                <p className="text-storm-gray text-lg mb-4">
                  Book with confidence using our secure platform. Pay the captain directly 
                  with no hidden fees or commissions.
                </p>
                <ul className="text-storm-gray space-y-2">
                  <li>• Instant booking confirmation</li>
                  <li>• Secure payment processing</li>
                  <li>• Trip details and meeting instructions</li>
                  <li>• Weather updates and trip reminders</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-sea-foam p-8 rounded-xl">
                <div className="text-center">
                  <Calendar className="text-ocean-blue mx-auto mb-4" size={64} />
                  <p className="text-storm-gray">Book instantly with real-time availability</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}