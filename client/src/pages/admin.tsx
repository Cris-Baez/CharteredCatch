import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Users, Ship, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Captain, Charter } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
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

  const { data: captains, isLoading: captainsLoading } = useQuery<(Captain & { user: any })[]>({
    queryKey: ["/api/admin/captains"],
  });

  const { data: charters, isLoading: chartersLoading } = useQuery<Charter[]>({
    queryKey: ["/api/admin/charters"],
  });

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-storm-gray">Listed Charters</p>
                  <p className="text-2xl font-bold">
                    {charters?.filter(c => c.isListed).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Captain Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Captain Verification
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
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={captain.verified ? "default" : "secondary"}>
                          {captain.verified ? "Verified" : "Pending"}
                        </Badge>
                        <Switch
                          checked={captain.verified}
                          onCheckedChange={(checked) => handleCaptainToggle(captain.id, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charter Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="w-5 h-5 mr-2" />
                Charter Visibility
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
                        <p className="text-sm text-storm-gray">${charter.price}/trip</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={charter.isListed ? "default" : "secondary"}>
                          {charter.isListed ? "Listed" : "Hidden"}
                        </Badge>
                        <Switch
                          checked={charter.isListed}
                          onCheckedChange={(checked) => handleCharterToggle(charter.id, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}