
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("fisherman");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login logic
    alert(`Login functionality will be implemented with authentication system! Logging in as ${userRole}.`);
    
    // Route based on user role
    if (userRole === "captain") {
      setLocation("/captain/dashboard");
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <p className="text-center text-storm-gray">Sign in to your Charterly account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>I am signing in as:</Label>
                <RadioGroup value={userRole} onValueChange={setUserRole} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisherman" id="fisherman" />
                    <Label htmlFor="fisherman">Fisherman</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="captain" id="captain" />
                    <Label htmlFor="captain">Charter Captain</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-ocean-blue hover:bg-blue-800">
                Sign In as {userRole === "captain" ? "Captain" : "Fisherman"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-storm-gray">
                Don't have an account?{" "}
                <Link href="/signup" className="text-ocean-blue hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
