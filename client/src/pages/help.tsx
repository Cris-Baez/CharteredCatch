
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";

export default function Help() {
  const faqs = [
    {
      question: "How do I book a charter?",
      answer: "Simply browse our available charters, select your preferred trip, choose your date and number of guests, then complete the booking form. You'll receive a confirmation email with all trip details."
    },
    {
      question: "What's included in the charter price?",
      answer: "All charters include professional fishing equipment, tackle, bait, and fishing licenses. Most also include safety equipment and basic first aid. Food, drinks, and gratuity are typically not included unless specified."
    },
    {
      question: "What should I bring on the trip?",
      answer: "Bring sunscreen, hat, sunglasses, camera, snacks/drinks (unless provided), and appropriate clothing. Some captains provide coolers with ice. Check your specific charter details for a complete list."
    },
    {
      question: "What's the cancellation policy?",
      answer: "Weather-related cancellations are fully refundable or can be rescheduled. Guest cancellations made 48+ hours in advance receive a full refund. Cancellations within 48 hours may be subject to fees."
    },
    {
      question: "Do I need fishing experience?",
      answer: "No experience required! Our professional captains welcome anglers of all skill levels and will teach you everything you need to know. Just bring your enthusiasm!"
    },
    {
      question: "What happens if the weather is bad?",
      answer: "Captain safety is our priority. If weather conditions are unsafe, your captain will contact you to reschedule or provide a full refund. We monitor weather closely and will make decisions by 6 AM on trip day."
    },
    {
      question: "How do I contact my captain?",
      answer: "After booking, you'll receive your captain's contact information. You can also message them directly through our platform using the Messages feature."
    },
    {
      question: "Can I bring my own food and drinks?",
      answer: "Most charters allow you to bring your own food and beverages. Some provide coolers with ice. Alcohol policies vary by captain, so please check your specific charter details."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center">
              <HelpCircle className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-storm-gray max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team. 
            We're here to help make your charter experience amazing!
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-ocean-blue mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-storm-gray mb-4">
                Chat with our support team for immediate assistance
              </p>
              <Button className="bg-ocean-blue hover:bg-blue-800 w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-ocean-blue mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-storm-gray mb-4">
                Send us an email and we'll respond within 24 hours
              </p>
              <Button variant="outline" className="w-full">
                support@charterly.com
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 text-ocean-blue mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-storm-gray mb-4">
                Call us Monday-Friday, 8 AM - 6 PM EST
              </p>
              <Button variant="outline" className="w-full">
                (555) 123-FISH
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-storm-gray">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-red-800 mb-2">Emergency Contact</h3>
            <p className="text-red-700 text-sm mb-4">
              If you're experiencing an emergency while on a charter, contact the Coast Guard immediately at 
              <strong> VHF Channel 16</strong> or call <strong>911</strong>.
            </p>
            <p className="text-red-700 text-sm">
              For non-emergency charter issues during your trip, contact our 24/7 support line: 
              <strong> (555) 123-HELP</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
