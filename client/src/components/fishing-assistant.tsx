import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Bot, Fish, MapPin, Clock, Users } from "lucide-react";

const fishingOptions = [
  {
    id: "offshore-big-game",
    title: "Offshore Big Game",
    description: "Deep sea fishing for trophy species like marlin, tuna, and mahi-mahi",
    species: ["Marlin", "Yellowfin Tuna", "Mahi-Mahi", "Wahoo"],
    duration: "10 hours",
    difficulty: "Advanced",
    bestFor: "Experienced anglers seeking trophy fish",
    searchFilters: { targetSpecies: "Marlin", duration: "Extended (10hrs)" }
  },
  {
    id: "flats-fishing",
    title: "Flats Fishing",
    description: "Sight fishing in shallow waters for bonefish, permit, and tarpon",
    species: ["Bonefish", "Permit", "Tarpon"],
    duration: "8 hours",
    difficulty: "Intermediate",
    bestFor: "Anglers who enjoy the challenge of sight fishing",
    searchFilters: { targetSpecies: "Bonefish", duration: "Full Day (8hrs)" }
  },
  {
    id: "inshore-family",
    title: "Inshore Family Trips",
    description: "Family-friendly fishing for snapper, grouper, and other reef fish",
    species: ["Snapper", "Grouper", "Cobia"],
    duration: "6 hours",
    difficulty: "Beginner",
    bestFor: "Families and first-time charter guests",
    searchFilters: { targetSpecies: "Snapper", duration: "Half Day (4hrs)" }
  },
  {
    id: "tarpon-season",
    title: "Tarpon Season Special",
    description: "Prime tarpon fishing during peak season with expert guides",
    species: ["Tarpon", "Snook", "Redfish"],
    duration: "8 hours",
    difficulty: "Intermediate",
    bestFor: "Anglers wanting to catch the 'silver king'",
    searchFilters: { targetSpecies: "Tarpon", duration: "Full Day (8hrs)" }
  }
];

interface FishingAssistantProps {
  onClose: () => void;
}

export default function FishingAssistant({ onClose }: FishingAssistantProps) {
  const [, setLocation] = useLocation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelectOption = (option: typeof fishingOptions[0]) => {
    const searchParams = new URLSearchParams();
    if (option.searchFilters.targetSpecies) {
      searchParams.set("targetSpecies", option.searchFilters.targetSpecies);
    }
    if (option.searchFilters.duration) {
      searchParams.set("duration", option.searchFilters.duration);
    }
    
    setLocation(`/search?${searchParams.toString()}`);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-ocean-blue" />
          <span>Fishing Assistant</span>
        </CardTitle>
        <p className="text-storm-gray">
          Tell me what kind of fishing experience you're looking for, and I'll recommend the perfect charter options for you.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fishingOptions.map((option) => (
          <div
            key={option.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-ocean-blue hover:shadow-md ${
              selectedOption === option.id ? "border-ocean-blue bg-blue-50" : "border-gray-200"
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{option.title}</h3>
              <Badge variant="outline" className="text-xs">
                {option.difficulty}
              </Badge>
            </div>
            
            <p className="text-storm-gray text-sm mb-3">{option.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-storm-gray mb-3">
              <div className="flex items-center">
                <Fish className="w-3 h-3 mr-1" />
                {option.species.slice(0, 2).join(", ")}
                {option.species.length > 2 && ` +${option.species.length - 2} more`}
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {option.duration}
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {option.bestFor.split(" ").slice(0, 2).join(" ")}...
              </div>
            </div>
            
            <Button
              size="sm"
              className="w-full bg-ocean-blue hover:bg-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectOption(option);
              }}
            >
              Find {option.title} Captains
            </Button>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Browse All Charters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}