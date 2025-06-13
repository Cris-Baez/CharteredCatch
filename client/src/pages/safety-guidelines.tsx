import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, LifeBuoy, Radio, Eye, Wind, Thermometer, Heart, Phone } from "lucide-react";

export default function SafetyGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Fishing Charter Safety Guidelines
          </h1>
          <p className="text-xl text-storm-gray max-w-4xl mx-auto">
            Your safety is our top priority. Follow these comprehensive guidelines based on US Coast Guard 
            recommendations and maritime safety standards to ensure a safe and enjoyable fishing experience.
          </p>
        </div>

        {/* Emergency Alert */}
        <Alert className="mb-12 border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 text-lg">
            <strong>Emergency Contact:</strong> In case of emergency at sea, immediately contact the US Coast Guard at VHF Channel 16 or call 911. 
            GPS coordinates should be provided if available.
          </AlertDescription>
        </Alert>

        {/* Pre-Trip Safety */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Shield className="mr-3 text-ocean-blue" size={36} />
            Pre-Trip Safety Checklist
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 text-ocean-blue" size={24} />
                  Weather & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Check NOAA weather forecast and marine conditions</li>
                  <li>• Verify small craft advisories are not in effect</li>
                  <li>• Confirm visibility is adequate (1+ nautical miles)</li>
                  <li>• Check tide charts and current conditions</li>
                  <li>• Verify wind speeds are within safe limits (&lt;25 knots)</li>
                  <li>• Review sea state and wave height forecasts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 text-ocean-blue" size={24} />
                  Personal Health & Fitness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Inform captain of any medical conditions</li>
                  <li>• Bring required medications in waterproof containers</li>
                  <li>• Ensure you can swim or inform captain if you cannot</li>
                  <li>• Avoid alcohol 24 hours before departure</li>
                  <li>• Get adequate rest the night before</li>
                  <li>• Stay hydrated and eat appropriately</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Required Safety Equipment */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <LifeBuoy className="mr-3 text-ocean-blue" size={36} />
            Required Safety Equipment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Personal Flotation Devices (PFDs)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray">
                  <li>• USCG-approved Type I, II, or III PFD for each person</li>
                  <li>• Properly fitted and in good condition</li>
                  <li>• Inflatable PFDs must be serviced annually</li>
                  <li>• Children under 13 must wear PFDs at all times</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray">
                  <li>• VHF marine radio with DSC capability</li>
                  <li>• EPIRB (Emergency Position Indicating Radio Beacon)</li>
                  <li>• Cell phone in waterproof case</li>
                  <li>• Flares or other visual distress signals</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation & Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray">
                  <li>• GPS chartplotter with current charts</li>
                  <li>• Compass (magnetic backup)</li>
                  <li>• First aid kit (marine-specific)</li>
                  <li>• Fire extinguisher (USCG-approved)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* On-Board Safety Procedures */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Radio className="mr-3 text-ocean-blue" size={36} />
            On-Board Safety Procedures
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Safety Briefing Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Location of safety equipment and how to use it</li>
                  <li>• Emergency procedures and communication protocols</li>
                  <li>• Man overboard procedures and prevention</li>
                  <li>• Proper use of fishing equipment and potential hazards</li>
                  <li>• Boat layout, restricted areas, and safe movement</li>
                  <li>• Weather monitoring and response procedures</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Maintain proper lookout at all times</li>
                  <li>• Follow navigation rules and right-of-way</li>
                  <li>• Monitor weather conditions continuously</li>
                  <li>• Maintain radio watch on Channel 16</li>
                  <li>• File float plan with reliable person ashore</li>
                  <li>• Carry spare parts and emergency repair supplies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Weather Safety */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Wind className="mr-3 text-ocean-blue" size={36} />
            Weather-Related Safety
          </h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Thermometer className="mr-2 text-ocean-blue" size={20} />
                    Weather Monitoring
                  </h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• Monitor NOAA Weather Radio continuously</li>
                    <li>• Check barometric pressure trends</li>
                    <li>• Watch for changing cloud patterns</li>
                    <li>• Monitor wind direction and speed changes</li>
                    <li>• Be aware of approaching frontal systems</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Severe Weather Response</h3>
                  <ul className="space-y-2 text-storm-gray">
                    <li>• Return to port immediately if conditions deteriorate</li>
                    <li>• Secure all loose gear and equipment</li>
                    <li>• Ensure all passengers wear PFDs</li>
                    <li>• Reduce speed and maintain control</li>
                    <li>• Seek protected waters if possible</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Emergency Procedures */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Phone className="mr-3 text-ocean-blue" size={36} />
            Emergency Procedures
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Man Overboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-storm-gray list-decimal list-inside">
                  <li>Immediately shout "Man Overboard!"</li>
                  <li>Throw flotation device toward person</li>
                  <li>Keep visual contact - assign spotter</li>
                  <li>Mark GPS position immediately</li>
                  <li>Execute Williamson Turn or Quick Stop method</li>
                  <li>Call Mayday on VHF Channel 16</li>
                  <li>Deploy recovery equipment</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Medical Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-storm-gray list-decimal list-inside">
                  <li>Assess patient and ensure scene safety</li>
                  <li>Provide immediate first aid</li>
                  <li>Call Coast Guard on VHF Channel 16</li>
                  <li>Provide GPS coordinates</li>
                  <li>Describe nature of medical emergency</li>
                  <li>Follow Coast Guard medical advice</li>
                  <li>Prepare for potential evacuation</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-sea-foam p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-lg mb-2">US Coast Guard</h3>
              <p className="text-storm-gray">VHF Channel 16</p>
              <p className="text-storm-gray">Phone: 911</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">NOAA Weather</h3>
              <p className="text-storm-gray">VHF WX1-WX10</p>
              <p className="text-storm-gray">Online: weather.gov/marine</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">TowBoatUS</h3>
              <p className="text-storm-gray">VHF Channel 16</p>
              <p className="text-storm-gray">Phone: 1-800-888-4869</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}