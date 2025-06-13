import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, DollarSign, Calendar, Shield, Award, FileText, Phone, Anchor, Map, Clock, TrendingUp } from "lucide-react";

export default function CaptainResources() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Captain Resources
          </h1>
          <p className="text-xl text-storm-gray max-w-4xl mx-auto">
            Everything you need to succeed as a charter captain on Charterly. From licensing requirements 
            to business growth strategies, we provide comprehensive resources to help you thrive.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Users className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">List Your Charter</h3>
              <p className="text-storm-gray text-sm mb-4">Start accepting bookings today</p>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <FileText className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Documentation</h3>
              <p className="text-storm-gray text-sm mb-4">Forms and legal requirements</p>
              <Button variant="outline" className="w-full">Download</Button>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Phone className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Captain Support</h3>
              <p className="text-storm-gray text-sm mb-4">Get help when you need it</p>
              <Button variant="outline" className="w-full">Contact Us</Button>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <TrendingUp className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Success Tips</h3>
              <p className="text-storm-gray text-sm mb-4">Grow your charter business</p>
              <Button variant="outline" className="w-full">Learn More</Button>
            </CardContent>
          </Card>
        </div>

        {/* Licensing & Legal Requirements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Shield className="mr-3 text-ocean-blue" size={36} />
            Licensing & Legal Requirements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>USCG Captain's License</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Required Licenses:</h4>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• <strong>OUPV (Six-Pack License):</strong> Up to 6 passengers, near coastal waters</li>
                      <li>• <strong>Master 25/50/100 Ton:</strong> Commercial vessels, more passengers</li>
                      <li>• <strong>Inland/Near Coastal/Oceans:</strong> Operating area endorsements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Requirements:</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• 360+ days sea time (varies by license type)</li>
                      <li>• CPR/First Aid certification</li>
                      <li>• Drug test and physical exam</li>
                      <li>• Background check</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance & Business Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Required Insurance:</h4>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• <strong>Marine Liability:</strong> Minimum $300,000 recommended</li>
                      <li>• <strong>Hull & Machinery:</strong> Vessel damage coverage</li>
                      <li>• <strong>P&I (Protection & Indemnity):</strong> Passenger injury coverage</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Business Structure:</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Business license and registration</li>
                      <li>• Federal EIN and state tax ID</li>
                      <li>• Workers' compensation (if applicable)</li>
                      <li>• Local permits and endorsements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Safety Standards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Anchor className="mr-3 text-ocean-blue" size={36} />
            Safety Standards & Equipment
          </h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Required Safety Equipment</h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• USCG-approved life jackets for all passengers</li>
                    <li>• VHF marine radio with DSC</li>
                    <li>• Emergency flares and visual signals</li>
                    <li>• First aid kit (marine-specific)</li>
                    <li>• Fire extinguisher systems</li>
                    <li>• Emergency beacon (EPIRB/PLB)</li>
                    <li>• Sound signaling devices</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Vessel Requirements</h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• Current USCG vessel documentation</li>
                    <li>• Annual safety inspection</li>
                    <li>• Proper navigation lights</li>
                    <li>• Pollution prevention equipment</li>
                    <li>• Emergency steering capability</li>
                    <li>• Bilge pump systems</li>
                    <li>• Fuel system safety compliance</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Operational Standards</h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• Pre-trip safety briefings</li>
                    <li>• Weather monitoring procedures</li>
                    <li>• Emergency action plans</li>
                    <li>• Passenger manifest requirements</li>
                    <li>• Maximum passenger limits</li>
                    <li>• Alcohol and drug policies</li>
                    <li>• Float plan procedures</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Growth */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <TrendingUp className="mr-3 text-ocean-blue" size={36} />
            Growing Your Charter Business
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Marketing & Customer Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Award className="mr-2 text-ocean-blue" size={16} />
                      Building Your Reputation
                    </h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Respond quickly to booking inquiries</li>
                      <li>• Provide detailed trip information</li>
                      <li>• Maintain high safety standards</li>
                      <li>• Encourage customer reviews</li>
                      <li>• Share fishing reports and updates</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Professional Photography</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• High-quality boat and equipment photos</li>
                      <li>• Action shots of fishing experiences</li>
                      <li>• Professional captain and crew photos</li>
                      <li>• Recent catch photos with happy customers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Revenue Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <DollarSign className="mr-2 text-ocean-blue" size={16} />
                      Pricing Strategy
                    </h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Research local market rates</li>
                      <li>• Consider seasonal demand fluctuations</li>
                      <li>• Factor in fuel, bait, and maintenance costs</li>
                      <li>• Offer package deals for longer trips</li>
                      <li>• Premium pricing for specialty trips</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Revenue Streams</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Half-day and full-day charter rates</li>
                      <li>• Specialty trips (tournament prep, night fishing)</li>
                      <li>• Corporate and group discounts</li>
                      <li>• Equipment rental and sales</li>
                      <li>• Fish cleaning and packaging services</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seasonal Operations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Calendar className="mr-3 text-ocean-blue" size={36} />
            Seasonal Operations Guide
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Spring</CardTitle>
                <Badge variant="secondary">March - May</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Pre-season boat maintenance</li>
                  <li>• Equipment inspection and updates</li>
                  <li>• Marketing for peak season</li>
                  <li>• Staff training and certification</li>
                  <li>• Inshore species migrations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Summer</CardTitle>
                <Badge variant="secondary">June - August</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Peak booking season</li>
                  <li>• Extended operating hours</li>
                  <li>• Offshore fishing conditions</li>
                  <li>• Tourist and vacation bookings</li>
                  <li>• Weather monitoring critical</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Fall</CardTitle>
                <Badge variant="secondary">September - November</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Excellent fishing conditions</li>
                  <li>• Tournament season preparation</li>
                  <li>• Hurricane season awareness</li>
                  <li>• Equipment winterization prep</li>
                  <li>• Marketing for winter bookings</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Winter</CardTitle>
                <Badge variant="secondary">December - February</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Boat maintenance and repairs</li>
                  <li>• Equipment servicing</li>
                  <li>• License renewals</li>
                  <li>• Training and certification updates</li>
                  <li>• Planning for next season</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Resources & Support */}
        <section className="bg-sea-foam p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <BookOpen className="text-ocean-blue mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Educational Resources</h3>
              <ul className="text-storm-gray text-sm space-y-1">
                <li>• USCG Maritime Institute courses</li>
                <li>• National Association of Charterboat Operators</li>
                <li>• Professional maritime training programs</li>
                <li>• Industry best practices guides</li>
              </ul>
            </div>
            <div className="text-center">
              <Map className="text-ocean-blue mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Navigation & Weather</h3>
              <ul className="text-storm-gray text-sm space-y-1">
                <li>• NOAA weather and marine forecasts</li>
                <li>• Chart updates and notices to mariners</li>
                <li>• Tide and current predictions</li>
                <li>• Seasonal fishing pattern data</li>
              </ul>
            </div>
            <div className="text-center">
              <Clock className="text-ocean-blue mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Industry News</h3>
              <ul className="text-storm-gray text-sm space-y-1">
                <li>• Fishing regulations and updates</li>
                <li>• Industry trade publications</li>
                <li>• Equipment reviews and recommendations</li>
                <li>• Market trends and analysis</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}