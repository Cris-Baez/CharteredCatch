
import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Fish, MapPin, Clock, Users } from "lucide-react";

export default function Assistant() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{
    type: "user" | "assistant";
    content: string;
  }>>([
    {
      type: "assistant",
      content: "Hi! I'm your charter assistant. I can help you find the perfect fishing charter based on your preferences. What kind of fishing experience are you looking for?"
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newUserMessage = { type: "user" as const, content: message };
    setConversation(prev => [...prev, newUserMessage]);

    // Simulate AI response
    setTimeout(() => {
      const assistantResponse = generateResponse(message);
      setConversation(prev => [...prev, { type: "assistant", content: assistantResponse }]);
    }, 1000);

    setMessage("");
  };

  const generateResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("tarpon") || lowerMessage.includes("big fish")) {
      return "Great choice! For tarpon fishing, I'd recommend our Tarpon & Permit Adventure in Islamorada. It's an 8-hour trip with Captain Rodriguez, perfect for targeting these silver kings. The best time is during the migration season (May-July). Would you like me to show you this charter?";
    }
    
    if (lowerMessage.includes("offshore") || lowerMessage.includes("deep sea")) {
      return "Offshore fishing is exciting! I'd recommend checking out our Offshore Mahi & Tuna charter. It's a 10-hour trip that takes you 20+ miles offshore for mahi-mahi, yellowfin tuna, and sometimes marlin. The boat is equipped with all professional gear. Interested in learning more?";
    }
    
    if (lowerMessage.includes("beginner") || lowerMessage.includes("family")) {
      return "Perfect! For beginners and families, I recommend our Flats Fishing Experience. It's a relaxed 6-hour trip in shallow waters targeting snook, redfish, and trout. Captain Martinez is excellent with beginners and kids. The boat has a bathroom and shade. Sound good?";
    }
    
    if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return "Our charters range from $650-$1,500 depending on duration and target species. Flats fishing (6hrs) starts at $650, while offshore trips (10hrs) are around $1,200-$1,500. All include tackle, bait, and fishing licenses. Food and drinks are usually not included. Would you like specific pricing for any charter?";
    }
    
    return "I can help you find the perfect charter! Tell me more about what you're looking for - what type of fish, how many people, your experience level, or preferred location. I can also explain pricing, what's included, or help you compare different options.";
  };

  const quickQuestions = [
    "What's the best charter for beginners?",
    "I want to catch tarpon",
    "Show me offshore fishing options",
    "What's included in the price?",
    "Best time of year to fish?",
    "Family-friendly charters"
  ];

  const handleSearchByType = (targetSpecies: string) => {
    const searchParams = new URLSearchParams({ targetSpecies });
    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center">
              <Bot className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Charter Assistant</h1>
          <p className="text-storm-gray max-w-2xl mx-auto">
            Not sure which charter to book? I'm here to help! Tell me about your fishing preferences, 
            experience level, and what you're hoping to catch, and I'll recommend the perfect charter for you.
          </p>
        </div>

        {/* Quick Questions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Questions</h2>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(question)}
                className="text-sm"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Chat with Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Conversation */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      msg.type === "user"
                        ? "bg-ocean-blue text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about our charters..."
                className="flex-1 min-h-[60px]"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-ocean-blue hover:bg-blue-800 px-4"
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Charter Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSearchByType("Snook, Redfish, Trout")}
          >
            <CardContent className="p-6 text-center">
              <Fish className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Inshore Fishing</h3>
              <p className="text-sm text-storm-gray mb-4">
                Perfect for beginners and families. Target snook, redfish, and trout in calm waters.
              </p>
              <Badge variant="secondary">$650 - $800</Badge>
              <Button 
                className="w-full mt-4 bg-ocean-blue hover:bg-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearchByType("Snook, Redfish, Trout");
                }}
              >
                Search Inshore Charters
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSearchByType("Mahi-Mahi, Tuna, Marlin")}
          >
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Offshore Fishing</h3>
              <p className="text-sm text-storm-gray mb-4">
                Deep sea adventure for mahi, tuna, and marlin. For experienced anglers.
              </p>
              <Badge variant="secondary">$1,200 - $1,500</Badge>
              <Button 
                className="w-full mt-4 bg-ocean-blue hover:bg-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearchByType("Mahi-Mahi, Tuna, Marlin");
                }}
              >
                Search Offshore Charters
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSearchByType("Tarpon")}
          >
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-ocean-blue mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Tarpon Trips</h3>
              <p className="text-sm text-storm-gray mb-4">
                Target the silver king! Best from May to July with experienced captains.
              </p>
              <Badge variant="secondary">$800 - $1,000</Badge>
              <Button 
                className="w-full mt-4 bg-ocean-blue hover:bg-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearchByType("Tarpon");
                }}
              >
                Search Tarpon Trips
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
