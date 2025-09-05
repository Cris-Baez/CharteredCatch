
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Ship, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus, 
  MessageSquare, 
  Star,
  Menu,
  LogOut,
  User,
  Anchor,
  BookOpen,
  BarChart3
} from "lucide-react";

export default function CaptainOverview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/captain/stats"],
    enabled: !!user,
  });

  const { data: recentBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["/api/captain/bookings/recent"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={48} />
            <h2 className="text-xl font-bold mb-4">Captain Portal</h2>
            <p className="text-gray-600 mb-6">Please log in to access your captain dashboard</p>
            <Button asChild className="w-full">
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navigationItems = [
    { name: "Overview", href: "/captain/overview", icon: BarChart3, active: true },
    { name: "My Charters", href: "/captain/charters", icon: Anchor },
    { name: "Bookings", href: "/captain/bookings", icon: BookOpen },
    { name: "Messages", href: "/captain/messages", icon: MessageSquare },
    { name: "Earnings", href: "/captain/earnings", icon: DollarSign },
    { name: "Profile", href: "/captain/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImage || ""} alt={user?.name || "Captain"} />
              <AvatarFallback className="bg-ocean-blue text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-gray-900">Captain Portal</h1>
              <p className="text-sm text-gray-500">Welcome back!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button 
                          variant={item.active ? "default" : "ghost"} 
                          className="w-full justify-start"
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <div className="border-t pt-4">
                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <Ship className="w-8 h-8 text-ocean-blue mr-3" />
              <span className="text-xl font-bold text-gray-900">Captain Portal</span>
            </div>
            
            {/* User Info */}
            <div className="p-4 border-b">
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user?.profileImage || ""} alt={user?.name || "Captain"} />
                  <AvatarFallback className="bg-ocean-blue text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name || "Captain"}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button 
                      variant={item.active ? "default" : "ghost"} 
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="p-4 lg:p-8">
              {/* Welcome Section */}
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.firstName || "Captain"}!
                </h1>
                <p className="text-gray-600">Here's what's happening with your charters today.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <Card>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-ocean-blue" />
                      </div>
                      <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Bookings</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">
                          {loadingStats ? "..." : stats?.totalBookings || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                      </div>
                      <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Earnings</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">
                          ${loadingStats ? "..." : stats?.totalEarnings || "0"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" />
                      </div>
                      <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Rating</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">
                          {loadingStats ? "..." : stats?.averageRating || "4.8"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                      </div>
                      <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                        <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Reviews</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">
                          {loadingStats ? "..." : stats?.totalReviews || "127"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base lg:text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild className="w-full justify-start">
                      <Link href="/captain/create-charter">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Charter
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/captain/calendar">
                        <Calendar className="w-4 h-4 mr-2" />
                        Manage Calendar
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/captain/analytics">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base lg:text-lg">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingBookings ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentBookings?.length > 0 ? (
                      <div className="space-y-3">
                        {recentBookings.slice(0, 3).map((booking: any) => (
                          <div key={booking.id} className="border-b border-gray-100 pb-2 last:border-0">
                            <p className="text-sm font-medium text-gray-900">{booking.charterName}</p>
                            <p className="text-xs text-gray-500">{booking.customerName} • {booking.date}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No recent bookings</p>
                    )}
                    
                    <Button variant="ghost" className="w-full mt-4 text-sm" asChild>
                      <Link href="/captain/bookings">View All Bookings</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
