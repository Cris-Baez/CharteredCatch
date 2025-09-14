import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Ship, Settings, CreditCard, BarChart3, Calendar, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Captain, Charter, User } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ⚡ HOOKS SIEMPRE PRIMERO - INCONDICIONALES
  const { data: captains, isLoading: captainsLoading } = useQuery<(Captain & { user: any })[]>({
    queryKey: ["/api/admin/captains"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: charters, isLoading: chartersLoading } = useQuery<Charter[]>({
    queryKey: ["/api/admin/charters"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: !!user && user.role === 'admin',
  });

  const updateCaptainMutation = useMutation({
    mutationFn: async ({ captainId, verified }: { captainId: number; verified: boolean }) => {
      return apiRequest("PATCH", `/api/admin/captains/${captainId}`, { verified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/captains"] });
      toast({
        title: "Captain Updated",
        description: "Captain verification status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update captain status.",
        variant: "destructive",
      });
    },
  });

  const updateCharterMutation = useMutation({
    mutationFn: async ({ charterId, isListed }: { charterId: number; isListed: boolean }) => {
      return apiRequest("PATCH", `/api/admin/charters/${charterId}`, { isListed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/charters"] });
      toast({
        title: "Charter Updated",
        description: "Charter visibility has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update charter visibility.",
        variant: "destructive",
      });
    },
  });

  // Check if user is admin - DESPUÉS de TODOS los hooks
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-storm-gray mb-6">You don't have permission to access the admin panel</p>
            <Button asChild>
              <a href="/">Return Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCaptainToggle = (captainId: number, verified: boolean) => {
    updateCaptainMutation.mutate({ captainId, verified });
  };

  const handleCharterToggle = (charterId: number, isListed: boolean) => {
    updateCharterMutation.mutate({ charterId, isListed });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 📱 Mobile-Friendly Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-2 sm:mr-3 shadow-lg">
                <Shield className="text-white" size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Admin Panel</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Gestión de la plataforma</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm bg-white/50 hover:bg-white/80 border-blue-200" 
                asChild
              >
                <a href="/">← Home</a>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async () => {
                  try {
                    await fetch("/api/logout", { method: "POST", credentials: "include" });
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Logout failed:", error);
                  }
                }}
                className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white border-0"
                data-testid="button-logout"
              >
                🚪 Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto py-6 sm:py-8 lg:py-10">
        {/* 🎨 Beautiful Stats Cards - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 mt-4 sm:mt-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-2 sm:mr-3">
                  <Users size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-100">Captains</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{captains?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-2 sm:mr-3">
                  <Shield size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-100">Verified</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">
                    {captains?.filter(c => c.verified).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-2 sm:mr-3">
                  <Ship size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-cyan-100">Charters</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">
                    {charters?.filter(c => c.isListed).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-2 sm:mr-3">
                  <CreditCard size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-purple-100">Subs</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{subscriptions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📱 Mobile-Optimized Tabs */}
        <Tabs defaultValue="captains" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/50 backdrop-blur-sm border border-blue-100 shadow-lg rounded-2xl p-1 mb-6 sm:mb-8">
            <TabsTrigger 
              value="captains" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Captains</span>
              <span className="sm:hidden">Cap</span>
            </TabsTrigger>
            <TabsTrigger 
              value="charters" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Ship className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Charters</span>
              <span className="sm:hidden">Boat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all duration-200"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Subs</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* 👨‍✈️ Captains Tab - Mobile Optimized */}
          <TabsContent value="captains" className="mt-6 sm:mt-8">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100 shadow-lg rounded-2xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg mr-2 shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-800">Verify Captains</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {captainsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                    {captains?.map((captain) => (
                      <div key={captain.id} className="bg-gradient-to-r from-white to-blue-50 p-3 sm:p-4 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Mobile Layout - Stacked */}
                        <div className="sm:hidden">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {captain.user?.firstName} {captain.user?.lastName}
                              </p>
                              <p className="text-xs text-gray-600 truncate">{captain.user?.email}</p>
                            </div>
                            <Switch
                              checked={captain.verified ?? false}
                              onCheckedChange={(checked) => handleCaptainToggle(captain.id, checked)}
                              className="ml-2 flex-shrink-0"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500 min-w-0 flex-1 truncate">
                              📍 {captain.location}
                            </div>
                            <Badge 
                              variant={captain.verified ? "default" : "secondary"} 
                              className={`ml-2 flex-shrink-0 text-xs ${captain.verified ? 'bg-green-500' : 'bg-gray-400'}`}
                            >
                              {captain.verified ? "✓ Ver" : "Pend"}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Desktop Layout - Side by side */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {captain.user?.firstName} {captain.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{captain.user?.email}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                              <span className="truncate">📍 {captain.location}</span>
                              <span>📋 {captain.licenseNumber}</span>
                              <span>⭐ {captain.rating} ({captain.reviewCount})</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                            <Badge variant={captain.verified ? "default" : "secondary"} className={captain.verified ? 'bg-green-500' : ''}>
                              {captain.verified ? "Verified" : "Pending"}
                            </Badge>
                            <Switch
                              checked={captain.verified ?? false}
                              onCheckedChange={(checked) => handleCaptainToggle(captain.id, checked)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🚢 Charters Tab - Mobile Optimized */}
          <TabsContent value="charters" className="mt-6 sm:mt-8">
            <Card className="bg-white/70 backdrop-blur-sm border-cyan-100 shadow-lg rounded-2xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg mr-2 shadow-lg">
                    <Ship className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-800">Gestionar Charters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {chartersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                    {charters?.map((charter) => (
                      <div key={charter.id} className="bg-gradient-to-r from-white to-cyan-50 p-3 sm:p-4 border border-cyan-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm truncate">{charter.title}</p>
                              <p className="text-xs text-gray-600 truncate">📍 {charter.location}</p>
                            </div>
                            <Switch
                              checked={charter.isListed ?? false}
                              onCheckedChange={(checked) => handleCharterToggle(charter.id, checked)}
                              className="ml-2 flex-shrink-0"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500 min-w-0 flex-1 truncate">
                              💰 ${charter.price} • 👥 {charter.maxGuests}
                            </div>
                            <Badge 
                              variant={charter.isListed ? "default" : "secondary"} 
                              className={`ml-2 flex-shrink-0 text-xs ${charter.isListed ? 'bg-cyan-500' : 'bg-gray-400'}`}
                            >
                              {charter.isListed ? "✓ Live" : "Hide"}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{charter.title}</p>
                            <p className="text-sm text-gray-600 truncate">📍 {charter.location}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                              <span>💰 ${charter.price}/trip</span>
                              <span>👥 Max {charter.maxGuests}</span>
                              <span className="truncate">🎣 {charter.targetSpecies}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                            <Badge variant={charter.isListed ? "default" : "secondary"} className={charter.isListed ? 'bg-cyan-500' : ''}>
                              {charter.isListed ? "Listed" : "Hidden"}
                            </Badge>
                            <Switch
                              checked={charter.isListed ?? false}
                              onCheckedChange={(checked) => handleCharterToggle(charter.id, checked)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 💳 Subscriptions Tab - Mobile Optimized */}
          <TabsContent value="subscriptions" className="mt-6 sm:mt-8">
            <Card className="bg-white/70 backdrop-blur-sm border-purple-100 shadow-lg rounded-2xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-2 shadow-lg">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-800">Subscriptions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {subscriptionsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                    {subscriptions?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl">
                          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">No hay suscripciones activas</p>
                          <p className="text-gray-500 text-sm mt-1">Los datos aparecerán cuando haya usuarios con Stripe</p>
                        </div>
                      </div>
                    ) : (
                      subscriptions?.map((user) => (
                        <div key={user.id} className="bg-gradient-to-r from-white to-purple-50 p-3 sm:p-4 border border-purple-100 rounded-xl shadow-sm">
                          {/* Mobile Layout */}
                          <div className="sm:hidden">
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                              </div>
                              <Badge 
                                variant="outline"
                                className={`ml-2 flex-shrink-0 text-xs ${user.stripeSubscriptionId ? 'bg-green-100 text-green-600 border-green-200' : 'bg-gray-100'}`}
                              >
                                {user.stripeSubscriptionId ? "✓ Act" : "Cust"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                👤 {user.role} • 📅 {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <span>👤 {user.role}</span>
                                <span>📅 {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                              <Badge variant="outline" className={user.stripeSubscriptionId ? 'bg-green-100 text-green-600 border-green-200' : ''}>
                                {user.stripeSubscriptionId ? "Active" : "Customer"}
                              </Badge>
                              {user.stripeCustomerId && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                                  💳 {user.stripeCustomerId.slice(-4)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📊 Analytics Tab - Mobile Optimized */}
          <TabsContent value="analytics" className="mt-6 sm:mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-100 shadow-lg rounded-2xl">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg mr-2 shadow-lg">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800">Platform Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">👨‍✈️ Total Captains:</span>
                      <span className="font-bold text-lg text-blue-600">{captains?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">✅ Verified:</span>
                      <span className="font-bold text-lg text-green-600">
                        {captains?.filter(c => c.verified).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">⏳ Pending:</span>
                      <span className="font-bold text-lg text-yellow-600">
                        {captains?.filter(c => !c.verified).length || 0}
                      </span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">🚢 Total Charters:</span>
                      <span className="font-bold text-lg text-cyan-600">{charters?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">👁️ Listed:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {charters?.filter(c => c.isListed).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">🙈 Hidden:</span>
                      <span className="font-bold text-lg text-gray-500">
                        {charters?.filter(c => !c.isListed).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100 shadow-lg rounded-2xl">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-2 shadow-lg">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800">Payment Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">💳 Stripe Customers:</span>
                      <span className="font-bold text-lg text-purple-600">{subscriptions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">🔄 Active Subs:</span>
                      <span className="font-bold text-lg text-green-600">
                        {subscriptions?.filter(s => s.stripeSubscriptionId).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50">
                      <span className="text-sm font-medium text-gray-700">👨‍✈️ Captain Subs:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {subscriptions?.filter(s => s.role === 'captain').length || 0}
                      </span>
                    </div>
                    {subscriptions?.length === 0 && (
                      <div className="text-center py-8">
                        <div className="bg-white/70 p-4 rounded-xl">
                          <p className="text-gray-600 text-sm">📊 No subscription data yet</p>
                          <p className="text-gray-500 text-xs mt-1">Data will appear when users subscribe</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}