import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import HeaderCaptain from "@/components/headercaptain";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  DollarSign,
  CreditCard,
  Building2,
  Save,
  Shield,
  Info,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  Loader2,
} from "lucide-react";

type PaymentMethod = "bank" | "paypal" | "venmo" | "zelle" | "cashapp";

type PaymentInfo = {
  id: number;
  captainId: number;
  bankName: string | null;
  accountNumber: string | null; // masked por el backend
  routingNumber: string | null; // masked por el backend
  accountHolderName: string | null;
  paypalEmail: string | null;
  venmoUsername: string | null;
  zelleEmail: string | null;
  cashAppTag: string | null;
  instructions: string | null;
  preferredMethod: PaymentMethod;
};

type UpdatePaymentPayload = Partial<Omit<PaymentInfo, "id" | "captainId">>;

export default function CaptainPayments() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [preferredMethod, setPreferredMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [cashAppTag, setCashAppTag] = useState("");
  const [instructions, setInstructions] = useState("");

  const [activeTab, setActiveTab] = useState<"method" | "instructions" | "preview">("method");
  const [showAccount, setShowAccount] = useState(false);

  // Helpers para mask y placeholders
  const isMaskedValue = (v: string | null) => v?.startsWith("****") || false;
  const getMaskedPlaceholder = (v: string | null, label: string) =>
    isMaskedValue(v) ? `${label} ending in ${v?.slice(-4)} - enter new to update` : `Enter ${label.toLowerCase()}`;

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Load payment info
  const { data: paymentInfo, isLoading: loadingPaymentInfo } = useQuery<PaymentInfo>({
    queryKey: ["/api/captain/payment-info"],
    queryFn: async () => {
      const response = await fetch("/api/captain/payment-info", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to load payment information");
      }
      return response.json();
    },
  });

  // Sync form with loaded data
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

  // Track changes for optimistic UI
  const initialSnapshot = useMemo(() => paymentInfo ? JSON.stringify({
    preferredMethod: paymentInfo.preferredMethod,
    bankName: paymentInfo.bankName,
    accountHolderName: paymentInfo.accountHolderName,
    paypalEmail: paymentInfo.paypalEmail,
    venmoUsername: paymentInfo.venmoUsername,
    zelleEmail: paymentInfo.zelleEmail,
    cashAppTag: paymentInfo.cashAppTag,
    instructions: paymentInfo.instructions,
  }) : "", [paymentInfo]);

  const currentSnapshot = useMemo(() => JSON.stringify({
    preferredMethod,
    bankName,
    accountNumber,
    routingNumber,
    accountHolderName,
    paypalEmail,
    venmoUsername,
    zelleEmail,
    cashAppTag,
    instructions,
  }), [
    preferredMethod,
    bankName,
    accountNumber,
    routingNumber,
    accountHolderName,
    paypalEmail,
    venmoUsername,
    zelleEmail,
    cashAppTag,
    instructions,
  ]);

  const hasChanges = initialSnapshot !== currentSnapshot;

  // Validación por método (igual que el server)
  const methodIsComplete = useMemo(() => {
    switch (preferredMethod) {
      case "bank":
        return Boolean(bankName && accountHolderName && (accountNumber || paymentInfo?.accountNumber) && (routingNumber || paymentInfo?.routingNumber));
      case "paypal":
        return Boolean(paypalEmail);
      case "venmo":
        return Boolean(venmoUsername);
      case "zelle":
        return Boolean(zelleEmail);
      case "cashapp":
        return Boolean(cashAppTag);
      default:
        return false;
    }
  }, [
    preferredMethod,
    bankName,
    accountNumber,
    routingNumber,
    accountHolderName,
    paypalEmail,
    venmoUsername,
    zelleEmail,
    cashAppTag,
    paymentInfo?.accountNumber,
    paymentInfo?.routingNumber,
  ]);

  // Guardar - FIXED: Correct parameter order
  const saveMutation = useMutation({
    mutationFn: async (payload: UpdatePaymentPayload) => apiRequest("POST", "/api/captain/payment-info", payload),
    onSuccess: () => {
      toast({ title: "Saved", description: "Payment settings updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/captain/payment-info"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save payment settings", variant: "destructive" });
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

  // Preview lines for customer view
  const previewLines = useMemo(() => {
    const lines = [`💳 Payment method: ${preferredMethod?.toUpperCase()}`];

    switch (preferredMethod) {
      case "bank":
        if (bankName) lines.push(`🏦 Bank: ${bankName}`);
        if (accountHolderName) lines.push(`👤 Account holder: ${accountHolderName}`);
        if (routingNumber || paymentInfo?.routingNumber) lines.push(`🔢 Routing: ${routingNumber || paymentInfo?.routingNumber}`);
        if (accountNumber || paymentInfo?.accountNumber) lines.push(`💳 Account: ${accountNumber || paymentInfo?.accountNumber}`);
        break;
      case "paypal":
        if (paypalEmail) lines.push(`📧 PayPal: ${paypalEmail}`);
        break;
      case "venmo":
        if (venmoUsername) lines.push(`📱 Venmo: ${venmoUsername}`);
        break;
      case "zelle":
        if (zelleEmail) lines.push(`💸 Zelle: ${zelleEmail}`);
        break;
      case "cashapp":
        if (cashAppTag) lines.push(`💰 Cash App: ${cashAppTag}`);
        break;
    }

    if (instructions) lines.push(`📝 ${instructions}`);
    return lines;
  }, [preferredMethod, bankName, accountHolderName, routingNumber, accountNumber, paymentInfo?.routingNumber, paymentInfo?.accountNumber, paypalEmail, venmoUsername, zelleEmail, cashAppTag, instructions]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <HeaderCaptain />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Payment Settings
                </h1>
                <p className="text-gray-600">Configure how customers can pay you for charters</p>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={methodIsComplete ? "default" : "secondary"} className="gap-1">
                {methodIsComplete ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {methodIsComplete ? "Method configured" : "Incomplete method"}
              </Badge>
              {paymentInfo && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Data encrypted
                </Badge>
              )}
              {hasChanges && (
                <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                  <AlertCircle className="w-3 h-3" />
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Secure Payment Information</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Your payment information is encrypted and secure. This information will be shown to customers 
                      only after you confirm your booking requests.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <Info className="w-4 h-4" />
                      <span>Payments go directly to you - we don't process payments through the platform</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main content with tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-gray-100 rounded-xl">
              <TabsTrigger value="method" className="flex items-center gap-2 rounded-lg">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex items-center gap-2 rounded-lg">
                <Info className="w-4 h-4" />
                Instructions
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 rounded-lg">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* METHOD TAB */}
            <TabsContent value="method" className="mt-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Choose your preferred payment method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Method selector */}
                  <RadioGroup value={preferredMethod} onValueChange={(v) => setPreferredMethod(v as PaymentMethod)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { value: "bank", label: "Bank Transfer", icon: Building2 },
                        { value: "paypal", label: "PayPal", icon: CreditCard },
                        { value: "venmo", label: "Venmo", icon: CreditCard },
                        { value: "zelle", label: "Zelle", icon: CreditCard },
                        { value: "cashapp", label: "Cash App", icon: CreditCard },
                      ].map(({ value, label, icon: Icon }) => (
                        <Label
                          key={value}
                          htmlFor={value}
                          className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                            preferredMethod === value ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <RadioGroupItem value={value} id={value} />
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{label}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Method-specific fields */}
                  <AnimatePresence mode="wait">
                    {preferredMethod === "bank" && (
                      <motion.div
                        key="bank"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4 p-6 bg-gray-50 rounded-xl"
                      >
                        <h4 className="font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Bank account details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bankName">Bank name</Label>
                            <Input
                              id="bankName"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="e.g., Chase Bank"
                            />
                          </div>
                          <div>
                            <Label htmlFor="accountHolderName">Account holder name</Label>
                            <Input
                              id="accountHolderName"
                              value={accountHolderName}
                              onChange={(e) => setAccountHolderName(e.target.value)}
                              placeholder="Full name as on account"
                            />
                          </div>
                          <div>
                            <Label htmlFor="routingNumber">Routing number</Label>
                            <Input
                              id="routingNumber"
                              value={routingNumber}
                              onChange={(e) => setRoutingNumber(e.target.value)}
                              placeholder={paymentInfo ? getMaskedPlaceholder(paymentInfo.routingNumber, "Routing number") : "9-digit routing number"}
                              maxLength={9}
                            />
                            {paymentInfo && isMaskedValue(paymentInfo.routingNumber) && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Current routing number is hidden. Enter a new one to update.
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="accountNumber">Account number</Label>
                            <div className="flex gap-2">
                              <Input
                                id="accountNumber"
                                type={showAccount ? "text" : "password"}
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder={paymentInfo ? getMaskedPlaceholder(paymentInfo.accountNumber, "Account number") : "Your account number"}
                              />
                              <Button type="button" variant="secondary" onClick={() => setShowAccount((s) => !s)} title="Toggle visibility">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                            {paymentInfo && isMaskedValue(paymentInfo.accountNumber) && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Current number is hidden. Enter a new one to update.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {preferredMethod === "paypal" && (
                      <motion.div key="paypal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Label htmlFor="paypalEmail">PayPal email</Label>
                        <Input id="paypalEmail" type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="your@email.com" />
                      </motion.div>
                    )}

                    {preferredMethod === "venmo" && (
                      <motion.div key="venmo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Label htmlFor="venmoUsername">Venmo username</Label>
                        <Input id="venmoUsername" value={venmoUsername} onChange={(e) => setVenmoUsername(e.target.value)} placeholder="@your-venmo" />
                      </motion.div>
                    )}

                    {preferredMethod === "zelle" && (
                      <motion.div key="zelle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Label htmlFor="zelleEmail">Zelle (email or phone)</Label>
                        <Input id="zelleEmail" value={zelleEmail} onChange={(e) => setZelleEmail(e.target.value)} placeholder="email or phone" />
                      </motion.div>
                    )}

                    {preferredMethod === "cashapp" && (
                      <motion.div key="cashapp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Label htmlFor="cashAppTag">Cash App $cashtag</Label>
                        <Input id="cashAppTag" value={cashAppTag} onChange={(e) => setCashAppTag(e.target.value)} placeholder="$YourTag" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INSTRUCTIONS */}
            <TabsContent value="instructions" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Additional instructions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Explain deadlines, reference format, cancellation, deposit, etc. This shows to the customer with your method.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={6}
                    placeholder="Example: Include your booking code in the memo. Payment is due 24 hours before departure. Non-refundable within 48 hours."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREVIEW */}
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    What customers will see
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-white border p-4 sm:p-6">
                    <ul className="space-y-2 text-[15px] leading-relaxed">
                      {previewLines.map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-800">{line}</span>
                          {/* Copiar atajo si detectamos algo copiables */}
                          {idx > 0 && /@|\$|@|account|Bank|PayPal|Zelle|Cash App|Routing/i.test(line) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              onClick={() => {
                                const raw = line.split(":").slice(1).join(":").trim();
                                copy(raw);
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save bar at bottom */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      You have unsaved changes
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="gap-2"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saveMutation.isPending || !methodIsComplete}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        data-testid="button-save-payment-settings"
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Payment Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}