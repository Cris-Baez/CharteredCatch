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

  // ⚡ HOOKS SIEMPRE PRIMERO - antes de cualquier return condicional
  const { data: captains, isLoading: captainsLoading } = useQuery<(Captain & { user: any })[]>({
    queryKey: ["/api/admin/captains"],
    enabled: !!user && user.role === 'admin', // Solo ejecuta si es admin
  });

  const { data: charters, isLoading: chartersLoading } = useQuery<Charter[]>({
    queryKey: ["/api/admin/charters"],
    enabled: !!user && user.role === 'admin', // Solo ejecuta si es admin
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: !!user && user.role === 'admin', // Solo ejecuta si es admin
  });

  // ⚡ TODAS LAS MUTATIONS TAMBIÉN AL INICIO
  const updateCaptainMutation = useMutation({
    mutationFn: async ({ captainId, verified }: { captainId: number; verified: boolean }) => {
      return apiRequest(`/api/admin/captains/${captainId}`, "PATCH", { verified });
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
      return apiRequest(`/api/admin/charters/${charterId}`, "PATCH", { isListed });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-ocean-blue mr-3" size={32} />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-storm-gray">Manage captains and charters</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/">Back to Site</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="text-blue-500 mr-4" size={32} />
                <div>
                  <p className="text-sm font-medium text-storm-gray">Total Captains</p>
                  <p className="text-2xl font-bold">{captains?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="text-green-500 mr-4" size={32} />
                <div>
                  <p className="text-sm font-medium text-storm-gray">Verified Captains</p>
                  <p className="text-2xl font-bold">
                    {captains?.filter(c => c.verified).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ship className="text-ocean-blue mr-4" size={32} />
                <div>
                  <p className="text-sm font-medium text-storm-gray">Active Charters</p>
                  <p className="text-2xl font-bold">
                    {charters?.filter(c => c.isListed).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="text-purple-500 mr-4" size={32} />
                <div>
                  <p className="text-sm font-medium text-storm-gray">Subscriptions</p>
                  <p className="text-2xl font-bold">{subscriptions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab-based Admin Interface */}
        <Tabs defaultValue="captains" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="captains" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Captains
            </TabsTrigger>
            <TabsTrigger value="charters" className="flex items-center gap-2">
              <Ship className="w-4 h-4" />
              Charters
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Captains Tab */}
          <TabsContent value="captains" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Captain Verification Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {captainsLoading ? (
                  <p>Loading captains...</p>
                ) : (
                  <div className="space-y-4">
                    {captains?.map((captain) => (
                      <div key={captain.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {captain.user?.firstName} {captain.user?.lastName}
                          </p>
                          <p className="text-sm text-storm-gray">{captain.user?.email}</p>
                          <p className="text-sm text-storm-gray">License: {captain.licenseNumber}</p>
                          <p className="text-sm text-storm-gray">Location: {captain.location}</p>
                          <p className="text-sm text-storm-gray">Rating: {captain.rating} ({captain.reviewCount} reviews)</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={captain.verified ? "default" : "secondary"}>
                            {captain.verified ? "Verified" : "Pending"}
                          </Badge>
                          <Switch
                            checked={captain.verified ?? false}
                            onCheckedChange={(checked) => handleCaptainToggle(captain.id, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charters Tab */}
          <TabsContent value="charters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ship className="w-5 h-5 mr-2" />
                  Charter Visibility Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartersLoading ? (
                  <p>Loading charters...</p>
                ) : (
                  <div className="space-y-4">
                    {charters?.map((charter) => (
                      <div key={charter.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{charter.title}</p>
                          <p className="text-sm text-storm-gray">{charter.location}</p>
                          <p className="text-sm text-storm-gray">${charter.price}/trip • Max {charter.maxGuests} guests</p>
                          <p className="text-sm text-storm-gray">Species: {charter.targetSpecies}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={charter.isListed ? "default" : "secondary"}>
                            {charter.isListed ? "Listed" : "Hidden"}
                          </Badge>
                          <Switch
                            checked={charter.isListed ?? false}
                            onCheckedChange={(checked) => handleCharterToggle(charter.id, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscription Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <p>Loading subscriptions...</p>
                ) : (
                  <div className="space-y-4">
                    {subscriptions?.length === 0 ? (
                      <p className="text-center text-storm-gray py-8">No active subscriptions found</p>
                    ) : (
                      subscriptions?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-storm-gray">{user.email}</p>
                            <p className="text-sm text-storm-gray">Role: {user.role}</p>
                            <p className="text-sm text-storm-gray">
                              Joined: {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {user.stripeSubscriptionId ? "Active" : "Customer"}
                            </Badge>
                            {user.stripeCustomerId && (
                              <Badge variant="secondary">Stripe ID: {user.stripeCustomerId.slice(-4)}</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Platform Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Captains:</span>
                      <span className="font-semibold">{captains?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified Captains:</span>
                      <span className="font-semibold text-green-600">
                        {captains?.filter(c => c.verified).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Verification:</span>
                      <span className="font-semibold text-yellow-600">
                        {captains?.filter(c => !c.verified).length || 0}
                      </span>
                    </div>
                    <hr className="my-4" />
                    <div className="flex justify-between">
                      <span>Total Charters:</span>
                      <span className="font-semibold">{charters?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Listed Charters:</span>
                      <span className="font-semibold text-blue-600">
                        {charters?.filter(c => c.isListed).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hidden Charters:</span>
                      <span className="font-semibold text-gray-600">
                        {charters?.filter(c => !c.isListed).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Subscription Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Stripe Customers:</span>
                      <span className="font-semibold">{subscriptions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Subscriptions:</span>
                      <span className="font-semibold text-green-600">
                        {subscriptions?.filter(s => s.stripeSubscriptionId).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Captain Subscribers:</span>
                      <span className="font-semibold text-blue-600">
                        {subscriptions?.filter(s => s.role === 'captain').length || 0}
                      </span>
                    </div>
                    {subscriptions?.length === 0 && (
                      <p className="text-center text-storm-gray py-4">
                        No subscription data available yet
                      </p>
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