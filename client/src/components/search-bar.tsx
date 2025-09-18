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

type NominatimItem = {
  place_id: string | number;
  display_name: string;
};

export default function SearchBar({ onSearch, initialValues }: SearchBarProps) {
  const [locationValue, setLocationValue] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [suggestions, setSuggestions] = useState<NominatimItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // estados separados para evitar conflictos
  const [showGuestPickerMobile, setShowGuestPickerMobile] = useState(false);
  const [showGuestPickerDesktop, setShowGuestPickerDesktop] = useState(false);
  const [showDatePickerMobile, setShowDatePickerMobile] = useState(false);
  const [showDatePickerDesktop, setShowDatePickerDesktop] = useState(false);

  const [_, navigate] = useLocation();
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

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
      try {
        const { location, date, guests } = JSON.parse(savedFilters);
        setLocationValue(location || "");
        setDate(date || "");
        setGuests(guests || 1);
      } catch {
        // ignore
      }
    }
  }, [initialValues]);

  useEffect(() => {
    localStorage.setItem(
      "searchFilters",
      JSON.stringify({
        location: locationValue,
        date,
        guests,
      })
    );
  }, [locationValue, date, guests]);

  // Autocomplete with Nominatim (debounce)
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
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Fetch error:", error);
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const mobileContainer = mobileDropdownRef.current;
      const desktopContainer = desktopDropdownRef.current;

      if (
        mobileContainer &&
        !mobileContainer.contains(e.target as Node) &&
        desktopContainer &&
        !desktopContainer.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Highlight match
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

  // Handle search
  const handleSearch = () => {
    const filters = {
      location: locationValue,
      date,
      guests: guests.toString(),
      targetSpecies: "",
      duration: "",
    };

    if (onSearch) onSearch({ location: locationValue, date, guests });
    const params = new URLSearchParams(filters).toString();
    navigate(`/search?${params}`);
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
      day: "numeric",
    });
  };

  return (
    <>
      {/* MOBILE */}
      <div className="md:hidden" data-testid="mobile-search-bar">
        <Card className="bg-white rounded-2xl shadow-sm p-1.5 ring-1 ring-gray-200">
          <div className="space-y-1.5">
            {/* Destination */}
            <div className="relative" ref={mobileDropdownRef}>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-gray-800 mb-0">
                    Where
                  </div>
                  <Input
                    type="text"
                    placeholder="Search destinations"
                    value={locationValue}
                    onChange={(e) => {
                      setLocationValue(e.target.value);
                      setShowSuggestions(true);
                    }}
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
                    <div
                      key={s.place_id}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`w-full px-4 py-2.5 text-left text-sm ${
                        i === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => selectSuggestion(s)}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(
                              s.display_name,
                              locationValue
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <Popover
              open={showDatePickerMobile}
              onOpenChange={setShowDatePickerMobile}
            >
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-left">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-gray-800 mb-0">
                      When
                    </div>
                    <div className="text-xs text-gray-700">
                      {date ? formatDate(date) : "Add dates"}
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm"
                />
              </PopoverContent>
            </Popover>

            {/* Guests */}
            <Popover
              open={showGuestPickerMobile}
              onOpenChange={setShowGuestPickerMobile}
            >
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-left">
                  <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-gray-800 mb-0">
                      Who
                    </div>
                    <div className="text-xs text-gray-700">
                      {formatGuestText(guests)}
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Guests</div>
                    <div className="text-[10px] text-gray-500">
                      Ages 13 or above
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustGuests(-1)}
                      disabled={guests <= 1}
                      className="w-6 h-6 rounded-full border border-gray-300"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {guests}
                    </span>
                    <button
                      onClick={() => adjustGuests(1)}
                      disabled={guests >= 16}
                      className="w-6 h-6 rounded-full border border-gray-300"
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
              className="w-full h-10 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </Button>
          </div>
        </Card>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-5xl mx-auto">
        <Card className="bg-white rounded-full shadow-md border border-gray-200">
          <div className="flex items-center">
            {/* Destination */}
            <div className="flex-1 relative" ref={desktopDropdownRef}>
              <Input
                type="text"
                placeholder="Where"
                value={locationValue}
                onChange={(e) => {
                  setLocationValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleLocationKeyDown}
                className="border-0 p-3 text-sm placeholder:text-gray-500 focus-visible:ring-0 bg-transparent"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.place_id}
                      onClick={() => selectSuggestion(s)}
                      className={`w-full px-4 py-2.5 text-left text-sm ${
                        i === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(
                              s.display_name,
                              locationValue
                            ),
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-200"></div>

            {/* Date */}
            <Popover
              open={showDatePickerDesktop}
              onOpenChange={setShowDatePickerDesktop}
            >
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 p-2 text-left">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      When
                    </div>
                    <div className="text-sm text-gray-500">
                      {date ? formatDate(date) : "Add dates"}
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm"
                />
              </PopoverContent>
            </Popover>

            <div className="w-px h-8 bg-gray-200"></div>

            {/* Guests */}
            <Popover
              open={showGuestPickerDesktop}
              onOpenChange={setShowGuestPickerDesktop}
            >
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 p-2 text-left">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      Who
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatGuestText(guests)}
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">Guests</div>
                    <div className="text-xs text-gray-500">
                      Ages 13 or above
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustGuests(-1)}
                      disabled={guests <= 1}
                      className="w-6 h-6 rounded-full border border-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {guests}
                    </span>
                    <button
                      onClick={() => adjustGuests(1)}
                      disabled={guests >= 16}
                      className="w-6 h-6 rounded-full border border-gray-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Button */}
            <div className="p-1">
              <Button
                onClick={handleSearch}
                className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center"
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
