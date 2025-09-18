// src/pages/user/checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithCsrf } from "@/lib/csrf";

import {
  Banknote,
  CreditCard,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import type { CharterWithCaptain } from "@shared/schema";

/* ===========================
   Tipos mínimos (reales)
=========================== */
type Me = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type Booking = {
  id: number | string;
  userId: string;
  charterId: number;
  tripDate: string; // ISO
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  message?: string | null;
  charter?: CharterWithCaptain; // el backend ya lo manda embebido en /api/bookings/:id
};

type PaymentOptions = {
  bank?: {
    currency?: string;             // p.ej. "USD"
    bankName?: string;
    accountName?: string;
    accountNumber?: string;        // mostramos tal cual nos lo den (MVP simple)
    routingNumber?: string;
    iban?: string;
    swift?: string;
    instructions?: string;
    qrImageUrl?: string;
  };
  externalLink?: {
    provider?: string;             // "Stripe" | "PayPal" | "Custom" (si el capitán lo puso)
    url: string;
    note?: string;
  };
};

/* ===========================
   Helpers
=========================== */
function useQueryParams() {
  const [loc] = useLocation();
  const search =
    typeof window !== "undefined" && window.location ? window.location.search : "";
  return useMemo(() => new URLSearchParams(search), [loc, search]);
}

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)} ${currency}`;
  }
}

function CopyLine({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="font-medium text-gray-900 break-all">{value}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast({ title: "Copied to clipboard" });
            setTimeout(() => setCopied(false), 1200);
          } catch {
            toast({
              title: "Copy failed",
              description: "Your browser blocked clipboard access.",
              variant: "destructive",
            });
          }
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function LabeledRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

/* ===========================
   Página (MVP simple)
=========================== */
export default function UserCheckout() {
  const params = useQueryParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const bookingId = params.get("bookingId") || "";
  const charterIdParam = params.get("charterId") || "";

  // Guard: requerimos booking o charter; si no hay nada, volvemos
  useEffect(() => {
    if (!bookingId && !charterIdParam) {
      setLocation("/user/home");
    }
  }, [bookingId, charterIdParam, setLocation]);

  /* Auth */
  const {
    data: me,
    isLoading: loadingMe,
    isError: authError,
  } = useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/auth/user", { credentials: "include" });
      if (!r.ok) throw new Error("unauthorized");
      return r.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (authError) setLocation("/login");
  }, [authError, setLocation]);

  /* Booking si viene bookingId (preferido) */
  const {
    data: booking,
    isLoading: loadingBooking,
    isError: bookingError,
  } = useQuery<Booking>({
    queryKey: ["booking", String(bookingId || "")],
    queryFn: async () => {
      const r = await fetch(`/api/bookings/${bookingId}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch booking");
      return r.json();
    },
    enabled: Boolean(bookingId) && !authError,
  });

  /* Charter fallback si no hay bookingId */
  const {
    data: charterFallback,
    isLoading: loadingCharter,
    isError: charterError,
  } = useQuery<CharterWithCaptain>({
    queryKey: ["charter", String(charterIdParam || "")],
    queryFn: async () => {
      const r = await fetch(`/api/charters/${charterIdParam}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch charter");
      return r.json();
    },
    enabled: !bookingId && Boolean(charterIdParam) && !authError,
  });

  const charter = booking?.charter || charterFallback || null;

  /* Opciones de pago simples del capitán.
     MVP: solo leemos y mostramos. Nada de intents/polls. */
  const {
    data: paymentOptions,
    isLoading: loadingOptions,
  } = useQuery<PaymentOptions>({
    queryKey: ["payment-options", charter?.id ?? "no-charter"],
    queryFn: async () => {
      if (!charter?.id) return {};
      // Endpoint sencillo que ya usaste antes:
      const r = await fetch(
        `/api/payments/options?charterId=${encodeURIComponent(String(charter.id))}`,
        { credentials: "include" }
      );
      if (!r.ok) return {};
      return r.json();
    },
    enabled: Boolean(charter?.id),
    staleTime: 5 * 60 * 1000,
  });

  /* Derivados */
  const showLoader =
    loadingMe || (bookingId ? loadingBooking : loadingCharter) || loadingOptions;

  const hasError =
    authError ||
    (bookingId ? bookingError : charterError) ||
    (!bookingId && !charter && !loadingCharter);

  const cover =
    charter?.images?.[0] ||
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop";

  const price = Number(booking?.totalPrice) || Number(charter?.price) || 0;
  const currency = paymentOptions?.bank?.currency || "USD";

  const dateStrISO =
    booking?.tripDate || "";
  const guestsStr = String((booking?.guests ?? "") || ""); // ← sin mezclar ?? con || (ya entre paréntesis)

  const isAlreadyConfirmed =
    booking?.status === "confirmed" || booking?.status === "completed";

  /* Acciones simples (MVP) */

  // 1) Abrir link externo del capitán si lo hay (sin intents/polls)
  const openExternalLink = () => {
    const url = paymentOptions?.externalLink?.url || "";
    if (!url) {
      toast({
        title: "Payment link unavailable",
        description: "Ask the captain for a payment link or use bank transfer.",
        variant: "destructive",
      });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 2) Avisar al capitán que ya envió la transferencia (solo mensaje)
  const notifyCaptainTransferSent = async () => {
    if (!booking || !charter?.captain?.userId || !me?.id) {
      toast({
        title: "Cannot send message",
        description: "Missing booking or captain data.",
        variant: "destructive",
      });
      return;
    }
    try {
      const content = `Hi Captain, I’ve sent the transfer for booking #${booking.id} (${formatMoney(
        price,
        currency
      )}). Please verify when you receive it. Thank you!`;
      const r = await fetchWithCsrf("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          senderId: me.id,
          receiverId: charter.captain.userId,
          charterId: charter.id,
          content,
        }),
      });
      if (!r.ok) throw new Error("Failed to send message");
      toast({ title: "Message sent" });
      // Llevar al inbox con el capitán
      setLocation(`/user/messages?to=${encodeURIComponent(charter.captain.userId)}`);
    } catch (e: any) {
      toast({
        title: "Failed to send",
        description: String(e?.message || e),
        variant: "destructive",
      });
    }
  };

  const messageCaptain = async () => {
    if (!charter?.captain?.userId || !me?.id) {
      setLocation("/user/messages");
      return;
    }
    try {
      const r = await fetchWithCsrf("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          senderId: me.id,
          receiverId: charter.captain.userId,
          charterId: charter.id,
          content: `Hi Captain, I have a question about payment for "${charter.title}".`,
        }),
      });
      if (!r.ok) throw new Error("Failed to start conversation");
      setLocation(`/user/messages?to=${encodeURIComponent(charter.captain.userId)}`);
    } catch {
      setLocation("/user/messages");
    }
  };

  /* Renders */
  if (showLoader) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderUser />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (hasError || !charter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderUser />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-3">
          <p className="text-red-600 font-medium">Could not load checkout.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderUser />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
            <p className="text-gray-600 text-sm flex flex-wrap items-center gap-2">
              Pay the captain directly (simple MVP).
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-600" /> No funds held by platform
              </span>
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation(`/charters/${charter.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to charter
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Payment methods (solo lectura + acciones simples) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bank transfer */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Banknote className="w-5 h-5 text-ocean-blue" />
                  Bank Transfer to Captain
                  <Badge className="ml-2 bg-gray-800 text-white">
                    {paymentOptions?.bank?.currency || currency}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentOptions?.bank ? (
                  <>
                    <div className="rounded-xl border p-3">
                      <CopyLine label="Account holder" value={paymentOptions.bank.accountName} />
                      <Separator />
                      {paymentOptions.bank.bankName && (
                        <CopyLine label="Bank" value={paymentOptions.bank.bankName} />
                      )}
                      {paymentOptions.bank.accountNumber && (
                        <CopyLine label="Account number" value={paymentOptions.bank.accountNumber} />
                      )}
                      {paymentOptions.bank.routingNumber && (
                        <CopyLine label="Routing" value={paymentOptions.bank.routingNumber} />
                      )}
                      {paymentOptions.bank.iban && (
                        <CopyLine label="IBAN" value={paymentOptions.bank.iban} />
                      )}
                      {paymentOptions.bank.swift && (
                        <CopyLine label="SWIFT" value={paymentOptions.bank.swift} />
                      )}
                    </div>

                    {paymentOptions.bank.instructions && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                        {paymentOptions.bank.instructions}
                      </div>
                    )}

                    {paymentOptions.bank.qrImageUrl && (
                      <div className="rounded-lg border p-2 grid place-items-center">
                        <img
                          src={paymentOptions.bank.qrImageUrl}
                          alt="Payment QR"
                          className="h-40 w-auto object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="bg-ocean-blue hover:bg-blue-800 text-white"
                        type="button"
                        onClick={notifyCaptainTransferSent}
                        disabled={!booking}
                        title={!booking ? "Create a booking first" : undefined}
                      >
                        I’ve sent the transfer
                      </Button>

                      <Button variant="outline" type="button" onClick={messageCaptain}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message Captain
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      The captain hasn’t added bank details yet. You can ask for them or use a payment link if available.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" type="button" onClick={messageCaptain}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Ask for bank details
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External link (opcional) */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-5 h-5 text-ocean-blue" />
                  Pay via Captain’s Payment Link
                  {paymentOptions?.externalLink?.provider && (
                    <Badge variant="secondary" className="ml-2">
                      {paymentOptions.externalLink.provider}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentOptions?.externalLink?.url ? (
                  <>
                    {paymentOptions.externalLink.note && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                        {paymentOptions.externalLink.note}
                      </div>
                    )}
                    <Button
                      className="bg-ocean-blue hover:bg-blue-800 text-white"
                      type="button"
                      onClick={openExternalLink}
                    >
                      Open Payment Page
                    </Button>
                    <p className="text-xs text-gray-500">
                      Complete your payment in the new tab. The captain will confirm your booking when they receive it.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    No payment link available. Use bank transfer or message the captain.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Nota MVP */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Safety & Refunds (MVP)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>
                  For the MVP, payments go directly to the captain’s account. The platform does not hold customer money.
                </p>
                <p>
                  For refunds or disputes, please coordinate directly with your captain. We’ll explore Stripe Connect / delayed payouts later.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={cover}
                    alt={charter.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </div>

                <div>
                  <div className="font-semibold text-gray-900 line-clamp-2">
                    {charter.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Capt. {charter.captain?.name || "—"}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {dateStrISO && (
                    <LabeledRow
                      label="Date"
                      value={new Date(dateStrISO).toLocaleDateString()}
                    />
                  )}
                  {guestsStr && <LabeledRow label="Guests" value={guestsStr} />}
                  <LabeledRow label="Location" value={charter.location} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <LabeledRow label="Trip price" value={formatMoney(price, currency)} />
                  <LabeledRow label="Platform fee" value={formatMoney(0, currency)} />
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-gray-900">
                      {formatMoney(price, currency)}
                    </span>
                  </div>
                </div>

                {isAlreadyConfirmed && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                    Payment confirmed — your trip is booked. 🎉
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  By proceeding, you agree to the charter’s cancellation policy.
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    Need changes? Message the captain from your{" "}
                    <button
                      className="underline"
                      type="button"
                      onClick={messageCaptain}
                    >
                      inbox
                    </button>
                    .
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>Meeting point is shared by the captain after confirmation.</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Remember to include kids in your guest count.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
