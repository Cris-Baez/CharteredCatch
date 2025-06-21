import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CaptainAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/captain/stats"],
  });

  // Mock analytics data - in real app this would come from API
  const analyticsData = {
    revenue: {
      thisMonth: 8500,
      lastMonth: 7200,
      growth: 18.1
    },
    bookings: {
      thisMonth: 12,
      lastMonth: 10,
      growth: 20.0
    },
    averageRating: 4.8,
    repeatCustomers: 65,
    topCharters: [
      { name: "Deep Sea Adventure", bookings: 8, revenue: 3200 },
      { name: "Sunset Fishing", bookings: 6, revenue: 2400 },
      { name: "Half Day Trip", bookings: 4, revenue: 1600 }
    ],
    monthlyData: [
      { month: "Jan", revenue: 6500, bookings: 9 },
      { month: "Feb", revenue: 7200, bookings: 10 },
      { month: "Mar", revenue: 6800, bookings: 8 },
      { month: "Apr", revenue: 7800, bookings: 11 },
      { month: "May", revenue: 8200, bookings: 13 },
      { month: "Jun", revenue: 8500, bookings: 12 }
    ]
  };

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
            <h1 className="text-3xl font-bold text-deep-sea">Analytics & Insights</h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Monthly Revenue</p>
                  <p className="text-3xl font-bold">${analyticsData.revenue.thisMonth.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500 text-sm font-medium">
                      +{analyticsData.revenue.growth}%
                    </span>
                  </div>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Monthly Bookings</p>
                  <p className="text-3xl font-bold">{analyticsData.bookings.thisMonth}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500 text-sm font-medium">
                      +{analyticsData.bookings.growth}%
                    </span>
                  </div>
                </div>
                <Calendar className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Average Rating</p>
                  <p className="text-3xl font-bold">{analyticsData.averageRating}</p>
                  <div className="flex items-center mt-2">
                    <Star className="text-yellow-500 mr-1" size={16} />
                    <span className="text-storm-gray text-sm">Excellent</span>
                  </div>
                </div>
                <Star className="text-yellow-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Repeat Customers</p>
                  <p className="text-3xl font-bold">{analyticsData.repeatCustomers}%</p>
                  <div className="flex items-center mt-2">
                    <Users className="text-blue-500 mr-1" size={16} />
                    <span className="text-storm-gray text-sm">Strong loyalty</span>
                  </div>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyData.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium w-8">{month.month}</span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-ocean-blue h-2 rounded-full" 
                            style={{ 
                              width: `${(month.revenue / Math.max(...analyticsData.monthlyData.map(m => m.revenue))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">${month.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Charters */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Charters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCharters.map((charter, index) => (
                  <div key={charter.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{charter.name}</p>
                      <p className="text-sm text-storm-gray">{charter.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${charter.revenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="text-green-600 mr-2" size={20} />
                  <h3 className="font-semibold text-green-800">Strong Growth</h3>
                </div>
                <p className="text-sm text-green-700">
                  Your bookings are up 20% this month compared to last month. Keep up the great work!
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Star className="text-blue-600 mr-2" size={20} />
                  <h3 className="font-semibold text-blue-800">Excellent Reviews</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Your 4.8-star rating puts you in the top 10% of captains on the platform.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-2">
                  <Users className="text-yellow-600 mr-2" size={20} />
                  <h3 className="font-semibold text-yellow-800">Customer Loyalty</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  65% of your customers are repeat bookings - a sign of exceptional service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Optimize Your Most Popular Charter</h3>
                  <p className="text-sm text-storm-gray">
                    "Deep Sea Adventure" is your top performer. Consider creating similar offerings.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/captain/charters/new">Create Charter</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Update Your Availability</h3>
                  <p className="text-sm text-storm-gray">
                    Keep your calendar current to maximize booking opportunities.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/captain/calendar">Manage Calendar</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Follow Up with Recent Customers</h3>
                  <p className="text-sm text-storm-gray">
                    Send thank you messages to encourage reviews and repeat bookings.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/captain/messages">View Messages</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}