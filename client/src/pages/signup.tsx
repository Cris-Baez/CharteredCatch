
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userRole: "fisherman",
    agreeToTerms: false
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }
    
    // TODO: Implement actual signup logic
    alert(`Signup functionality will be implemented with authentication system! Signing up as ${formData.userRole}.`);
    
    // Route based on user role
    if (formData.userRole === "captain") {
      setLocation("/captain/dashboard");
    } else {
      setLocation("/");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <p className="text-center text-storm-gray">Join Charterly and start fishing</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label>I am signing up as:</Label>
                <RadioGroup 
                  value={formData.userRole} 
                  onValueChange={(value) => handleInputChange("userRole", value)} 
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisherman" id="fisherman-signup" />
                    <Label htmlFor="fisherman-signup">Fisherman</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="captain" id="captain-signup" />
                    <Label htmlFor="captain-signup">Charter Captain</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>
              
              <Button type="submit" className="w-full bg-ocean-blue hover:bg-blue-800">
                Create {formData.userRole === "captain" ? "Captain" : "Fisherman"} Account
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-storm-gray">
                Already have an account?{" "}
                <Link href="/login" className="text-ocean-blue hover:underline">
                  Sign in
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
