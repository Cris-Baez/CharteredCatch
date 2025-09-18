import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, MapPin, Calendar, Users, X, Minus, Plus } from "lucide-react";

interface SearchBarProps {
  onSearch?: (filters: {
    location: string;
    date: string;
    guests: number;
  }) => void;
  initialValues?: {
    location?: string;
    date?: string;
    guests?: number;
  };
}

export default function SearchBar({ onSearch, initialValues }: SearchBarProps) {
  const [locationValue, setLocationValue] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const [_, navigate] = useLocation();
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  // Load initial values
  useEffect(() => {
    if (initialValues) {
      setLocationValue(initialValues.location || "");
      setDate(initialValues.date || "");
      setGuests(initialValues.guests || 1);
    }
  }, [initialValues]);

  // Persistence with localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem("searchFilters");
    if (savedFilters && !initialValues) {
      const { location, date, guests } = JSON.parse(savedFilters);
      setLocationValue(location || "");
      setDate(date || "");
      setGuests(guests || 1);
    }
  }, [initialValues]);

  useEffect(() => {
    localStorage.setItem("searchFilters", JSON.stringify({
      location: locationValue,
      date,
      guests,
    }));
  }, [locationValue, date, guests]);

  // Autocomplete with Nominatim
  useEffect(() => {
    if (locationValue.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationValue)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.slice(0, 5));
      } catch {
        // ignore cancel/error
      }
    };
    fetchSuggestions();
    return () => controller.abort();
  }, [locationValue]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const mobileContainer = mobileDropdownRef.current;
      const desktopContainer = desktopDropdownRef.current;
      
      if (mobileContainer && !mobileContainer.contains(e.target as Node) && 
          desktopContainer && !desktopContainer.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = () => {
    const filters = { 
      location: locationValue, 
      date, 
      guests: guests.toString(),
      // Keep compatibility with existing search params
      targetSpecies: "",
      duration: "",
    };
    
    if (onSearch) onSearch({ location: locationValue, date, guests });
    const params = new URLSearchParams(filters).toString();
    navigate(`/search?${params}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearField = (setter: (v: any) => void, defaultValue: any = "") => setter(defaultValue);

  const adjustGuests = (change: number) => {
    const newGuests = Math.max(1, Math.min(16, guests + change));
    setGuests(newGuests);
  };

  const formatGuestText = (count: number) => {
    if (count === 1) return "1 guest";
    return `${count} guests`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Add dates";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  return (
    <>
      {/* MOBILE - Stack vertically */}
      <div className="md:hidden" data-testid="mobile-search-bar">
        <Card className="bg-white rounded-2xl shadow-sm p-1.5 ring-1 ring-gray-200">
          <div className="space-y-1.5">
            {/* Destination - Full width */}
            <div className="relative" ref={mobileDropdownRef}>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-gray-800 mb-0">Where</div>
                  <Input
                    type="text"
                    placeholder="Search destinations"
                    value={locationValue}
                    onChange={(e) => { setLocationValue(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleKeyDown}
                    className="border-0 p-0 h-auto text-xs placeholder:text-gray-500 focus-visible:ring-0"
                    aria-expanded={showSuggestions}
                    data-testid="input-destination"
                  />
                </div>
                {locationValue && (
                  <button 
                    onClick={() => clearField(setLocationValue)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    data-testid="button-clear-destination"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      onClick={() => {
                        setLocationValue(s.display_name);
                        setShowSuggestions(false);
                      }}
                      data-testid={`suggestion-${s.place_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{s.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date - Full width */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] font-medium text-gray-800 mb-0">When</div>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-0 p-0 h-auto text-xs focus-visible:ring-0"
                  placeholder="Add dates"
                  data-testid="input-date"
                />
              </div>
              {date && (
                <button 
                  onClick={() => clearField(setDate)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="button-clear-date"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Guests - Full width */}
            <Popover open={showGuestPicker} onOpenChange={setShowGuestPicker}>
              <PopoverTrigger asChild>
                <button 
                  className="w-full flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  data-testid="button-guests"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-gray-800 mb-0">Who</div>
                    <div className="text-xs text-gray-700">{formatGuestText(guests)}</div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 rounded-2xl shadow-xl" align="start">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Guests</div>
                    <div className="text-[10px] text-gray-500">Ages 13 or above</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustGuests(-1)}
                      disabled={guests <= 1}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
                      data-testid="button-guests-decrease"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-8 text-center font-semibold" data-testid="text-guests-count">{guests}</span>
                    <button
                      onClick={() => adjustGuests(1)}
                      disabled={guests >= 16}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
                      data-testid="button-guests-increase"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-all hover:shadow-lg"
              data-testid="button-search"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </Button>
          </div>
        </Card>
      </div>

      {/* DESKTOP - Horizontal layout */}
      <div className="hidden md:block max-w-2x2 mx-auto" data-testid="desktop-search-bar">
        <Card className="bg-white rounded-full shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            {/* Destination */}
            <div className="flex-1 relative" ref={desktopDropdownRef}>
              <button 
                className="w-full flex items-center gap-2 p-3 pl-5 hover:bg-gray-50 rounded-l-full transition-colors text-left"
                onClick={() => {
                  const input = document.querySelector('[data-testid="desktop-destination-input"]') as HTMLInputElement;
                  input?.focus();
                }}
              >
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-gray-800 mb-1">Where</div>
                  <Input
                    type="text"
                    placeholder="Search destinations"
                    value={locationValue}
                    onChange={(e) => { setLocationValue(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleKeyDown}
                    className="border-0 p-0 h-auto text-sm placeholder:text-gray-500 focus-visible:ring-0 bg-transparent"
                    aria-expanded={showSuggestions}
                    data-testid="desktop-destination-input"
                  />
                </div>
              </button>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      onClick={() => {
                        setLocationValue(s.display_name);
                        setShowSuggestions(false);
                      }}
                      data-testid={`desktop-suggestion-${s.place_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{s.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* Date */}
            <div className="flex-1">
              <button 
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => {
                  const input = document.querySelector('[data-testid="desktop-date-input"]') as HTMLInputElement;
                  input?.focus();
                }}
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 mb-1">When</div>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-0 p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
                    placeholder="Add dates"
                    data-testid="desktop-date-input"
                  />
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* Guests */}
            <div className="flex-1">
              <Popover open={showGuestPicker} onOpenChange={setShowGuestPicker}>
                <PopoverTrigger asChild>
                  <button 
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                    data-testid="desktop-button-guests"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900 mb-1">Who</div>
                      <div className="text-sm text-gray-500">{formatGuestText(guests)}</div>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">Guests</div>
                      <div className="text-xs text-gray-500">Ages 13 or above</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => adjustGuests(-1)}
                        disabled={guests <= 1}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
                        data-testid="desktop-button-guests-decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold" data-testid="desktop-text-guests-count">{guests}</span>
                      <button
                        onClick={() => adjustGuests(1)}
                        disabled={guests >= 16}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
                        data-testid="desktop-button-guests-increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <div className="p-2">
              <Button 
                onClick={handleSearch}
                className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:shadow-lg hover:scale-105"
                data-testid="desktop-button-search"
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