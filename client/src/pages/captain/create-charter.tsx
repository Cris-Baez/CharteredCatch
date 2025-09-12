// src/pages/captain/charters/create.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Star,
  MapPin,
  Users,
  Clock,
  Anchor,
  Image as ImageIcon,
  Shield,
} from "lucide-react";

/* =========================================
   Schema (idéntico a lo que ya usas)
========================================= */
const charterSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(1, "Location is required"),
  duration: z.string().min(1, "Duration is required"),
  maxGuests: z.number().min(1, "Must accommodate at least 1 guest").max(20, "Maximum 20 guests"),
  price: z.number().min(1, "Price must be greater than 0"),
  targetSpecies: z.string().min(1, "Target species is required"),
  boatType: z.string().min(1, "Boat type is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  includes: z.string().optional(),
  excludes: z.string().optional(), // no existe en DB; se ignora en POST
});

type CharterForm = z.infer<typeof charterSchema>;

export default function CreateCharter() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [customLocation, setCustomLocation] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [customBoatType, setCustomBoatType] = useState("");
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [showCustomSpecies, setShowCustomSpecies] = useState(false);
  const [showCustomBoatType, setShowCustomBoatType] = useState(false);

  const form = useForm<CharterForm>({
    resolver: zodResolver(charterSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      duration: "",
      maxGuests: 6,
      price: 0,
      targetSpecies: "",
      boatType: "",
      experienceLevel: "",
      includes: "",
      excludes: "",
    },
  });

  /* ======================
     Foto: subir / cover
  ====================== */
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }
    
    const data = await response.json();
    return data.secure_url;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const nextCount = uploadedPhotos.length + files.length;
    if (nextCount > 10) {
      toast({
        title: "Limit reached",
        description: "You can upload up to 10 photos.",
        variant: "destructive",
      });
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
          variant: "destructive",
        });
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image. Please select an image file.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const imageUrl = await uploadToCloudinary(file);
        setUploadedPhotos((prev) => [...prev, imageUrl]);
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error?.message || `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }

    // reset input para poder volver a seleccionar el mismo archivo si hace falta
    event.currentTarget.value = "";
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    setUploadedPhotos((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      return [picked, ...copy];
    });
  };

  /* ======================
     Mutación crear charter
  ====================== */
  const createCharterMutation = useMutation({
    mutationFn: async (data: CharterForm) => {
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        duration: data.duration,
        maxGuests: data.maxGuests,
        price: data.price,
        targetSpecies: data.targetSpecies,
        boatSpecs: `${data.boatType} • ${data.experienceLevel}`, // DB: boatSpecs (string)
        included: data.includes || null, // DB: included
        images: uploadedPhotos, // DB: images (string[])
        isListed: true,
        available: true,
      };

      const res = await fetch("/api/captain/charters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create charter");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Charter created", description: "Your listing is live." });
      queryClient.invalidateQueries({ queryKey: ["/api/captain/charters"] });
      setLocation("/captain/charters");
    },
    onError: (err: unknown) => {
      const message = (err as any)?.message ?? "Failed to create charter";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const onSubmit = (data: CharterForm) => createCharterMutation.mutate(data);

  /* ======================
     Sugerencias rápidas
  ====================== */
  const quickLocations = ["Key Largo", "Islamorada", "Marathon", "Big Pine Key", "Key West"];
  const quickDurations = ["4 hours", "6 hours", "8 hours", "Full day"];
  const quickSpecies = ["Mahi-Mahi", "Tarpon", "Sailfish", "Marlin", "Snapper", "Grouper", "Tuna", "Mixed Bag"];
  const quickBoats = ["Center Console", "Sport Fishing", "Flats Boat", "Bay Boat"];

  /* ======================
     Preview derivado
  ====================== */
  const cover = uploadedPhotos[0] || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop";
  const titlePreview = form.watch("title") || "Your charter title";
  const locationPreview = form.watch("location") || "—";
  const durationPreview = form.watch("duration") || "—";
  const guestsPreview = form.watch("maxGuests") || 0;
  const pricePreview = form.watch("price") || 0;
  const speciesPreview = form.watch("targetSpecies") || "—";
  const boatPreview = form.watch("boatType") || "—";
  const levelPreview = form.watch("experienceLevel") || "—";
  const includedPreview = form.watch("includes") || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/captain/overview">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Link>
          </Button>

          <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Tips: clear photos & detailed description improve conversion</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          {/* Básicos */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Charter Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Full Day Deep Sea Fishing Adventure"
                  {...form.register("title")}
                />
                <p className="text-xs text-gray-500 mt-1">Make it descriptive and specific.</p>
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the experience, what’s included, what to bring, meeting point, etc."
                  rows={5}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickLocations.map((l) => (
                      <Button
                        key={l}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowCustomLocation(false);
                          form.setValue("location", l);
                        }}
                      >
                        {l}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant={showCustomLocation ? "default" : "outline"}
                      onClick={() => setShowCustomLocation((s) => !s)}
                    >
                      Other
                    </Button>
                  </div>
                  <Select
                    onValueChange={(value) => {
                      if (value === "other") {
                        setShowCustomLocation(true);
                      } else {
                        setShowCustomLocation(false);
                        form.setValue("location", value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {quickLocations.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomLocation && (
                    <Input
                      placeholder="Enter custom location"
                      className="mt-2"
                      value={customLocation}
                      onChange={(e) => {
                        setCustomLocation(e.target.value);
                        form.setValue("location", e.target.value);
                      }}
                    />
                  )}
                  {form.formState.errors.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.location.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickDurations.map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => form.setValue("duration", d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                  <Select onValueChange={(value) => form.setValue("duration", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {quickDurations.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.duration && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.duration.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxGuests">Maximum Guests</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    min={1}
                    max={20}
                    {...form.register("maxGuests", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Up to 20 guests.</p>
                  {form.formState.errors.maxGuests && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.maxGuests.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={1}
                    placeholder="0"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Per trip (not per person).</p>
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Charter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetSpecies">Target Species</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {quickSpecies.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowCustomSpecies(false);
                        form.setValue("targetSpecies", s);
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant={showCustomSpecies ? "default" : "outline"}
                    onClick={() => setShowCustomSpecies((s) => !s)}
                  >
                    Other
                  </Button>
                </div>

                <Select
                  onValueChange={(value) => {
                    if (value === "other") {
                      setShowCustomSpecies(true);
                    } else {
                      setShowCustomSpecies(false);
                      form.setValue("targetSpecies", value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target species" />
                  </SelectTrigger>
                  <SelectContent>
                    {quickSpecies.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {showCustomSpecies && (
                  <Input
                    placeholder="Enter target species"
                    className="mt-2"
                    value={customSpecies}
                    onChange={(e) => {
                      setCustomSpecies(e.target.value);
                      form.setValue("targetSpecies", e.target.value);
                    }}
                  />
                )}
                {form.formState.errors.targetSpecies && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.targetSpecies.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boatType">Boat Type</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickBoats.map((b) => (
                      <Button
                        key={b}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowCustomBoatType(false);
                          form.setValue("boatType", b);
                        }}
                      >
                        {b}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant={showCustomBoatType ? "default" : "outline"}
                      onClick={() => setShowCustomBoatType((s) => !s)}
                    >
                      Other
                    </Button>
                  </div>

                  <Select
                    onValueChange={(value) => {
                      if (value === "other") {
                        setShowCustomBoatType(true);
                      } else {
                        setShowCustomBoatType(false);
                        form.setValue("boatType", value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select boat type" />
                    </SelectTrigger>
                    <SelectContent>
                      {quickBoats.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {showCustomBoatType && (
                    <Input
                      placeholder="Enter boat type"
                      className="mt-2"
                      value={customBoatType}
                      onChange={(e) => {
                        setCustomBoatType(e.target.value);
                        form.setValue("boatType", e.target.value);
                      }}
                    />
                  )}
                  {form.formState.errors.boatType && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.boatType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select onValueChange={(value) => form.setValue("experienceLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="All Levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.experienceLevel && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.experienceLevel.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="includes">What's Included (Optional)</Label>
                <Textarea
                  id="includes"
                  placeholder="e.g., Rods & reels, bait, licenses, ice & cooler, water…"
                  rows={3}
                  {...form.register("includes")}
                />
              </div>

              <div>
                <Label htmlFor="excludes">What's Not Included (Optional)</Label>
                <Textarea
                  id="excludes"
                  placeholder="(Optional note for your description — not stored separately)"
                  rows={3}
                  {...form.register("excludes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Charter Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300/70 p-6 text-center bg-white">
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <Label
                  htmlFor="photos"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload photos
                </Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Up to 10 images. First image is used as the cover.
                </p>
              </div>

              {uploadedPhotos.length > 0 ? (
                <div>
                  <Label>Uploaded Photos ({uploadedPhotos.length}/10)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Charter photo ${index + 1}`}
                          className={`w-full h-32 object-cover rounded-lg border ${index === 0 ? "ring-2 ring-ocean-blue" : ""}`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition"></div>
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          {index !== 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-white/95"
                              onClick={() => makeCover(index)}
                            >
                              Make cover
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/captain/charters">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createCharterMutation.isPending} className="min-w-[140px]">
              {createCharterMutation.isPending ? "Creating..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Charter
                </>
              )}
            </Button>
          </div>
        </form>

        {/* RIGHT: Live Preview (sticky) */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl shadow-md sticky top-6">
            <div className="h-40 w-full overflow-hidden rounded-t-2xl">
              <img src={cover} alt="cover" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{titlePreview}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ocean-blue" />
                    <span className="truncate">{locationPreview}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${pricePreview || 0}</div>
                  <div className="text-xs text-gray-500">per trip</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {durationPreview}
                </span>
                <span className="inline-flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {guestsPreview} guests
                </span>
                <span className="inline-flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  New
                </span>
              </div>

              <div className="text-sm text-gray-700">
                {speciesPreview !== "—" && (
                  <div className="mb-1">
                    🎣 <span className="font-medium">Target:</span> {speciesPreview}
                  </div>
                )}
                {(boatPreview !== "—" || levelPreview !== "—") && (
                  <div className="mb-1">
                    <Anchor className="w-4 h-4 inline mr-1" />
                    {boatPreview} • {levelPreview}
                  </div>
                )}
                {includedPreview && (
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">Includes:</span> {includedPreview}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
