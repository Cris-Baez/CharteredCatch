import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Anchor, Award, FileText, Users, Eye, Radio } from "lucide-react";

export default function SafetyStandards() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Captain Safety Standards
          </h1>
          <p className="text-xl text-storm-gray max-w-4xl mx-auto">
            Charterly maintains the highest safety standards for all charter operations. Every captain 
            on our platform must meet or exceed USCG requirements and industry best practices.
          </p>
        </div>

        {/* Certification Requirements */}
        <Alert className="mb-12 border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 text-lg">
            <strong>All Charterly captains are verified:</strong> Licensed, insured, and safety certified before accepting passengers.
          </AlertDescription>
        </Alert>

        {/* USCG Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Shield className="mr-3 text-ocean-blue" size={36} />
            USCG Compliance Requirements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 text-ocean-blue" size={24} />
                  Captain Licensing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">Required Credentials</Badge>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• <strong>USCG Master/OUPV License:</strong> Valid and current</li>
                      <li>• <strong>Medical Certificate:</strong> USCG-approved physical</li>
                      <li>• <strong>STCW Basic Safety Training:</strong> International compliance</li>
                      <li>• <strong>Drug Testing:</strong> Random testing program participation</li>
                    </ul>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">Additional Certifications</Badge>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• CPR/First Aid (American Red Cross or equivalent)</li>
                      <li>• Marine Radio Operator Permit</li>
                      <li>• Radar Observer certification (if equipped)</li>
                      <li>• Commercial fishing endorsements (where applicable)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Anchor className="mr-2 text-ocean-blue" size={24} />
                  Vessel Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">Vessel Documentation</Badge>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• <strong>USCG Certificate of Documentation:</strong> Commercial endorsement</li>
                      <li>• <strong>State Registration:</strong> Current and valid</li>
                      <li>• <strong>Safety Inspection:</strong> Annual USCG or authorized examiner</li>
                      <li>• <strong>Pollution Prevention:</strong> MARPOL compliance certificate</li>
                    </ul>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">Equipment Standards</Badge>
                    <ul className="space-y-2 text-storm-gray">
                      <li>• USCG-approved safety equipment for passenger count</li>
                      <li>• Navigation equipment meeting SOLAS standards</li>
                      <li>• Communication systems (VHF with DSC)</li>
                      <li>• Emergency signaling devices</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Insurance Requirements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <FileText className="mr-3 text-ocean-blue" size={36} />
            Insurance & Liability Standards
          </h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Shield className="mr-2 text-ocean-blue" size={20} />
                    Required Coverage
                  </h3>
                  <ul className="space-y-3 text-storm-gray">
                    <li>
                      <strong>Marine General Liability:</strong>
                      <div className="text-sm">Minimum $1,000,000 per occurrence</div>
                    </li>
                    <li>
                      <strong>Protection & Indemnity (P&I):</strong>
                      <div className="text-sm">Passenger injury and property damage</div>
                    </li>
                    <li>
                      <strong>Hull & Machinery:</strong>
                      <div className="text-sm">Vessel damage and total loss coverage</div>
                    </li>
                    <li>
                      <strong>Commercial Fishing Liability:</strong>
                      <div className="text-sm">When applicable to charter operations</div>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Additional Protection</h3>
                  <ul className="space-y-3 text-storm-gray">
                    <li>
                      <strong>Environmental Liability:</strong>
                      <div className="text-sm">Pollution and spill coverage</div>
                    </li>
                    <li>
                      <strong>Crew Coverage:</strong>
                      <div className="text-sm">Jones Act and Longshore coverage</div>
                    </li>
                    <li>
                      <strong>Charter Interruption:</strong>
                      <div className="text-sm">Weather and mechanical delays</div>
                    </li>
                    <li>
                      <strong>Equipment Coverage:</strong>
                      <div className="text-sm">Fishing gear and electronics</div>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Verification Process</h3>
                  <ul className="space-y-3 text-storm-gray">
                    <li>
                      <strong>Annual Review:</strong>
                      <div className="text-sm">Insurance certificates updated yearly</div>
                    </li>
                    <li>
                      <strong>Claims History:</strong>
                      <div className="text-sm">Background check for safety record</div>
                    </li>
                    <li>
                      <strong>Provider Verification:</strong>
                      <div className="text-sm">A-rated insurance companies only</div>
                    </li>
                    <li>
                      <strong>Additional Insured:</strong>
                      <div className="text-sm">Charterly listed on policies</div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Safety Equipment Standards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Eye className="mr-3 text-ocean-blue" size={36} />
            Safety Equipment Standards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Life Safety Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Flotation Devices (PFDs)</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• USCG Type I, II, or III approved for each passenger</li>
                      <li>• Properly sized and in serviceable condition</li>
                      <li>• Annual inspection and replacement schedule</li>
                      <li>• Inflatable PFD service requirements met</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Emergency Equipment</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• Life rings with throwing lines</li>
                      <li>• Emergency ladder/boarding equipment</li>
                      <li>• Hypothermia prevention equipment</li>
                      <li>• Emergency blankets and shelter</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication & Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Communication Systems</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• VHF marine radio with DSC capability</li>
                      <li>• Emergency Position Indicating Radio Beacon (EPIRB)</li>
                      <li>• Cell phone backup in waterproof case</li>
                      <li>• Satellite communication (offshore operations)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Navigation Equipment</h4>
                    <ul className="space-y-1 text-storm-gray text-sm">
                      <li>• GPS chartplotter with current electronic charts</li>
                      <li>• Magnetic compass (backup navigation)</li>
                      <li>• Depth sounder and fish finder</li>
                      <li>• Radar system (vessels operating offshore)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Operational Standards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Users className="mr-3 text-ocean-blue" size={36} />
            Operational Safety Standards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pre-Departure</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray text-sm">
                  <li>• Weather and sea condition assessment</li>
                  <li>• Safety equipment inspection</li>
                  <li>• Passenger safety briefing</li>
                  <li>• Emergency procedure review</li>
                  <li>• Float plan filed with shore contact</li>
                  <li>• Passenger manifest completed</li>
                  <li>• Medical condition disclosure</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">During Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray text-sm">
                  <li>• Continuous weather monitoring</li>
                  <li>• Regular radio check-ins</li>
                  <li>• Lookout duties maintained</li>
                  <li>• Passenger supervision and assistance</li>
                  <li>• Safe fishing practices enforcement</li>
                  <li>• Equipment operation oversight</li>
                  <li>• Emergency readiness maintained</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Response</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-storm-gray text-sm">
                  <li>• Man overboard procedures</li>
                  <li>• Medical emergency protocols</li>
                  <li>• Fire suppression procedures</li>
                  <li>• Severe weather response</li>
                  <li>• Mechanical failure protocols</li>
                  <li>• Coast Guard communication</li>
                  <li>• Passenger evacuation plans</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Verification Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Radio className="mr-3 text-ocean-blue" size={36} />
            Charterly Verification Process
          </h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Initial Verification</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">License Verification</div>
                        <div className="text-storm-gray text-sm">Direct verification with USCG National Maritime Center</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Insurance Review</div>
                        <div className="text-storm-gray text-sm">Coverage verification and certificate validation</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Vessel Inspection</div>
                        <div className="text-storm-gray text-sm">Safety equipment and documentation review</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Background Check</div>
                        <div className="text-storm-gray text-sm">Safety record and incident history review</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Ongoing Monitoring</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Annual Renewals</div>
                        <div className="text-storm-gray text-sm">License and insurance updates verified yearly</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Incident Reporting</div>
                        <div className="text-storm-gray text-sm">Safety incidents tracked and investigated</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Customer Feedback</div>
                        <div className="text-storm-gray text-sm">Safety-related reviews monitored and addressed</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1" size={16} />
                      <div>
                        <div className="font-medium">Compliance Audits</div>
                        <div className="text-storm-gray text-sm">Random safety and compliance inspections</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Reporting and Support */}
        <section className="bg-sea-foam p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Safety Reporting & Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <AlertTriangle className="text-orange-500 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Report Safety Concerns</h3>
              <p className="text-storm-gray text-sm mb-4">
                Report any safety issues or concerns about charter operations immediately.
              </p>
              <p className="text-ocean-blue font-medium">safety@charterly.com</p>
            </div>
            <div>
              <Shield className="text-green-500 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Emergency Contact</h3>
              <p className="text-storm-gray text-sm mb-4">
                24/7 emergency support for active charters and safety incidents.
              </p>
              <p className="text-ocean-blue font-medium">1-800-CHARTER-911</p>
            </div>
            <div>
              <FileText className="text-blue-500 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Compliance Resources</h3>
              <p className="text-storm-gray text-sm mb-4">
                Access safety manuals, regulations, and compliance documentation.
              </p>
              <p className="text-ocean-blue font-medium">resources@charterly.com</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}