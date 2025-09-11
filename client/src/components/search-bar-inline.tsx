import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Fish, Clock, Calendar, X } from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState<number>(-1); // para teclado en dropdown

  const dropdownRef = useRef<HTMLDivElement>(null);
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
      } catch {
        // ignore cancel/error
      }
      return () => controller.abort();
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [locationValue]);

  // cerrar dropdown al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  return (
    <>
      {/* MOBILE */}
      <div className="md:hidden">
        <Card className="bg-white rounded-2xl shadow-lg px-3 py-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3 relative" ref={dropdownRef}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 relative">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    type="text"
                    placeholder="Where to?"
                    value={locationValue}
                    onChange={(e) => { setLocationValue(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleLocationKeyDown}
                    className="border border-gray-200 rounded-md h-11 text-base pr-7"
                    aria-expanded={showSuggestions}
                    aria-autocomplete="list"
                    aria-controls="location-suggestions"
                  />
                  {locationValue && (
                    <X
                      className="absolute right-2 w-4 h-4 text-gray-400 cursor-pointer"
                      onClick={() => clearField(setLocationValue)}
                      aria-label="Clear location"
                    />
                  )}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    id="location-suggestions"
                    className="absolute top-14 left-0 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto"
                    role="listbox"
                  >
                    {suggestions.map((s, i) => (
                      <div
                        key={s.place_id}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          i === activeIndex ? "bg-gray-100" : "hover:bg-gray-100"
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        onClick={() => selectSuggestion(s)}
                        dangerouslySetInnerHTML={{ __html: highlightMatch(s.display_name, locationValue) }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 relative">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-200 rounded-md h-11 text-base pr-7"
                />
                {date && (
                  <X
                    className="absolute right-2 w-4 h-4 text-gray-400 cursor-pointer"
                    onClick={() => clearField(setDate)}
                    aria-label="Clear date"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-gray-400 shrink-0" />
                <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                  <SelectTrigger className="border border-gray-200 rounded-md h-11 text-base">
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSpeciesOptions.map((s) => (
                      <SelectItem key={s} value={s === "Any Species" ? "" : s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="border border-gray-200 rounded-md h-11 text-base">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((d) => (
                        <SelectItem key={d} value={d === "Any Duration" ? "" : d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSearch}
              className="w-full h-11 rounded-lg bg-ocean-blue text-white hover:bg-blue-800 font-semibold flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-full shadow-lg max-w-5xl mx-auto px-2 py-3">
          <div className="grid md:[grid-template-columns:1.2fr_1fr_1fr_1fr_auto] items-center divide-x divide-gray-200">
            <div className="flex items-center gap-2 px-4 relative" ref={dropdownRef}>
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                type="text"
                placeholder="Where to?"
                value={locationValue}
                onChange={(e) => { setLocationValue(e.target.value); setShowSuggestions(true); }}
                onKeyDown={handleLocationKeyDown}
                className="border-0 focus:ring-0 text-sm h-9 pr-7"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-controls="location-suggestions-desktop"
              />
              {locationValue && (
                <X
                  className="absolute right-3 w-4 h-4 text-gray-400 cursor-pointer"
                  onClick={() => clearField(setLocationValue)}
                  aria-label="Clear location"
                />
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="location-suggestions-desktop"
                  className="absolute top-10 left-0 w-80 bg-white border rounded-md shadow-md z-10 max-h-64 overflow-auto"
                  role="listbox"
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={s.place_id}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`px-3 py-2 text-sm cursor-pointer ${
                        i === activeIndex ? "bg-gray-100" : "hover:bg-gray-100"
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => selectSuggestion(s)}
                      dangerouslySetInnerHTML={{ __html: highlightMatch(s.display_name, locationValue) }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-4 relative">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-0 focus:ring-0 text-sm h-9 pr-7"
              />
              {date && (
                <X
                  className="absolute right-3 w-4 h-4 text-gray-400 cursor-pointer"
                  onClick={() => clearField(setDate)}
                  aria-label="Clear date"
                />
              )}
            </div>

            <div className="flex items-center gap-2 px-4">
              <Fish className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                <SelectTrigger className="border-0 focus:ring-0 text-sm h-9">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  {targetSpeciesOptions.map((s) => (
                    <SelectItem key={s} value={s === "Any Species" ? "" : s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 px-4">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="border-0 focus:ring-0 text-sm h-9">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d} value={d === "Any Duration" ? "" : d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
