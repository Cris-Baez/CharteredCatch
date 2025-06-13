import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MessageCircle, Clock, AlertTriangle, BookOpen, Users, Shield } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Support Center
          </h1>
          <p className="text-xl text-storm-gray max-w-3xl mx-auto">
            We're here to help you with any questions or issues. Get support for bookings, 
            captain services, technical issues, and safety concerns.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Phone className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
              <p className="text-storm-gray text-sm mb-4">Speak directly with our support team</p>
              <p className="font-semibold text-ocean-blue">1-800-CHARTER</p>
              <p className="text-storm-gray text-xs">Mon-Sun 6AM-10PM EST</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Mail className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Email Support</h3>
              <p className="text-storm-gray text-sm mb-4">Get detailed help via email</p>
              <p className="font-semibold text-ocean-blue">support@charterly.com</p>
              <p className="text-storm-gray text-xs">Response within 2 hours</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <MessageCircle className="text-ocean-blue mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
              <p className="text-storm-gray text-sm mb-4">Instant help during business hours</p>
              <Button className="mt-2">Start Chat</Button>
              <p className="text-storm-gray text-xs mt-2">Available 7AM-9PM EST</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-red-200">
            <CardContent className="p-0">
              <AlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Emergency</h3>
              <p className="text-storm-gray text-sm mb-4">Safety emergencies at sea</p>
              <p className="font-semibold text-red-600">US Coast Guard</p>
              <p className="text-storm-gray text-xs">VHF Channel 16 or 911</p>
            </CardContent>
          </Card>
        </div>

        {/* Support Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How Can We Help?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 text-ocean-blue" size={24} />
                  For Anglers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Booking assistance and modifications</li>
                  <li>• Charter recommendations and matching</li>
                  <li>• Payment and refund inquiries</li>
                  <li>• Trip preparation and what to bring</li>
                  <li>• Communication with captains</li>
                  <li>• Weather-related cancellations</li>
                  <li>• Account management and settings</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">Contact Angler Support</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 text-ocean-blue" size={24} />
                  For Captains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Listing setup and optimization</li>
                  <li>• Booking management and calendar</li>
                  <li>• Payment processing and tax forms</li>
                  <li>• Marketing and profile enhancement</li>
                  <li>• Customer communication tools</li>
                  <li>• Insurance and licensing questions</li>
                  <li>• Technical platform support</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">Contact Captain Support</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 text-ocean-blue" size={24} />
                  General Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-storm-gray">
                  <li>• Account login and password issues</li>
                  <li>• Website navigation and features</li>
                  <li>• Mobile app support</li>
                  <li>• Privacy and security concerns</li>
                  <li>• Partnership and business inquiries</li>
                  <li>• Media and press requests</li>
                  <li>• Feedback and suggestions</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">General Inquiries</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Send Us a Message</CardTitle>
                <p className="text-center text-storm-gray">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Your first name" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Your last name" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" />
                </div>

                <div>
                  <Label htmlFor="category">Support Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking Assistance</SelectItem>
                      <SelectItem value="captain">Captain Support</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="payment">Payment/Billing</SelectItem>
                      <SelectItem value="safety">Safety Concern</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief description of your inquiry" />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Please provide details about your question or issue..."
                    rows={6}
                  />
                </div>

                <Button className="w-full">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How do I cancel or modify my booking?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    You can cancel or modify your booking up to 24 hours before departure through 
                    your account dashboard or by contacting the captain directly through our messaging system.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What if weather cancels my trip?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    Weather cancellations initiated by the captain result in a full refund or 
                    rescheduling at no additional cost. Safety is our top priority.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How are captains verified?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    All captains must provide valid USCG licenses, current insurance certificates, 
                    and pass background checks before listing their charters on our platform.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What should I bring on my charter?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    Most charters provide rods, reels, and bait. Bring sunscreen, snacks, drinks, 
                    and appropriate clothing. Check with your captain for specific recommendations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How do payments work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    Payments are processed securely through our platform. You pay the full amount 
                    upfront, and funds are released to the captain after trip completion.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I message the captain before booking?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-storm-gray">
                    Yes! We encourage communicating with captains before booking to discuss 
                    trip details, expectations, and any special requirements.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Business Hours */}
        <section className="bg-sea-foam p-8 rounded-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-center">
              <Clock className="mr-3 text-ocean-blue" size={28} />
              Support Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
                <p className="text-storm-gray">Monday - Sunday</p>
                <p className="text-storm-gray">6:00 AM - 10:00 PM EST</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                <p className="text-storm-gray">Monday - Sunday</p>
                <p className="text-storm-gray">7:00 AM - 9:00 PM EST</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                <p className="text-storm-gray">24/7 Availability</p>
                <p className="text-storm-gray">Response within 2 hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}