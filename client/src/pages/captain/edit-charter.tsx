import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HeaderCaptain from "@/components/headercaptain";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Icons
import { ArrowLeft, Save, Ship, MapPin, DollarSign, Users, Clock, Image, X, Upload, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type Charter = {
  id: number;
  captainId: number;
  title: string;
  description?: string | null;
  location?: string | null;
  images: string[];
  price: number;
  duration: number;
  maxGuests: number;
  isListed: boolean;
  amenities: string[];
  requirements?: string | null;
};

export default function EditCharter() {
  const { user, isAuthenticated, isLoading: loadingAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/captain/charters/:id/edit");
  const { toast } = useToast();
  
  const charterId = params?.id;

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: 0,
    duration: 0,
    maxGuests: 0,
    isListed: false,
    amenities: [] as string[],
    requirements: "",
    images: [] as string[],
  });

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) {
      setLocation("/login");
      return;
    }
  }, [loadingAuth, isAuthenticated, setLocation]);

  // Fetch charter data
  const { data: charter, isLoading } = useQuery({
    enabled: !!charterId && isAuthenticated,
    queryKey: ["charter", charterId],
    queryFn: async (): Promise<Charter> => {
      const response = await fetch(`/api/charters/${charterId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch charter");
      return response.json();
    },
  });

  // Update form when charter data loads
  useEffect(() => {
    if (charter) {
      setFormData({
        title: charter.title || "",
        description: charter.description || "",
        location: charter.location || "",
        price: charter.price || 0,
        duration: charter.duration || 0,
        maxGuests: charter.maxGuests || 0,
        isListed: charter.isListed || false,
        amenities: charter.amenities || [],
        requirements: charter.requirements || "",
        images: charter.images || [],
      });
    }
  }, [charter]);

  // Update charter mutation
  const updateCharterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/charters/${charterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update charter");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Charter Updated",
        description: "Your charter has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["charter", charterId] });
      queryClient.invalidateQueries({ queryKey: ["charters"] });
      setLocation("/captain/charters");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update charter",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Client-side validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Image too large",
          description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image. Please select an image file.`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageDataUrl]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageReplace = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Image too large",
        description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not an image. Please select an image file.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => i === index ? imageDataUrl : img)
      }));
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleImageMoveToFirst = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: [
        prev.images[index],
        ...prev.images.filter((_, i) => i !== index)
      ]
    }));
  };

  const handleImageReorder = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData(prev => ({
      ...prev,
      images: items
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCharterMutation.mutate(formData);
  };

  if (loadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
        <HeaderCaptain />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-ocean-blue border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!charter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
        <HeaderCaptain />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Charter Not Found</h2>
              <p className="text-gray-600 mb-6">The charter you're trying to edit doesn't exist or you don't have permission to edit it.</p>
              <Button onClick={() => setLocation("/captain/charters")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Charters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const commonAmenities = [
    "WiFi", "Air Conditioning", "Sound System", "Bathroom", "Kitchen",
    "Fishing Equipment", "Snorkeling Gear", "Life Jackets", "Cooler",
    "Sunshade", "Seating", "Table", "Fresh Water", "Towels"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
      <HeaderCaptain />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation("/captain/charters")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Charters
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Charter</h1>
          <p className="text-gray-600">Update your charter details and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Charter Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Amazing Deep Sea Fishing Adventure"
                  required
                  data-testid="input-charter-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your charter experience, what guests can expect..."
                  rows={4}
                  data-testid="textarea-charter-description"
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Miami, FL"
                    className="pl-10"
                    required
                    data-testid="input-charter-location"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Charter Images
                {formData.images.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Images */}
                {formData.images.length > 0 && (
                  <div>
                    <Label>Charter Images</Label>
                    <p className="text-xs text-gray-500 mb-3">
                      {formData.images.length > 0 && "First image will be used as main photo"}
                    </p>
                    <DragDropContext onDragEnd={handleImageReorder}>
                      <Droppable droppableId="charter-images" direction="horizontal">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2"
                          >
                            {formData.images.map((image, index) => (
                              <Draggable key={`image-${index}`} draggableId={`image-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`relative group border rounded-lg overflow-hidden transition-transform ${
                                      snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
                                    }`}
                                  >
                                    {/* Drag handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="absolute top-2 right-2 z-10 bg-black/60 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Drag to reorder"
                                    >
                                      <GripVertical className="w-3 h-3" />
                                    </div>
                                    
                                    <img
                                      src={image}
                                      alt={`Charter image ${index + 1}`}
                                      className="w-full h-32 object-cover"
                                    />
                                    
                                    {/* Image overlay with controls */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="flex gap-2">
                                        {/* Make Main Photo */}
                                        {index !== 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleImageMoveToFirst(index)}
                                            className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                                            title="Set as main photo"
                                            data-testid={`button-make-main-${index}`}
                                          >
                                            <Upload className="w-3 h-3" />
                                          </button>
                                        )}
                                        
                                        {/* Replace Image */}
                                        <div>
                                          <input
                                            type="file"
                                            id={`replace-image-${index}`}
                                            accept="image/*"
                                            onChange={(e) => handleImageReplace(index, e)}
                                            className="hidden"
                                            data-testid={`input-replace-image-${index}`}
                                          />
                                          <label
                                            htmlFor={`replace-image-${index}`}
                                            className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors cursor-pointer inline-flex"
                                            title="Replace image"
                                          >
                                            <Image className="w-3 h-3" />
                                          </label>
                                        </div>
                                        
                                        {/* Delete Image */}
                                        <button
                                          type="button"
                                          onClick={() => handleImageRemove(index)}
                                          className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                          title="Delete image"
                                          data-testid={`button-remove-image-${index}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Main photo indicator */}
                                    {index === 0 && (
                                      <div className="absolute top-2 left-2">
                                        <Badge className="bg-blue-600 text-white text-xs">
                                          Main Photo
                                        </Badge>
                                      </div>
                                    )}
                                    
                                    {/* Image counter */}
                                    <div className="absolute bottom-2 right-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {index + 1}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
                
                {/* Add Images */}
                <div>
                  <Label>Add New Images</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-ocean-blue hover:bg-ocean-50 transition-colors"
                    >
                      <div className="text-center">
                        <Plus className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                        <span className="text-sm text-gray-600">
                          Click to add images
                        </span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add multiple images to showcase your charter. You can upload JPG, PNG files. First image will be used as main photo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price per Trip ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", Number(e.target.value))}
                  placeholder="500"
                  min="0"
                  required
                  data-testid="input-charter-price"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", Number(e.target.value))}
                    placeholder="6"
                    className="pl-10"
                    min="1"
                    required
                    data-testid="input-charter-duration"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxGuests">Max Guests *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="maxGuests"
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => handleInputChange("maxGuests", Number(e.target.value))}
                    placeholder="8"
                    className="pl-10"
                    min="1"
                    required
                    data-testid="input-charter-max-guests"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities & Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {commonAmenities.map((amenity) => (
                  <div
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.amenities.includes(amenity)
                        ? "bg-ocean-blue/10 border-ocean-blue text-ocean-blue"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    data-testid={`amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="text-sm font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="requirements">Special Requirements (Optional)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  placeholder="Any age restrictions, experience requirements, or special notes..."
                  rows={3}
                  data-testid="textarea-charter-requirements"
                />
              </div>
            </CardContent>
          </Card>

          {/* Listing Status */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Make this charter publicly visible</h4>
                  <p className="text-sm text-gray-600">
                    When enabled, customers can find and book this charter
                  </p>
                </div>
                <Switch
                  checked={formData.isListed}
                  onCheckedChange={(checked) => handleInputChange("isListed", checked)}
                  data-testid="switch-charter-listed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/captain/charters")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ocean-blue hover:bg-deep-blue"
              disabled={updateCharterMutation.isPending}
              data-testid="button-save-charter"
            >
              {updateCharterMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}