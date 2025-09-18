
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, MapPin, Fish, Clock, Calendar, X, Minus, Plus } from "lucide-react";

interface SearchBarInlineProps {
  onSearch?: (filters: {
    location: string;
    targetSpecies: string;
    duration: string;
    date: string;
  }) => void;
  initialValues?: {
    location?: string;
    targetSpecies?: string;
    duration?: string;
    date?: string;
  };
}

type NominatimItem = {
  place_id: string | number;
  display_name: string;
};

export default function SearchBarInline({ onSearch, initialValues }: SearchBarInlineProps) {
  const [locationValue, setLocationValue] = useState("");
  const [targetSpecies, setTargetSpecies] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");

  const [suggestions, setSuggestions] = useState<NominatimItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const targetSpeciesOptions = [
    "Any Species", "Tarpon", "Mahi-Mahi", "Snapper",
    "Grouper", "Bonefish", "Redfish", "Yellowfin Tuna",
    "Wahoo", "Permit", "Snook",
  ];

  const durationOptions = [
    "Any Duration", "Half Day (4hrs)", "Full Day (8hrs)",
    "Extended (10hrs)", "Multi-day",
  ];

  // cargar initialValues si existen
  useEffect(() => {
    if (initialValues) {
      setLocationValue(initialValues.location || "");
      setTargetSpecies(initialValues.targetSpecies || "");
      setDuration(initialValues.duration || "");
      setDate(initialValues.date || "");
    }
  }, [initialValues]);

  // persistencia localStorage
  useEffect(() => {
    const saved = localStorage.getItem("searchFiltersInline");
    if (saved && !initialValues) {
      try {
        const { location, targetSpecies, duration, date } = JSON.parse(saved);
        setLocationValue(location || "");
        setTargetSpecies(targetSpecies || "");
        setDuration(duration || "");
        setDate(date || "");
      } catch {
        // ignore
      }
    }
  }, [initialValues]);

  useEffect(() => {
    localStorage.setItem(
      "searchFiltersInline",
      JSON.stringify({
        location: locationValue,
        targetSpecies,
        duration,
        date,
      })
    );
  }, [locationValue, targetSpecies, duration, date]);

  // autocomplete con Nominatim (debounce)
  useEffect(() => {
    if (locationValue.trim().length < 3) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            locationValue.trim()
          )}`,
          { signal: controller.signal }
        );
        const data: NominatimItem[] = await res.json();
        setSuggestions(data.slice(0, 5));
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      }
      return () => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      };
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [locationValue]);

  // cerrar dropdown al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const mobileContainer = mobileDropdownRef.current;
      const desktopContainer = desktopDropdownRef.current;
      
      if (mobileContainer && !mobileContainer.contains(e.target as Node) && 
          desktopContainer && !desktopContainer.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // resaltar coincidencia (escapando el query para evitar regex raro)
  function highlightMatch(text: string, query: string) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  const selectSuggestion = (item: NominatimItem) => {
    setLocationValue(item.display_name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  // enviar búsqueda SOLO por callback
  const handleSearch = () => {
    if (onSearch) {
      onSearch({ location: locationValue, targetSpecies, duration, date });
    }
    // cerrar dropdown al buscar
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") handleSearch();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((idx) => (idx + 1 >= suggestions.length ? 0 : idx + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((idx) => (idx - 1 < 0 ? suggestions.length - 1 : idx - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]);
      else handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const clearField = (setter: (v: string) => void) => setter("");

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
                    onKeyDown={handleLocationKeyDown}
                    className="border-0 p-0 h-auto text-xs placeholder:text-gray-500 focus-visible:ring-0"
                    aria-expanded={showSuggestions}
                    aria-autocomplete="list"
                    aria-controls="location-suggestions"
                  />
                </div>
                {locationValue && (
                  <button 
                    onClick={() => clearField(setLocationValue)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Clear location"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="location-suggestions"
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white border rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto"
                  role="listbox"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s.place_id}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                        i === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => selectSuggestion(s)}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: highlightMatch(s.display_name, locationValue) }} />
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
                />
              </div>
              {date && (
                <button 
                  onClick={() => clearField(setDate)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Clear date"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Species - Full width */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
              <Fish className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] font-medium text-gray-800 mb-0">Species</div>
                <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                  <SelectTrigger className="border-0 p-0 h-auto text-xs focus:ring-0 bg-transparent">
                    <SelectValue placeholder="Any species" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSpeciesOptions.map((s) => (
                      <SelectItem key={s} value={s === "Any Species" ? "" : s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration - Full width */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] font-medium text-gray-800 mb-0">Duration</div>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="border-0 p-0 h-auto text-xs focus:ring-0 bg-transparent">
                    <SelectValue placeholder="Any duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((d) => (
                      <SelectItem key={d} value={d === "Any Duration" ? "" : d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-all hover:shadow-lg"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </Button>
          </div>
        </Card>
      </div>

      {/* DESKTOP - Horizontal layout */}
      <div className="hidden md:block max-w-5xl mx-auto" data-testid="desktop-search-bar">
        <Card className="bg-white rounded-full shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            {/* Destination */}
            <div className="flex-1 relative" ref={desktopDropdownRef}>
              <button 
                className="w-full flex items-center gap-2 p-2 pl-4 hover:bg-gray-50 rounded-l-full transition-colors text-left"
                onClick={() => {
                  const input = document.querySelector('[data-testid="desktop-destination-input"]') as HTMLInputElement;
                  input?.focus();
                }}
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 mb-1">Where</div>
                  <Input
                    type="text"
                    placeholder="Search destinations"
                    value={locationValue}
                    onChange={(e) => { setLocationValue(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleLocationKeyDown}
                    className="border-0 p-0 h-auto text-sm placeholder:text-gray-500 focus-visible:ring-0 bg-transparent"
                    aria-expanded={showSuggestions}
                    aria-autocomplete="list"
                    aria-controls="location-suggestions-desktop"
                    data-testid="desktop-destination-input"
                  />
                </div>
              </button>
              
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="location-suggestions-desktop"
                  className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto"
                  role="listbox"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s.place_id}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        i === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => selectSuggestion(s)}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: highlightMatch(s.display_name, locationValue) }} />
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
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors text-left"
                onClick={() => {
                  const input = document.querySelector('[data-testid="desktop-date-input"]') as HTMLInputElement;
                  input?.focus();
                }}
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 mb-1">When</div>
                  <div className="text-sm text-gray-500">
                    {date ? formatDate(date) : "Add dates"}
                  </div>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-0 p-0 h-0 opacity-0 absolute pointer-events-none"
                    data-testid="desktop-date-input"
                  />
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* Species */}
            <div className="flex-1">
              <button 
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 mb-1">Species</div>
                  <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                    <SelectTrigger className="border-0 p-0 h-auto text-sm focus:ring-0 bg-transparent">
                      <SelectValue placeholder="Any species" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetSpeciesOptions.map((s) => (
                        <SelectItem key={s} value={s === "Any Species" ? "" : s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* Duration */}
            <div className="flex-1">
              <button 
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 mb-1">Duration</div>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="border-0 p-0 h-auto text-sm focus:ring-0 bg-transparent">
                      <SelectValue placeholder="Any duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((d) => (
                        <SelectItem key={d} value={d === "Any Duration" ? "" : d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </button>
            </div>

            {/* Search Button */}
            <div className="p-1">
              <Button 
                onClick={handleSearch}
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:shadow-lg hover:scale-105"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
