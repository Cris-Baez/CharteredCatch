import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ship, Search, Calendar, MapPin, Clock, Users, DollarSign, MessageCircle, Check, X } from "lucide-react";

export default function CaptainBookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/captain/bookings"],
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
                <p className="text-sm text-storm-gray">Manage Your Bookings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/">View Public Site</Link>
              </Button>
              <Button asChild>
                <Link href="/captain/charters/new">Add Charter</Link>
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
            <Link href="/captain/bookings" className="border-b-2 border-ocean-blue text-ocean-blue py-4 px-1 font-medium">
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
              <h2 className="text-2xl font-bold">Booking Management</h2>
              <p className="text-storm-gray">Review and manage your charter bookings</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-storm-gray" size={20} />
              <Input placeholder="Search bookings..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
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
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                        <Badge variant={
                          booking.status === 'confirmed' ? 'default' :
                          booking.status === 'pending' ? 'secondary' :
                          booking.status === 'completed' ? 'outline' : 'destructive'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-storm-gray">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {booking.duration}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {booking.partySize} passengers
                        </div>
                        <div className="flex items-center font-semibold text-ocean-blue">
                          <DollarSign className="w-4 h-4 mr-2" />
                          ${booking.amount}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-storm-gray">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          {booking.charterTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/captain/messages?booking=${booking.id}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Link>
                      </Button>
                      
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Button size="sm">
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="mx-auto mb-4 text-storm-gray" size={64} />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-storm-gray mb-6">
                Bookings will appear here once customers start booking your charters
              </p>
              <Button asChild>
                <Link href="/captain/charters">View My Charters</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-sm text-storm-gray">This Month</p>
              <p className="text-2xl font-bold">12</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-sm text-storm-gray">Revenue</p>
              <p className="text-2xl font-bold">$4,800</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="mx-auto mb-2 text-purple-500" size={24} />
              <p className="text-sm text-storm-gray">Passengers</p>
              <p className="text-2xl font-bold">48</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Check className="mx-auto mb-2 text-ocean-blue" size={24} />
              <p className="text-sm text-storm-gray">Completion Rate</p>
              <p className="text-2xl font-bold">98%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}