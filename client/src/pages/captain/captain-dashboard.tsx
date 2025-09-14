import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship } from "lucide-react";

export default function CaptainDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated captains to the new captain portal
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/captain/overview");
    }
  }, [isAuthenticated, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Ship className="mx-auto mb-4 text-ocean-blue animate-pulse" size={48} />
          <p className="text-storm-gray">Loading captain dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={48} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-storm-gray mb-6">Please log in to access your captain dashboard</p>
            <Button asChild>
              <a href="/login">Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This component will redirect, but show loading state briefly
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Ship className="mx-auto mb-4 text-ocean-blue animate-pulse" size={48} />
        <p className="text-storm-gray">Redirecting to captain portal...</p>
      </div>
    </div>
  );
}