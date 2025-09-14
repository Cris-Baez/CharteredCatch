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
    isMaskedValue(v) ? `${label} ending in ${v?.slice(-4)} — enter new to update` : `Enter ${label.toLowerCase()}`;

  // Redirigir si no auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Cargar info
  const { data: paymentInfo, isLoading: loadingPaymentInfo } = useQuery<PaymentInfo | null>({
    queryKey: ["/api/captain/payment-info"],
    queryFn: async () => {
      const res = await fetch("/api/captain/payment-info", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to load payment information");
      }
      return res.json();
    },
  });

  // Sincronizar con el form
  useEffect(() => {
    if (paymentInfo) {
      setPreferredMethod((paymentInfo.preferredMethod || "bank") as PaymentMethod);
      setBankName(paymentInfo.bankName || "");
      setAccountHolderName(paymentInfo.accountHolderName || "");
      setAccountNumber(isMaskedValue(paymentInfo.accountNumber) ? "" : paymentInfo.accountNumber || "");
      setRoutingNumber(isMaskedValue(paymentInfo.routingNumber) ? "" : paymentInfo.routingNumber || "");
      setPaypalEmail(paymentInfo.paypalEmail || "");
      setVenmoUsername(paymentInfo.venmoUsername || "");
      setZelleEmail(paymentInfo.zelleEmail || "");
      setCashAppTag(paymentInfo.cashAppTag || "");
      setInstructions(paymentInfo.instructions || "");
    }
  }, [paymentInfo]);

  // Detección de cambios (para barra sticky)
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        preferredMethod: paymentInfo?.preferredMethod || "bank",
        bankName: paymentInfo?.bankName || "",
        accountNumber: "", // siempre vacío si enmascarado
        routingNumber: "",
        accountHolderName: paymentInfo?.accountHolderName || "",
        paypalEmail: paymentInfo?.paypalEmail || "",
        venmoUsername: paymentInfo?.venmoUsername || "",
        zelleEmail: paymentInfo?.zelleEmail || "",
        cashAppTag: paymentInfo?.cashAppTag || "",
        instructions: paymentInfo?.instructions || "",
      }),
    [paymentInfo]
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
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
      }),
    [
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
    ]
  );

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

  // Guardar
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

  const copy = async (text?: string | null) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard." });
  };

  // Preview render
  const previewLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Preferred method: ${preferredMethod.toUpperCase()}`);
    if (preferredMethod === "bank") {
      lines.push(`Bank: ${bankName || "—"}`);
      lines.push(`Account holder: ${accountHolderName || "—"}`);
      lines.push(`Routing: ${routingNumber || (paymentInfo?.routingNumber ? `•••• ${paymentInfo.routingNumber.slice(-4)}` : "—")}`);
      lines.push(`Account: ${
        showAccount
          ? accountNumber || paymentInfo?.accountNumber || "—"
          : accountNumber
          ? "•••• •••• •••• " + accountNumber.slice(-4)
          : paymentInfo?.accountNumber
          ? "•••• " + paymentInfo.accountNumber.slice(-4)
          : "—"
      }`);
    }
    if (preferredMethod === "paypal") lines.push(`PayPal: ${paypalEmail || "—"}`);
    if (preferredMethod === "venmo") lines.push(`Venmo: ${venmoUsername || "—"}`);
    if (preferredMethod === "zelle") lines.push(`Zelle: ${zelleEmail || "—"}`);
    if (preferredMethod === "cashapp") lines.push(`Cash App: ${cashAppTag || "—"}`);
    if (instructions?.trim()) lines.push("", `Instructions: ${instructions.trim()}`);
    return lines;
  }, [
    preferredMethod,
    bankName,
    accountHolderName,
    routingNumber,
    accountNumber,
    paypalEmail,
    venmoUsername,
    zelleEmail,
    cashAppTag,
    instructions,
    paymentInfo?.accountNumber,
    paymentInfo?.routingNumber,
    showAccount,
  ]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <DollarSign className="mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-muted-foreground mb-6">Please log in to access your captain dashboard</p>
            <Button asChild><a href="/login">Log In</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderCaptain />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-20">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments & Payouts</h1>
            <p className="text-sm text-muted-foreground">
              Configure how customers pay you and what they’ll see after you confirm a booking.
            </p>
          </div>

          <Badge
            variant={methodIsComplete ? "default" : "secondary"}
            className={`h-8 px-3 flex items-center gap-1 ${methodIsComplete ? "bg-emerald-600" : "bg-amber-500"}`}
            title={methodIsComplete ? "Ready to receive payments" : "Missing details"}
          >
            {methodIsComplete ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {methodIsComplete ? "Complete" : "Incomplete"}
          </Badge>
        </div>

        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Secure payment information</h3>
                <p className="text-sm text-blue-800">
                  Your payout details are stored and masked. Customers only see them after you approve a booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="method">Method</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* METHOD */}
          <TabsContent value="method" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Preferred method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={preferredMethod} onValueChange={(v) => setPreferredMethod(v as PaymentMethod)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MethodItem value="bank" title="Bank transfer" description="Local or international" />
                  <MethodItem value="paypal" title="PayPal" description="Email based" />
                  <MethodItem value="venmo" title="Venmo" description="@username" />
                  <MethodItem value="zelle" title="Zelle" description="Email or phone" />
                  <MethodItem value="cashapp" title="Cash App" description="$cashtag" />
                </RadioGroup>

                <AnimatePresence mode="wait">
                  {preferredMethod === "bank" && (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <Label htmlFor="bankName">Bank name</Label>
                        <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., Chase Bank" />
                      </div>
                      <div>
                        <Label htmlFor="accountHolderName">Account holder</Label>
                        <Input id="accountHolderName" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="Full legal name" />
                      </div>
                      <div>
                        <Label htmlFor="routingNumber">Routing number</Label>
                        <Input
                          id="routingNumber"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          placeholder={paymentInfo ? getMaskedPlaceholder(paymentInfo.routingNumber, "Routing number") : "9-digit routing"}
                          maxLength={9}
                          inputMode="numeric"
                        />
                        {paymentInfo && isMaskedValue(paymentInfo.routingNumber) && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Current number is hidden. Enter a new one to update.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account number</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accountNumber"
                            type="password"
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
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {!methodIsComplete && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Finish required fields above to mark your payout as complete.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Barra sticky de guardado para móvil */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
          >
            <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                <span>{saveMutation.isPending ? "Saving changes…" : "You have unsaved changes"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/captain/payment-info"] })}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MethodItem({
  value,
  title,
  description,
}: {
  value: PaymentMethod;
  title: string;
  description?: string;
}) {
  return (
    <Label
      htmlFor={value}
      className="cursor-pointer rounded-xl border bg-white p-4 flex gap-3 items-start hover:shadow-sm transition"
    >
      <RadioGroupItem id={value} value={value} className="mt-1" />
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
    </Label>
  );
}
