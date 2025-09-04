import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Clock, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Availability } from "@shared/schema";

export default function CaptainCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newSlots, setNewSlots] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get captain's charters first
  const { data: charters } = useQuery<any[]>({
    queryKey: ["/api/captain/charters"],
    enabled: !!user,
  });

  // Get availability for the current month
  const currentMonth = selectedDate ? selectedDate.toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7);
  
  const { data: availabilityData, isLoading } = useQuery<Availability[]>({
    queryKey: ["/api/availability", charters?.[0]?.id, currentMonth],
    queryFn: async () => {
      if (!charters?.[0]?.id) return [];
      const response = await fetch(`/api/availability?charterId=${charters[0].id}&month=${currentMonth}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
    enabled: !!charters?.[0]?.id,
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: { charterId: number; date: Date; slots: number }) => {
      return apiRequest("/api/availability", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Availability Added",
        description: "Your availability has been updated successfully.",
      });
      setIsAddingAvailability(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDateAvailability = (date: Date) => {
    if (!availabilityData) return [];
    const dateKey = date.toISOString().split('T')[0];
    return availabilityData.filter(avail => 
      avail.date && new Date(avail.date).toISOString().split('T')[0] === dateKey
    );
  };

  const handleAddAvailability = () => {
    if (!selectedDate || !charters?.[0]?.id) return;
    
    addAvailabilityMutation.mutate({
      charterId: charters[0].id,
      date: selectedDate,
      slots: newSlots,
    });
  };

  const selectedDateAvailability = selectedDate ? getDateAvailability(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/captain">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-deep-sea">Manage Availability</h1>
          </div>
          <Dialog open={isAddingAvailability} onOpenChange={setIsAddingAvailability}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Availability</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    defaultValue={selectedDate?.toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="slots">Available Slots</Label>
                  <Input 
                    id="slots" 
                    type="number" 
                    min="1"
                    max="10"
                    value={newSlots}
                    onChange={(e) => setNewSlots(parseInt(e.target.value) || 1)}
                    placeholder="Number of available slots"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingAvailability(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAvailability}>
                    Add Availability
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  available: (date) => {
                    const dayAvailability = getDateAvailability(date);
                    return dayAvailability.some(slot => slot.slots > slot.bookedSlots);
                  },
                  booked: (date) => {
                    const dayAvailability = getDateAvailability(date);
                    return dayAvailability.some(slot => slot.bookedSlots > 0 && slot.slots === slot.bookedSlots);
                  },
                }}
                modifiersStyles={{
                  available: { backgroundColor: '#dcfce7', color: '#166534' },
                  booked: { backgroundColor: '#fee2e2', color: '#dc2626' },
                }}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm">Available Slots</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm">Fully Booked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateAvailability.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateAvailability.map((availability) => (
                    <div key={availability.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {new Date(availability.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-storm-gray">
                          {availability.slots - availability.bookedSlots} of {availability.slots} slots available
                        </p>
                      </div>
                      <Badge 
                        variant={
                          availability.slots > availability.bookedSlots ? 'secondary' : 'destructive'
                        }
                      >
                        {availability.slots > availability.bookedSlots ? 'Available' : 'Fully Booked'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-storm-gray mx-auto mb-4" />
                  <p className="text-storm-gray">No availability set for this date</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddingAvailability(true)}
                  >
                    Add Availability
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Available Days</p>
                  <p className="text-3xl font-bold text-green-600">12</p>
                </div>
                <CalendarIcon className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Booked Days</p>
                  <p className="text-3xl font-bold text-blue-600">8</p>
                </div>
                <CalendarIcon className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Blocked Days</p>
                  <p className="text-3xl font-bold text-red-600">3</p>
                </div>
                <CalendarIcon className="text-red-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}