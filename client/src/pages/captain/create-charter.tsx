import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

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
  excludes: z.string().optional(),
});

type CharterForm = z.infer<typeof charterSchema>;

export default function CreateCharter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const createCharterMutation = useMutation({
    mutationFn: async (data: CharterForm) => {
      return await apiRequest("/api/captain/charters", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Charter listing created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/captain/charters"] });
      setLocation("/captain/charters");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create charter listing",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharterForm) => {
    createCharterMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/captain">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-deep-sea">Create New Charter Listing</h1>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
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
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your charter experience, what guests can expect, and what makes it special..."
                  rows={4}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select onValueChange={(value) => form.setValue("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Key Largo">Key Largo</SelectItem>
                      <SelectItem value="Islamorada">Islamorada</SelectItem>
                      <SelectItem value="Marathon">Marathon</SelectItem>
                      <SelectItem value="Big Pine Key">Big Pine Key</SelectItem>
                      <SelectItem value="Key West">Key West</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select onValueChange={(value) => form.setValue("duration", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4 hours">4 hours</SelectItem>
                      <SelectItem value="6 hours">6 hours</SelectItem>
                      <SelectItem value="8 hours">8 hours</SelectItem>
                      <SelectItem value="Full day">Full day</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.duration.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxGuests">Maximum Guests</Label>
                  <Input 
                    id="maxGuests" 
                    type="number" 
                    min="1" 
                    max="20"
                    {...form.register("maxGuests", { valueAsNumber: true })}
                  />
                  {form.formState.errors.maxGuests && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.maxGuests.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="1"
                    placeholder="0"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetSpecies">Target Species</Label>
                <Select onValueChange={(value) => form.setValue("targetSpecies", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mahi-Mahi">Mahi-Mahi</SelectItem>
                    <SelectItem value="Tarpon">Tarpon</SelectItem>
                    <SelectItem value="Sailfish">Sailfish</SelectItem>
                    <SelectItem value="Marlin">Marlin</SelectItem>
                    <SelectItem value="Snapper">Snapper</SelectItem>
                    <SelectItem value="Grouper">Grouper</SelectItem>
                    <SelectItem value="Tuna">Tuna</SelectItem>
                    <SelectItem value="Mixed Bag">Mixed Bag</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.targetSpecies && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.targetSpecies.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boatType">Boat Type</Label>
                  <Select onValueChange={(value) => form.setValue("boatType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select boat type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Center Console">Center Console</SelectItem>
                      <SelectItem value="Sport Fishing">Sport Fishing</SelectItem>
                      <SelectItem value="Flats Boat">Flats Boat</SelectItem>
                      <SelectItem value="Bay Boat">Bay Boat</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.boatType && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.boatType.message}</p>
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
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.experienceLevel.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="includes">What's Included (Optional)</Label>
                <Textarea 
                  id="includes" 
                  placeholder="e.g., Fishing equipment, bait, ice, cooler, water..."
                  rows={3}
                  {...form.register("includes")}
                />
              </div>

              <div>
                <Label htmlFor="excludes">What's Not Included (Optional)</Label>
                <Textarea 
                  id="excludes" 
                  placeholder="e.g., Fishing license, food, drinks, gratuity..."
                  rows={3}
                  {...form.register("excludes")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/captain">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={createCharterMutation.isPending}
              className="min-w-[120px]"
            >
              {createCharterMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Charter
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}