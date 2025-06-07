// Target species options for search filters
export const TARGET_SPECIES = [
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
  "Sailfish",
  "Marlin",
  "Cobia",
  "Kingfish",
] as const;

// Trip duration options
export const TRIP_DURATIONS = [
  "Any Duration",
  "Half Day (4hrs)",
  "Full Day (8hrs)", 
  "Extended (10hrs)",
  "Multi-day",
] as const;

// Florida Keys locations
export const LOCATIONS = [
  "Key Largo, FL",
  "Islamorada, FL", 
  "Marathon, FL",
  "Big Pine Key, FL",
  "Key West, FL",
  "Tavernier, FL",
  "Duck Key, FL",
  "Layton, FL",
  "Summerland Key, FL",
] as const;

// Booking status options
export const BOOKING_STATUSES = [
  "pending",
  "confirmed", 
  "cancelled",
  "completed",
] as const;

// Charter features/amenities
export const CHARTER_FEATURES = [
  "All tackle included",
  "Bait provided",
  "Fishing licenses",
  "Cooler with ice",
  "Snacks and drinks",
  "Lunch included",
  "Professional guide",
  "Safety equipment",
  "First aid kit",
  "Fish cleaning",
  "Photography",
  "Live bait",
  "Fly fishing gear",
  "Light tackle",
  "Heavy tackle",
] as const;

// Boat types
export const BOAT_TYPES = [
  "Center Console",
  "Flats Boat", 
  "Sport Fishing",
  "Bay Boat",
  "Catamaran",
  "Offshore",
  "Pontoon",
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate", 
  "Advanced",
  "Expert",
] as const;

// Rating values
export const RATING_VALUES = [1, 2, 3, 4, 5] as const;

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "distance", label: "Distance" },
] as const;

// Charter pricing tiers
export const PRICING_TIERS = [
  { min: 0, max: 500, label: "Under $500" },
  { min: 500, max: 1000, label: "$500 - $1,000" },
  { min: 1000, max: 1500, label: "$1,000 - $1,500" },
  { min: 1500, max: 2000, label: "$1,500 - $2,000" },
  { min: 2000, max: Infinity, label: "Over $2,000" },
] as const;

// Helper functions
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function formatDuration(duration: string): string {
  // Extract hours from duration string like "8 hours" or "Half Day (4hrs)"
  const hourMatch = duration.match(/(\d+)\s*h/i);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    if (hours < 6) return "Half Day";
    if (hours <= 8) return "Full Day";
    return "Extended";
  }
  
  if (duration.toLowerCase().includes("half")) return "Half Day";
  if (duration.toLowerCase().includes("full")) return "Full Day";
  if (duration.toLowerCase().includes("multi")) return "Multi-day";
  
  return duration;
}

export function formatExperience(experience: string): string {
  // Extract years from experience string
  const yearMatch = experience.match(/(\d+)[\+\s]*year/i);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    if (years < 5) return "5+ years";
    if (years < 10) return "10+ years";
    if (years < 15) return "15+ years";
    return "20+ years";
  }
  return experience;
}

export function getSpeciesCategory(species: string): string {
  const offshore = ["Mahi-Mahi", "Yellowfin Tuna", "Wahoo", "Sailfish", "Marlin"];
  const inshore = ["Snapper", "Grouper", "Cobia", "Kingfish"];
  const flats = ["Tarpon", "Bonefish", "Redfish", "Permit", "Snook"];
  
  if (offshore.some(s => species.includes(s))) return "Offshore";
  if (inshore.some(s => species.includes(s))) return "Inshore";
  if (flats.some(s => species.includes(s))) return "Flats";
  
  return "Mixed";
}

export function validateBookingDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date >= today;
}

export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Default values for forms
export const DEFAULT_SEARCH_FILTERS = {
  location: "",
  targetSpecies: "",
  duration: "",
};

export const DEFAULT_CHARTER_FORM = {
  title: "",
  description: "",
  location: "",
  targetSpecies: "",
  duration: "",
  maxGuests: 4,
  price: "",
  boatSpecs: "",
  included: "",
  images: [],
  available: true,
};

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

export function isValidPrice(price: string): boolean {
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  return priceRegex.test(price) && parseFloat(price) > 0;
}
