import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship } from "lucide-react";

// Mock captain data - in a real app this would come from auth
const MOCK_CAPTAIN_ID = 1;

export default function CaptainDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // In a real app, these would be separate API calls
  const { data: captain } = useQuery<Captain>({
    queryKey: [`/api/captains/${MOCK_CAPTAIN_ID}`],
  });

  const { data: charters } = useQuery<Charter[]>({
    queryKey: [`/api/charters/captain/${MOCK_CAPTAIN_ID}`],
  });

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: [`/api/bookings/captain/${MOCK_CAPTAIN_ID}`],
  });

  // Mock data for demonstration
  const mockStats = {
    totalEarnings: 12450,
    totalTrips: 42,
    avgRating: 4.9,
    responseRate: 98,
    upcomingBookings: 8,
    monthlyRevenue: 3200,
  };

  const mockRecentBookings = [
    {
      id: 1,
      guestName: "John Smith",
      tripDate: "2024-01-15",
      charter: "Tarpon Adventure",
      amount: 800,
      status: "confirmed",
    },
    {
      id: 2,
      guestName: "Sarah Johnson",
      tripDate: "2024-01-18",
      charter: "Offshore Fishing",
      amount: 1200,
      status: "pending",
    },
    {
      id: 3,
      guestName: "Mike Wilson",
      tripDate: "2024-01-20",
      charter: "Flats Fishing",
      amount: 650,
      status: "confirmed",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Captain Dashboard</h1>
            <p className="text-storm-gray">Welcome back, Captain Rodriguez!</p>
          </div>
          <Button className="bg-ocean-blue hover:bg-blue-800 mt-4 md:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Add New Charter
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-storm-gray">Total Earnings</p>
                  <p className="text-2xl font-bold text-ocean-blue">
                    ${mockStats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-ocean-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-storm-gray">Total Trips</p>
                  <p className="text-2xl font-bold">{mockStats.totalTrips}</p>
                </div>
                <Ship className="w-8 h-8 text-ocean-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-storm-gray">Average Rating</p>
                  <p className="text-2xl font-bold flex items-center">
                    {mockStats.avgRating}
                    <Star className="w-5 h-5 text-yellow-500 ml-1" />
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-storm-gray">Response Rate</p>
                  <p className="text-2xl font-bold">{mockStats.responseRate}%</p>
                </div>
                <MessageCircle className="w-8 h-8 text-ocean-blue" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="charters">My Charters</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{booking.guestName}</h4>
                          <p className="text-sm text-storm-gray">{booking.charter}</p>
                          <p className="text-sm text-storm-gray">
                            {new Date(booking.tripDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${booking.amount}</p>
                          <Badge 
                            variant={booking.status === "confirmed" ? "default" : "secondary"}
                            className={booking.status === "confirmed" ? "bg-verified-green" : ""}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Performance This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-storm-gray">Revenue</span>
                      <span className="font-semibold">${mockStats.monthlyRevenue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-storm-gray">Upcoming Bookings</span>
                      <span className="font-semibold">{mockStats.upcomingBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-storm-gray">Response Rate</span>
                      <span className="font-semibold">{mockStats.responseRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-storm-gray">Profile Views</span>
                      <span className="font-semibold">147</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {booking.guestName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{booking.guestName}</h4>
                          <p className="text-sm text-storm-gray">{booking.charter}</p>
                          <p className="text-sm text-storm-gray flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(booking.tripDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-semibold">${booking.amount}</p>
                        <Badge 
                          variant={booking.status === "confirmed" ? "default" : "secondary"}
                          className={booking.status === "confirmed" ? "bg-verified-green" : ""}
                        >
                          {booking.status}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">Message</Button>
                          {booking.status === "pending" && (
                            <Button size="sm" className="bg-ocean-blue hover:bg-blue-800">
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  My Charter Listings
                  <Button className="bg-ocean-blue hover:bg-blue-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Charter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Tarpon & Permit Adventure</h4>
                      <Badge className="bg-verified-green">Active</Badge>
                    </div>
                    <p className="text-sm text-storm-gray mb-2">
                      Islamorada, FL • 8 hours • Up to 4 guests
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ocean-blue">$800/trip</span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">John Smith</span>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-storm-gray">
                      "Incredible experience! Captain Rodriguez knows these waters like the back of his hand. 
                      We caught multiple tarpon and the whole experience was perfectly organized."
                    </p>
                    <p className="text-sm text-gray-400 mt-2">January 10, 2024</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>MW</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">Mike Wilson</span>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-storm-gray">
                      "Great captain and even better fishing! The boat was clean and well-equipped. 
                      Highly recommend for anyone looking for a professional guide in the Keys."
                    </p>
                    <p className="text-sm text-gray-400 mt-2">January 5, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}