import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import HeaderCaptain from "@/components/headercaptain";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  CreditCard,
  Building2,
  Save,
  Shield,
  Info,
} from "lucide-react";

type PaymentInfo = {
  id: number;
  captainId: number;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  accountHolderName: string | null;
  paypalEmail: string | null;
  venmoUsername: string | null;
  zelleEmail: string | null;
  cashAppTag: string | null;
  instructions: string | null;
  preferredMethod: string;
};

type UpdatePaymentPayload = Partial<Omit<PaymentInfo, 'id' | 'captainId'>>;

export default function CaptainPayments() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form states
  const [preferredMethod, setPreferredMethod] = useState("bank");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [cashAppTag, setCashAppTag] = useState("");
  const [instructions, setInstructions] = useState("");

  // Helper to check if a value is masked
  const isMaskedValue = (value: string | null) => {
    return value?.startsWith("****") || false;
  };

  // Helper to get placeholder text for masked fields
  const getMaskedPlaceholder = (value: string | null, fieldName: string) => {
    if (isMaskedValue(value)) {
      return `${fieldName} ending in ${value?.slice(-4)} - enter new to update`;
    }
    return `Enter ${fieldName.toLowerCase()}`;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch payment info
  const {
    data: paymentInfo,
    isLoading: loadingPaymentInfo,
  } = useQuery<PaymentInfo>({
    queryKey: ["/api/captain/payment-info"],
    queryFn: async () => {
      const response = await fetch("/api/captain/payment-info", { 
        credentials: "include" 
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to load payment information");
      }
      return response.json();
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (paymentInfo) {
      setPreferredMethod(paymentInfo.preferredMethod || "bank");
      setBankName(paymentInfo.bankName || "");
      setAccountNumber(isMaskedValue(paymentInfo.accountNumber) ? "" : paymentInfo.accountNumber || "");
      setRoutingNumber(isMaskedValue(paymentInfo.routingNumber) ? "" : paymentInfo.routingNumber || "");
      setAccountHolderName(paymentInfo.accountHolderName || "");
      setPaypalEmail(paymentInfo.paypalEmail || "");
      setVenmoUsername(paymentInfo.venmoUsername || "");
      setZelleEmail(paymentInfo.zelleEmail || "");
      setCashAppTag(paymentInfo.cashAppTag || "");
      setInstructions(paymentInfo.instructions || "");
    }
  }, [paymentInfo]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: UpdatePaymentPayload) => {
      return apiRequest("POST", "/api/captain/payment-info", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/captain/payment-info"] });
    },
    onError: (error) => {
      console.error("Save payment error:", error);
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const payload: UpdatePaymentPayload = {
      preferredMethod,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      routingNumber: routingNumber || null,
      accountHolderName: accountHolderName || null,
      paypalEmail: paypalEmail || null,
      venmoUsername: venmoUsername || null,
      zelleEmail: zelleEmail || null,
      cashAppTag: cashAppTag || null,
      instructions: instructions || null,
    };

    saveMutation.mutate(payload);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <DollarSign className="mx-auto mb-4 text-ocean-blue" size={64} />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderCaptain />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Settings</h1>
          <p className="text-gray-600">Configure how customers can pay you for charters</p>
        </div>

        {/* Security Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Secure Payment Information</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Your payment information is encrypted and secure. This information will be shown to customers 
                  only after you confirm their booking requests.
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Info className="w-4 h-4" />
                  <span>Payments go directly to you - we don't process payments through the platform</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ocean-blue" />
              Preferred Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={preferredMethod} onValueChange={setPreferredMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="venmo" id="venmo" />
                <Label htmlFor="venmo">Venmo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zelle" id="zelle" />
                <Label htmlFor="zelle">Zelle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cashapp" id="cashapp" />
                <Label htmlFor="cashapp">Cash App</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {preferredMethod === "bank" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-ocean-blue" />
                Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    data-testid="input-bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase Bank"
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    data-testid="input-account-holder"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name as on account"
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    data-testid="input-routing-number"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder={paymentInfo ? getMaskedPlaceholder(paymentInfo.routingNumber, "Routing number") : "9-digit routing number"}
                    maxLength={9}
                  />
                  {paymentInfo && isMaskedValue(paymentInfo.routingNumber) && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Current routing number is hidden for security. Enter new number to update.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    data-testid="input-account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={paymentInfo ? getMaskedPlaceholder(paymentInfo.accountNumber, "Account number") : "Your account number"}
                    type="password"
                  />
                  {paymentInfo && isMaskedValue(paymentInfo.accountNumber) && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Current account number is hidden for security. Enter new number to update.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Digital Payment Methods */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Digital Payment Methods</CardTitle>
            <p className="text-sm text-gray-600">
              Configure alternative payment options for your customers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input
                  id="paypalEmail"
                  data-testid="input-paypal-email"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="venmoUsername">Venmo Username</Label>
                <Input
                  id="venmoUsername"
                  data-testid="input-venmo-username"
                  value={venmoUsername}
                  onChange={(e) => setVenmoUsername(e.target.value)}
                  placeholder="@your-venmo-handle"
                />
              </div>
              <div>
                <Label htmlFor="zelleEmail">Zelle Email/Phone</Label>
                <Input
                  id="zelleEmail"
                  data-testid="input-zelle-email"
                  value={zelleEmail}
                  onChange={(e) => setZelleEmail(e.target.value)}
                  placeholder="email@example.com or phone number"
                />
              </div>
              <div>
                <Label htmlFor="cashAppTag">Cash App Tag</Label>
                <Input
                  id="cashAppTag"
                  data-testid="input-cashapp-tag"
                  value={cashAppTag}
                  onChange={(e) => setCashAppTag(e.target.value)}
                  placeholder="$YourCashTag"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Additional Instructions</CardTitle>
            <p className="text-sm text-gray-600">
              Custom instructions for customers on how to complete payment
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              data-testid="textarea-payment-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Please include your booking reference number in the payment memo. Payment is due 24 hours before the charter date."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-8"
            data-testid="button-save-payment-settings"
          >
            {saveMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Payment Settings
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}