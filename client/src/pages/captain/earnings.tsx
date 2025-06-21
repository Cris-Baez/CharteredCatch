import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ship, DollarSign, TrendingUp, Calendar, Download } from "lucide-react";

export default function CaptainEarnings() {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ["/api/captain/earnings"],
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
                <p className="text-sm text-storm-gray">Earnings & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/">View Public Site</Link>
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
            <Link href="/captain/earnings" className="border-b-2 border-ocean-blue text-ocean-blue py-4 px-1 font-medium">
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
              <h2 className="text-2xl font-bold">Earnings Dashboard</h2>
              <p className="text-storm-gray">Track your charter business performance</p>
            </div>
            <Select defaultValue="30days">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Total Earnings</p>
                  <p className="text-3xl font-bold">$18,750</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">This Month</p>
                  <p className="text-3xl font-bold">$4,800</p>
                  <p className="text-sm text-green-600">+8% from last month</p>
                </div>
                <Calendar className="text-ocean-blue" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Average Per Trip</p>
                  <p className="text-3xl font-bold">$650</p>
                  <p className="text-sm text-green-600">+5% from last month</p>
                </div>
                <TrendingUp className="text-purple-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Pending Payouts</p>
                  <p className="text-3xl font-bold">$1,200</p>
                  <p className="text-sm text-storm-gray">3 trips completed</p>
                </div>
                <DollarSign className="text-orange-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Full Day Offshore</p>
                    <p className="text-sm text-storm-gray">June 15, 2024 • 6 passengers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$900</p>
                    <p className="text-xs text-storm-gray">Completed</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Half Day Inshore</p>
                    <p className="text-sm text-storm-gray">June 12, 2024 • 4 passengers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$450</p>
                    <p className="text-xs text-storm-gray">Completed</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Tarpon Special</p>
                    <p className="text-sm text-storm-gray">June 10, 2024 • 2 passengers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">$750</p>
                    <p className="text-xs text-storm-gray">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Payout Schedule</h4>
                  <p className="text-storm-gray">Payments are processed weekly on Fridays. Funds typically arrive within 1-2 business days.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Next Payout</h4>
                  <p className="text-storm-gray">June 21, 2024 - $1,200.00</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payment Method</h4>
                  <p className="text-storm-gray">Bank Transfer - ****1234</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Update Payment Method
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tax Information</h4>
                  <p className="text-storm-gray">1099 forms will be available in January</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Tax Documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}