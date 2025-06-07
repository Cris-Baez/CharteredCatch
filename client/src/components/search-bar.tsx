import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Fish, Clock } from "lucide-react";

interface SearchBarProps {
  onSearch: (filters: { location: string; targetSpecies: string; duration: string }) => void;
  initialValues?: {
    location: string;
    targetSpecies: string;
    duration: string;
  };
}

export default function SearchBar({ onSearch, initialValues }: SearchBarProps) {
  const [location, setLocation] = useState(initialValues?.location || "");
  const [targetSpecies, setTargetSpecies] = useState(initialValues?.targetSpecies || "");
  const [duration, setDuration] = useState(initialValues?.duration || "");

  const handleSearch = () => {
    onSearch({ location, targetSpecies, duration });
  };

  const targetSpeciesOptions = [
    "Any Species",
    "Tarpon",
    "Mahi-Mahi",
    "Snapper", 
    "Grouper",
    "Bonefish",
    "Redfish",
    "Yellowfin Tuna",
    "Wahoo",
    "Permit",
    "Snook",
  ];

  const durationOptions = [
    "Any Duration",
    "Half Day (4hrs)",
    "Full Day (8hrs)",
    "Extended (10hrs)",
    "Multi-day",
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Location */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Location
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Florida Keys, FL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-blue focus:border-transparent"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Target Species */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Target Species
            </label>
            <div className="relative">
              <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                <SelectTrigger className="pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-blue focus:border-transparent">
                  <SelectValue placeholder="Any Species" />
                </SelectTrigger>
                <SelectContent>
                  {targetSpeciesOptions.map((species) => (
                    <SelectItem key={species} value={species === "Any Species" ? "" : species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Fish className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Trip Duration */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Trip Duration
            </label>
            <div className="relative">
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-blue focus:border-transparent">
                  <SelectValue placeholder="Any Duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((dur) => (
                    <SelectItem key={dur} value={dur === "Any Duration" ? "" : dur}>
                      {dur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button 
              onClick={handleSearch}
              className="w-full bg-ocean-blue text-white hover:bg-blue-800 transition-colors font-semibold"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Charters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
