// components/location-map-modal.tsx
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Fish, Clock, Anchor } from "lucide-react";
import { LatLngExpression, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: { location: string; targetSpecies: string; duration: string; boatType: string }) => void;
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMapModal({ open, onClose, onSearch }: LocationMapModalProps) {
  const [customLocation, setCustomLocation] = useState("");
  const [targetSpeciesFilter, setTargetSpeciesFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [boatTypeFilter, setBoatTypeFilter] = useState("");
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);

  const mapCenter: LatLngExpression = [39.8283, -98.5795]; // USA center

  const handleCustomLocationClick = (lat: number, lng: number) => {
    setClickedLocation({lat, lng});
    setCustomLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleSearch = () => {
    onSearch({
      location: customLocation,
      targetSpecies: targetSpeciesFilter,
      duration: durationFilter,
      boatType: boatTypeFilter
    });
  };

  const handleClear = () => {
    setCustomLocation("");
    setTargetSpeciesFilter("");
    setDurationFilter("");
    setBoatTypeFilter("");
    setClickedLocation(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-[80vh]">
          {/* Map Section */}
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              <MapClickHandler onLocationSelect={handleCustomLocationClick} />

              {clickedLocation && (
                <Marker position={[clickedLocation.lat, clickedLocation.lng] as LatLngExpression}>
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-semibold">Selected Location</h3>
                      <p className="text-sm text-gray-600">
                        {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Filters Section */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <DialogHeader className="p-6 border-b border-gray-200">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Choose your fishing destination
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Location Input */}
              <div>
                <h3 className="font-semibold mb-3">Location</h3>
                <Input
                  placeholder="Enter location or click on map"
                  value={customLocation}
                  onChange={(e) => {
                    setCustomLocation(e.target.value);
                    setClickedLocation(null);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Click anywhere on the map to select coordinates
                </p>
              </div>

              {/* Target Species */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Fish className="w-4 h-4" />
                  Target Species
                </h3>
                <Input
                  placeholder="What are you fishing for?"
                  value={targetSpeciesFilter}
                  onChange={(e) => setTargetSpeciesFilter(e.target.value)}
                />
              </div>

              {/* Trip Duration */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </h3>
                <Input
                  placeholder="How long do you want to fish?"
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                />
              </div>

              {/* Boat Type */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Anchor className="w-4 h-4" />
                  Boat Type
                </h3>
                <Input
                  placeholder="Preferred boat type"
                  value={boatTypeFilter}
                  onChange={(e) => setBoatTypeFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 space-y-3">
              <Button
                onClick={handleSearch}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!customLocation}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Charters
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}