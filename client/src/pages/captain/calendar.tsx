import { useState } from "react";
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

export default function CaptainCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const { toast } = useToast();

  // Mock availability data - in real app this would come from API
  const availability = {
    "2025-06-22": [
      { time: "6:00 AM", duration: "8 hours", status: "available" },
      { time: "2:00 PM", duration: "4 hours", status: "booked" }
    ],
    "2025-06-23": [
      { time: "7:00 AM", duration: "6 hours", status: "available" }
    ],
    "2025-06-24": [
      { time: "8:00 AM", duration: "4 hours", status: "blocked" }
    ]
  };

  const getDateAvailability = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return availability[dateKey as keyof typeof availability] || [];
  };

  const handleAddAvailability = () => {
    toast({
      title: "Availability Added",
      description: "Your availability has been updated successfully.",
    });
    setIsAddingAvailability(false);
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6:00 AM">6:00 AM</SelectItem>
                        <SelectItem value="7:00 AM">7:00 AM</SelectItem>
                        <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                        <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Select>
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
                  </div>
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
                  available: (date) => getDateAvailability(date).some(slot => slot.status === 'available'),
                  booked: (date) => getDateAvailability(date).some(slot => slot.status === 'booked'),
                  blocked: (date) => getDateAvailability(date).some(slot => slot.status === 'blocked'),
                }}
                modifiersStyles={{
                  available: { backgroundColor: '#dcfce7', color: '#166534' },
                  booked: { backgroundColor: '#dbeafe', color: '#1e40af' },
                  blocked: { backgroundColor: '#fee2e2', color: '#dc2626' },
                }}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm">Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm">Blocked</span>
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
                  {selectedDateAvailability.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{slot.time}</p>
                        <p className="text-sm text-storm-gray">{slot.duration}</p>
                      </div>
                      <Badge 
                        variant={
                          slot.status === 'available' ? 'secondary' :
                          slot.status === 'booked' ? 'default' : 'destructive'
                        }
                      >
                        {slot.status}
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