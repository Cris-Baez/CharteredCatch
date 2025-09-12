import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  DollarSign,
  Calendar,
  Shield,
  Award,
  FileText,
  Phone,
  Anchor,
  Map,
  Clock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

/**
 * Captain Resources (Página pública)
 * - Usa Header/Footer públicos.
 * - Anclas (#licensing, #safety, #growth, #seasonal, #resources) para navegación interna.
 * - CTAs apuntan a rutas existentes en tu app.
 */
export default function CaptainResources() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <section className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-ocean-blue/10 text-ocean-blue rounded-full px-3 py-1 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Updated for this season</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Captain Resources
          </h1>

          <p className="text-lg md:text-xl text-storm-gray max-w-4xl mx-auto">
            Everything you need to succeed as a charter captain on Charterly:
            licensing, safety standards, operations, and strategies to grow your business.
          </p>

          {/* Table of contents */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#licensing" className="text-sm text-ocean-blue hover:underline">
              Licensing & Legal
            </a>
            <span className="text-storm-gray">•</span>
            <a href="#safety" className="text-sm text-ocean-blue hover:underline">
              Safety Standards
            </a>
            <span className="text-storm-gray">•</span>
            <a href="#growth" className="text-sm text-ocean-blue hover:underline">
              Grow Your Business
            </a>
            <span className="text-storm-gray">•</span>
            <a href="#seasonal" className="text-sm text-ocean-blue hover:underline">
              Seasonal Guide
            </a>
            <span className="text-storm-gray">•</span>
            <a href="#resources" className="text-sm text-ocean-blue hover:underline">
              Resources & Support
            </a>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Users className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">List Your Charter</h3>
              <p className="text-storm-gray text-sm mb-4">
                Start accepting bookings today
              </p>
              <Button className="w-full" asChild>
                <a href="/captain/charters/new">Get Started</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <FileText className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Documentation</h3>
              <p className="text-storm-gray text-sm mb-4">
                Forms and legal requirements
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/safety-standards">View Docs</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Phone className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Captain Support</h3>
              <p className="text-storm-gray text-sm mb-4">
                Get help when you need it
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/support">Contact Us</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <TrendingUp className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Success Tips</h3>
              <p className="text-storm-gray text-sm mb-4">
                Grow your charter business
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/how-it-works">Learn More</a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Licensing & Legal */}
        <section id="licensing" className="mb-12 md:mb-16">
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
                      <li>
                        • <strong>OUPV (Six-Pack):</strong> Up to 6 passengers, near
                        coastal waters
                      </li>
                      <li>
                        • <strong>Master 25/50/100 Ton:</strong> Commercial vessels,
                        larger capacity
                      </li>
                      <li>
                        • <strong>Endorsements:</strong> Inland / Near Coastal / Oceans
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Typical Requirements:</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• 360+ days sea time (según licencia)</li>
                      <li>• CPR / First Aid vigente</li>
                      <li>• Examen físico y antidoping</li>
                      <li>• Antecedentes / background check</li>
                    </ul>
                  </div>
                  <div className="text-xs text-storm-gray">
                    Note: verify local/state requirements according to your area.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance & Business</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Insurance:</h4>
                    <ul className="space-y-2 text-storm-gray">
                      <li>
                        • <strong>Marine Liability:</strong> mínimo recomendado
                        $300,000
                      </li>
                      <li>
                        • <strong>Hull & Machinery:</strong> daños a la embarcación
                      </li>
                      <li>
                        • <strong>P&amp;I:</strong> protección e indemnización a
                        pasajeros
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Business Setup:</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Licencia/registro de negocio</li>
                      <li>• EIN federal y tax ID estatal</li>
                      <li>• Workers’ comp (si aplica)</li>
                      <li>• Permisos locales y ambientales</li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" asChild>
                      <a href="/terms">Read Platform Terms</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Safety Standards */}
        <section id="safety" className="mb-12 md:mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Anchor className="mr-3 text-ocean-blue" size={36} />
            Safety Standards & Equipment
          </h2>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Required Safety Equipment
                  </h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• USCG-approved life jackets for all passengers</li>
                    <li>• VHF marine radio with DSC</li>
                    <li>• Emergency flares and visual signals</li>
                    <li>• First aid kit (marine-specific)</li>
                    <li>• Fire extinguisher systems</li>
                    <li>• EPIRB/PLB emergency beacon</li>
                    <li>• Sound signaling devices</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Vessel Requirements</h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• USCG documentation vigente</li>
                    <li>• Annual safety inspection</li>
                    <li>• Navigation lights adecuados</li>
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
                    <li>• Alcohol & drug policies</li>
                    <li>• Float plan procedures</li>
                  </ul>
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <a href="/safety-standards">See Safety Guidelines</a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Growth */}
        <section id="growth" className="mb-12 md:mb-16">
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
                      Build Your Reputation
                    </h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Fast responses to inquiries</li>
                      <li>• Clear trip details & expectations</li>
                      <li>• Maintain top safety standards</li>
                      <li>• Ask for post-trip reviews</li>
                      <li>• Share fishing reports regularly</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Photography</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• High-quality boat/equipment photos</li>
                      <li>• Action shots with customers</li>
                      <li>• Professional captain profile photos</li>
                      <li>• Recent catches that inspire</li>
                    </ul>
                  </div>
                  <div className="pt-1">
                    <Button variant="outline" asChild>
                      <a href="/how-it-works">See How It Works</a>
                    </Button>
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
                      <li>• Benchmark local market rates</li>
                      <li>• Adjust for seasonal demand</li>
                      <li>• Consider fuel/maintenance costs</li>
                      <li>• Offer package deals (6–8 hrs)</li>
                      <li>• Premium for specialty trips</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Revenue Streams</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Half-day / full-day charters</li>
                      <li>• Specialty (tarpon, night, tournaments)</li>
                      <li>• Corporate / group bookings</li>
                      <li>• Gear rental & merch</li>
                      <li>• Fish cleaning & packaging</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seasonal Operations */}
        <section id="seasonal" className="mb-12 md:mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Calendar className="mr-3 text-ocean-blue" size={36} />
            Seasonal Operations Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Spring</CardTitle>
                <Badge variant="secondary">Mar–May</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Pre-season boat maintenance</li>
                  <li>• Equipment inspection & updates</li>
                  <li>• Marketing for peak season</li>
                  <li>• Train crew & certifications</li>
                  <li>• Inshore migrations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Summer</CardTitle>
                <Badge variant="secondary">Jun–Aug</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Peak booking window</li>
                  <li>• Extended operating hours</li>
                  <li>• Offshore conditions</li>
                  <li>• Tourist traffic</li>
                  <li>• Weather monitoring critical</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Fall</CardTitle>
                <Badge variant="secondary">Sep–Nov</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Excellent fishing</li>
                  <li>• Tournament season prep</li>
                  <li>• Hurricane awareness</li>
                  <li>• Winterization planning</li>
                  <li>• Market for winter trips</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Winter</CardTitle>
                <Badge variant="secondary">Dec–Feb</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-1 text-storm-gray text-sm">
                  <li>• Major maintenance & repairs</li>
                  <li>• Service equipment</li>
                  <li>• License renewals</li>
                  <li>• Training refresh</li>
                  <li>• Plan next season</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subscription Plans */}
        <section id="subscription" className="mb-12 md:mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Captain Subscription</h2>
          
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-ocean-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              
              <Card className="border-2 border-ocean-blue shadow-lg">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-ocean-blue">Professional Captain</CardTitle>
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
                  
                  <Button className="w-full bg-ocean-blue hover:bg-deep-blue" asChild>
                    <a href="/captain/subscribe">Start Free Trial</a>
                  </Button>
                  
                  <p className="text-xs text-center text-storm-gray mt-3">
                    No setup fees • Secure payment processing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Resources & Support */}
        <section id="resources" className="rounded-2xl border bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Additional Resources</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <BookOpen className="text-ocean-blue mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Educational</h3>
                <ul className="text-storm-gray text-sm space-y-1">
                  <li>• Maritime institute courses</li>
                  <li>• Charterboat operator associations</li>
                  <li>• Professional training programs</li>
                  <li>• Best practices guides</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Map className="text-ocean-blue mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Navigation & Weather</h3>
                <ul className="text-storm-gray text-sm space-y-1">
                  <li>• NOAA marine forecasts</li>
                  <li>• Notices to mariners</li>
                  <li>• Tides & current predictions</li>
                  <li>• Seasonal patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="text-ocean-blue mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Industry News</h3>
                <ul className="text-storm-gray text-sm space-y-1">
                  <li>• Regulation updates</li>
                  <li>• Trade publications</li>
                  <li>• Gear reviews</li>
                  <li>• Market trends</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA final */}
          <div className="mt-8 text-center">
            <Button asChild>
              <a href="/captain/charters/new">Create Your First Charter</a>
            </Button>
            <p className="text-xs text-storm-gray mt-3">
              Need help?{" "}
              <a href="/support" className="text-ocean-blue hover:underline">
                Contact support
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
