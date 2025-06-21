import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ship, Star, Edit, Camera, Save } from "lucide-react";

export default function CaptainProfile() {
  const { user } = useAuth();

  const { data: captain, isLoading } = useQuery({
    queryKey: ["/api/captain/profile"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={48} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-storm-gray mb-6">Please log in to access your captain dashboard</p>
            <Button asChild>
              <Link href="/api/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Ship className="text-ocean-blue mr-3" size={32} />
              <div>
                <h1 className="text-xl font-bold">Captain Portal</h1>
                <p className="text-sm text-storm-gray">Profile Settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/">View Public Site</Link>
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/captain/overview" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              Overview
            </Link>
            <Link href="/captain/charters" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              My Charters
            </Link>
            <Link href="/captain/bookings" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              Bookings
            </Link>
            <Link href="/captain/messages" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              Messages
            </Link>
            <Link href="/captain/earnings" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              Earnings
            </Link>
            <Link href="/captain/profile" className="border-b-2 border-ocean-blue text-ocean-blue py-4 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 mx-auto">
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback className="text-2xl">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-xl font-semibold mt-4">{user.firstName} {user.lastName}</h3>
                <p className="text-storm-gray">{user.email}</p>
                <div className="flex items-center justify-center mt-2">
                  <Star className="text-yellow-500 mr-1" size={16} />
                  <span className="font-medium">4.8</span>
                  <span className="text-storm-gray ml-1">(47 reviews)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-storm-gray">Total Trips</span>
                    <span className="font-semibold">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-storm-gray">Years Experience</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-storm-gray">Response Rate</span>
                    <span className="font-semibold">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-storm-gray">Member Since</span>
                    <span className="font-semibold">2023</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user.firstName || ""} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user.lastName || ""} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user.email || ""} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Key West, FL" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" placeholder="15" />
                </div>
                <div>
                  <Label htmlFor="license">Captain's License Number</Label>
                  <Input id="license" placeholder="USCG License #" />
                </div>
                <div>
                  <Label htmlFor="specialties">Fishing Specialties</Label>
                  <Input id="specialties" placeholder="Offshore, Tarpon, Inshore" />
                </div>
                <div>
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell customers about your experience, fishing style, and what makes your charters special..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Boat Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boatName">Boat Name</Label>
                    <Input id="boatName" placeholder="Sea Hunter" />
                  </div>
                  <div>
                    <Label htmlFor="boatType">Boat Type</Label>
                    <Input id="boatType" placeholder="Center Console" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="boatLength">Length (ft)</Label>
                    <Input id="boatLength" placeholder="32" />
                  </div>
                  <div>
                    <Label htmlFor="maxPassengers">Max Passengers</Label>
                    <Input id="maxPassengers" placeholder="6" />
                  </div>
                  <div>
                    <Label htmlFor="engines">Engines</Label>
                    <Input id="engines" placeholder="Twin 300hp" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="equipment">Equipment & Amenities</Label>
                  <Textarea 
                    id="equipment" 
                    placeholder="List your fishing equipment, safety gear, and boat amenities..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cancellation">Cancellation Policy</Label>
                  <Textarea 
                    id="cancellation" 
                    placeholder="Describe your cancellation and refund policy..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="policies">Additional Policies</Label>
                  <Textarea 
                    id="policies" 
                    placeholder="Any additional rules, requirements, or policies for your charters..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}