import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ship, Plus, Edit, Eye, Trash2, Search, MapPin, Clock, Users, DollarSign } from "lucide-react";

export default function CaptainCharters() {
  const { user } = useAuth();

  const { data: charters, isLoading } = useQuery({
    queryKey: ["/api/captain/charters"],
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
                <p className="text-sm text-storm-gray">Manage Your Charters</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/">View Public Site</Link>
              </Button>
              <Button asChild>
                <Link href="/captain/charters/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Charter
                </Link>
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
            <Link href="/captain/charters" className="border-b-2 border-ocean-blue text-ocean-blue py-4 px-1 font-medium">
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
            <Link href="/captain/profile" className="border-b-2 border-transparent text-storm-gray hover:text-gray-900 py-4 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">My Charter Listings</h2>
              <p className="text-storm-gray">Manage and optimize your fishing charter listings</p>
            </div>
            <Button asChild>
              <Link href="/captain/charters/new">
                <Plus className="w-4 h-4 mr-2" />
                Create New Charter
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-storm-gray" size={20} />
              <Input 
                placeholder="Search your charters..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </div>

        {/* Charter Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : charters && charters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charters.map((charter) => (
              <Card key={charter.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={charter.images?.[0] || '/fishing1.jpg'} 
                    alt={charter.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge 
                    className="absolute top-2 right-2"
                    variant={charter.isActive ? "default" : "secondary"}
                  >
                    {charter.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{charter.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-storm-gray">
                      <MapPin className="w-4 h-4 mr-2" />
                      {charter.location}
                    </div>
                    <div className="flex items-center text-sm text-storm-gray">
                      <Clock className="w-4 h-4 mr-2" />
                      {charter.duration}
                    </div>
                    <div className="flex items-center text-sm text-storm-gray">
                      <Users className="w-4 h-4 mr-2" />
                      Up to {charter.maxPassengers} passengers
                    </div>
                    <div className="flex items-center text-sm font-semibold text-ocean-blue">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${charter.price}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/charter/${charter.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/captain/charters/${charter.id}/edit`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Ship className="mx-auto mb-4 text-storm-gray" size={64} />
              <h3 className="text-xl font-semibold mb-2">No Charters Listed</h3>
              <p className="text-storm-gray mb-6">
                Start earning by creating your first fishing charter listing
              </p>
              <Button asChild>
                <Link href="/captain/charters/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Charter
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Tips for Better Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Photography</h4>
                <ul className="space-y-1">
                  <li>• Use high-quality photos of your boat</li>
                  <li>• Show fishing equipment and amenities</li>
                  <li>• Include action shots of fishing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Descriptions</h4>
                <ul className="space-y-1">
                  <li>• Mention target species and techniques</li>
                  <li>• Highlight included equipment and services</li>
                  <li>• Share your experience and local knowledge</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}