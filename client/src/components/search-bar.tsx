import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Fish, Clock, Calendar } from "lucide-react";

interface SearchBarProps {
  onSearch: (filters: {
    location: string;
    targetSpecies: string;
    duration: string;
    date: string;
  }) => void;
  initialValues?: {
    location: string;
    targetSpecies: string;
    duration: string;
    date?: string;
  };
}

export default function SearchBar({ onSearch, initialValues }: SearchBarProps) {
  const [location, setLocation] = useState(initialValues?.location || "");
  const [targetSpecies, setTargetSpecies] = useState(initialValues?.targetSpecies || "");
  const [duration, setDuration] = useState(initialValues?.duration || "");
  const [date, setDate] = useState(initialValues?.date || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = () => onSearch({ location, targetSpecies, duration, date });

  const targetSpeciesOptions = [
    "Any Species", "Tarpon", "Mahi-Mahi", "Snapper",
    "Grouper", "Bonefish", "Redfish", "Yellowfin Tuna",
    "Wahoo", "Permit", "Snook",
  ];

  const durationOptions = [
    "Any Duration", "Half Day (4hrs)", "Full Day (8hrs)",
    "Extended (10hrs)", "Multi-day",
  ];

  const filterChips = [
    { label: "Top Rated", value: "top" },
    { label: "Family Friendly", value: "family" },
    { label: "Luxury Boats", value: "luxury" },
    { label: "Budget Trips", value: "budget" },
  ];

  // === Autocomplete con Nominatim ===
  useEffect(() => {
    if (location.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            location
          )}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.slice(0, 5)); // máximo 5 sugerencias
      } catch {
        // ignore cancel/error
      }
    };
    fetchSuggestions();

    return () => controller.abort();
  }, [location]);

  return (
    <>
      {/* ===== MOBILE (md:hidden) ===== */}
      <div className="md:hidden">
        <Card className="bg-white rounded-2xl shadow-lg px-3 py-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Fila 1 */}
            <div className="grid grid-cols-2 gap-3 relative">
              {/* Location */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    type="text"
                    placeholder="Where to?"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowSuggestions(true);
                    }}
                    className="border border-gray-200 rounded-md h-10 text-sm"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-12 left-0 w-full bg-white border rounded-md shadow-md z-10">
                    {suggestions.map((s) => (
                      <div
                        key={s.place_id}
                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setLocation(s.display_name);
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-200 rounded-md h-10 text-sm"
                />
              </div>
            </div>

            {/* Fila 2 */}
            <div className="grid grid-cols-2 gap-3">
              {/* Species */}
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-gray-400 shrink-0" />
                <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                  <SelectTrigger className="border border-gray-200 rounded-md h-10 text-sm">
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSpeciesOptions.map((s) => (
                      <SelectItem key={s} value={s === "Any Species" ? "" : s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="border border-gray-200 rounded-md h-10 text-sm">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((d) => (
                      <SelectItem key={d} value={d === "Any Duration" ? "" : d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón */}
            <Button
              onClick={handleSearch}
              className="w-full h-11 rounded-lg bg-ocean-blue text-white hover:bg-blue-800 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* ===== DESKTOP (hidden md:block) ===== */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-full shadow-lg max-w-5xl mx-auto px-2 py-3">
          <div
            className="
              grid md:[grid-template-columns:1.2fr_1fr_1fr_1fr_auto]
              items-center
              divide-x divide-gray-200
            "
          >
            {/* Location */}
            <div className="flex items-center gap-2 px-4 relative">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                type="text"
                placeholder="Where to?"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                }}
                className="border-0 focus:ring-0 text-sm h-9"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-10 left-0 w-80 bg-white border rounded-md shadow-md z-10">
                  {suggestions.map((s) => (
                    <div
                      key={s.place_id}
                      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setLocation(s.display_name);
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                    >
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 px-4">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-0 focus:ring-0 text-sm h-9"
              />
            </div>

            {/* Species */}
            <div className="flex items-center gap-2 px-4">
              <Fish className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                <SelectTrigger className="border-0 focus:ring-0 text-sm h-9">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  {targetSpeciesOptions.map((s) => (
                    <SelectItem key={s} value={s === "Any Species" ? "" : s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 px-4">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="border-0 focus:ring-0 text-sm h-9">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d} value={d === "Any Duration" ? "" : d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón */}
            <div className="px-3">
              <Button
                onClick={handleSearch}
                className="h-10 w-10 rounded-full p-0 bg-ocean-blue text-white hover:bg-blue-800 flex items-center justify-center transition-transform hover:scale-105 shrink-0"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </>
  );
}

