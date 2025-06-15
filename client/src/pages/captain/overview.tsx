import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, TrendingUp, MessageCircle, Star, Ship, Plus } from "lucide-react";

export default function CaptainOverview() {
  const { user } = useAuth();

  // Fetch captain data from API
  const { data: captainData } = useQuery({
    queryKey: ["/api/captain/stats"],
    enabled: !!user,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ["/api/captain/bookings/recent"],
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

  const stats = captainData || {
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    responseRate: 0,
    upcomingTrips: 0,
    newMessages: 0
  };

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
                <p className="text-sm text-storm-gray">Welcome back, Captain {user.firstName}</p>
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
            <Link href="/captain/overview" className="border-b-2 border-ocean-blue text-ocean-blue py-4 px-1 font-medium">
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
              {stats.newMessages > 0 && (
                <Badge variant="destructive" className="ml-2">{stats.newMessages}</Badge>
              )}
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="text-ocean-blue" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Total Revenue</p>
                  <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Average Rating</p>
                  <p className="text-3xl font-bold">{stats.averageRating || 'N/A'}</p>
                </div>
                <Star className="text-yellow-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Response Rate</p>
                  <p className="text-3xl font-bold">{stats.responseRate}%</p>
                </div>
                <MessageCircle className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Bookings
                <Button variant="outline" size="sm" asChild>
                  <Link href="/captain/bookings">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings && recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{booking.customerName}</p>
                        <p className="text-sm text-storm-gray">{booking.date} • {booking.duration}</p>
                        <p className="text-sm text-storm-gray">Charter: {booking.charterTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${booking.amount}</p>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-storm-gray text-center py-8">No recent bookings</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full justify-start" asChild>
                  <Link href="/captain/charters/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Charter Listing
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/captain/calendar">
                    <Calendar className="w-4 h-4 mr-2" />
                    Update Availability
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/captain/messages">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Check Messages
                    {stats.newMessages > 0 && (
                      <Badge variant="destructive" className="ml-auto">{stats.newMessages}</Badge>
                    )}
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/captain/profile">
                    <Users className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/captain/analytics">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}