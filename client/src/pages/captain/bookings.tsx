
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import HeaderCaptain from "@/components/headercaptain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { fetchWithCsrf } from "@/lib/csrf";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Search,
  Ship,
  AlertTriangle,
  ChevronRight,
  Mail,
  Clock,
  Image,
  Check,
  X,
  Eye,
  CreditCard,
} from "lucide-react";

/* ====== Tipos derivados del backend /api/captain/bookings ====== */
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "pending" | "proof_submitted" | "verified" | "rejected";
type CaptainBooking = {
  id: number;
  userId: string;
  charterId: number;
  tripDate: string | null;
  guests: number;
  totalPrice: string;
  status: BookingStatus;
  message: string | null;
  createdAt: string | null;
  // Payment info
  paymentProofUrl: string | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: string | null;
  charter: {
    title: string;
    location: string;
    duration: string;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

const STATUS: Array<"all" | BookingStatus> = ["all", "pending", "confirmed", "completed", "cancelled"];

/* ===========================
   Página principal
=========================== */
export default function CaptainBookings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"all" | BookingStatus>("all");
  const [q, setQ] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, isError, error, refetch } = useQuery<CaptainBooking[]>({
    queryKey: ["/api/captain/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/captain/bookings", {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Mutations para approve/reject bookings
  const approveMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetchWithCsrf(`/api/captain/bookings/${bookingId}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain/bookings"] });
      toast({
        title: "Booking Approved",
        description: "The customer can now proceed with payment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetchWithCsrf(`/api/captain/bookings/${bookingId}/reject`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain/bookings"] });
      toast({
        title: "Booking Rejected",
        description: "The booking has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment proof mutations
  const approvePaymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetchWithCsrf(`/api/captain/bookings/${bookingId}/verify-payment`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain/bookings"] });
      toast({
        title: "Payment Approved",
        description: "Payment proof has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Approve payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment proof",
        variant: "destructive",
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetchWithCsrf(`/api/captain/bookings/${bookingId}/reject-payment`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain/bookings"] });
      toast({
        title: "Payment Rejected",
        description: "Payment proof has been rejected. Customer will be notified.",
      });
    },
    onError: (error: Error) => {
      console.error("Reject payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject payment proof",
        variant: "destructive",
      });
    },
  });

  // Early return for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={64} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-storm-gray mb-6">
              Please log in to access your captain dashboard
            </p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const all = bookings ?? [];

  // Filtro por estado (frontend)
  const byStatus = useMemo(() => {
    return status === "all" ? all : all.filter((booking) => booking.status === status);
  }, [status, all]);

  // Búsqueda por charter title
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return byStatus;
    return byStatus.filter((booking) =>
      [booking.charter.title, booking.user.firstName, booking.user.lastName, booking.user.email]
        .join(" ").toLowerCase().includes(text)
    );
  }, [byStatus, q]);

  // Agrupado por día de viaje
  const groups = useMemo(() => {
    const fmtKey = (iso: string | null) => {
      if (!iso) return "No date scheduled";
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    };

    const grouped = new Map<string, CaptainBooking[]>();
    filtered.forEach((booking) => {
      const key = fmtKey(booking.tripDate);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(booking);
    });

    return Array.from(grouped.entries()).map(([date, bookings]) => ({
      date,
      bookings: bookings.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    }));
  }, [filtered]);

  const money = (n: string | number) => {
    const num = typeof n === "string" ? parseFloat(n) : n;
    return new Intl.NumberFormat(undefined, { 
      style: "currency", 
      currency: "USD", 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const handleApproveBooking = (bookingId: number) => {
    approveMutation.mutate(bookingId);
  };

  const handleRejectBooking = (bookingId: number) => {
    rejectMutation.mutate(bookingId);
  };

  const handleApprovePayment = (bookingId: number) => {
    approvePaymentMutation.mutate(bookingId);
  };

  const handleRejectPayment = (bookingId: number) => {
    rejectPaymentMutation.mutate(bookingId);
  };

  const statusBadge = (s: BookingStatus) =>
    s === "confirmed" ? "default" : s === "pending" ? "secondary" : s === "completed" ? "outline" : "destructive";

  const counts = useMemo(() => ({
    all: all.length,
    pending: all.filter((booking) => booking.status === "pending").length,
    confirmed: all.filter((booking) => booking.status === "confirmed").length,
    completed: all.filter((booking) => booking.status === "completed").length,
    cancelled: all.filter((booking) => booking.status === "cancelled").length,
  }), [all]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <HeaderCaptain />

      {/* Barra sticky con filtros y KPIs rápidos */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Título + total */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Bookings</h2>
            <Badge variant="secondary">{counts.all} total</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray" size={18} />
              <Input
                placeholder="Search by charter or customer..."
                className="pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {/* Chips de estado */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {STATUS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
                className="capitalize whitespace-nowrap"
              >
                {s}
                <Badge variant="secondary" className="ml-2">
                  {counts[s as keyof typeof counts]}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado carga / error */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
              <h3 className="text-lg font-semibold mb-2">Error Loading Bookings</h3>
              <p className="text-storm-gray mb-4">{String(error)}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Ship className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
              <p className="text-storm-gray mb-6">
                {status === "all" 
                  ? "You don't have any bookings yet."
                  : `No bookings with status "${status}".`
                }
              </p>
              {status !== "all" && (
                <Button variant="outline" onClick={() => setStatus("all")}>
                  Show All Bookings
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Lista de bookings agrupados */
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.date}>
                <h3 className="text-lg font-semibold mb-4 text-storm-gray">
                  {group.date} ({group.bookings.length})
                </h3>
                
                <div className="grid gap-4">
                  {group.bookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Info del charter y customer */}
                          <div className="md:col-span-2">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg mb-1">{booking.charter.title}</h4>
                                <p className="text-sm text-storm-gray mb-2">{booking.charter.location}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-storm-gray">
                                  <span className="flex items-center gap-1">
                                    <Users size={16} />
                                    {booking.guests} guests
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={16} />
                                    {booking.charter.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign size={16} />
                                    {money(booking.totalPrice)}
                                  </span>
                                </div>
                              </div>
                              
                              <Badge variant={statusBadge(booking.status)} className="capitalize">
                                {booking.status}
                              </Badge>
                            </div>

                            {/* Customer info */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail size={16} className="text-storm-gray" />
                                <span className="font-medium">
                                  {booking.user.firstName && booking.user.lastName
                                    ? `${booking.user.firstName} ${booking.user.lastName}`
                                    : "Customer"
                                  }
                                </span>
                                <span className="text-sm text-storm-gray">({booking.user.email})</span>
                              </div>
                              
                              {booking.message && (
                                <p className="text-sm text-storm-gray italic">
                                  "{booking.message}"
                                </p>
                              )}
                            </div>

                            <div className="text-xs text-storm-gray">
                              Requested on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "Unknown date"}
                            </div>

                            {/* Payment Proof Section */}
                            {booking.status === "confirmed" && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CreditCard size={16} className="text-blue-600" />
                                  <span className="font-medium text-blue-800">Payment Status</span>
                                </div>
                                
                                {booking.paymentStatus === "proof_submitted" && booking.paymentProofUrl ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                        Payment Proof Submitted
                                      </Badge>
                                      {booking.paymentMethod && (
                                        <span className="text-sm text-blue-700">
                                          via {booking.paymentMethod}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Payment Screenshot:</span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(booking.paymentProofUrl!, '_blank')}
                                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                          <Eye size={14} className="mr-1" />
                                          View Full Size
                                        </Button>
                                      </div>
                                      <img 
                                        src={booking.paymentProofUrl}
                                        alt="Payment proof screenshot"
                                        className="w-full max-w-[200px] h-auto rounded border cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => window.open(booking.paymentProofUrl!, '_blank')}
                                      />
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        onClick={() => handleApprovePayment(booking.id)}
                                        disabled={approvePaymentMutation.isPending}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Check size={14} className="mr-1" />
                                        Approve Payment
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleRejectPayment(booking.id)}
                                        disabled={rejectPaymentMutation.isPending}
                                        size="sm"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <X size={14} className="mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                ) : booking.paymentStatus === "verified" ? (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                      Payment Verified ✅
                                    </Badge>
                                    {booking.paymentMethod && (
                                      <span className="text-sm text-blue-700">
                                        via {booking.paymentMethod}
                                      </span>
                                    )}
                                  </div>
                                ) : booking.paymentStatus === "rejected" ? (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-800 border-red-300">
                                      Payment Rejected ❌
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="text-sm text-blue-700">
                                    Waiting for customer to submit payment proof...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex flex-col gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  onClick={() => handleApproveBooking(booking.id)}
                                  disabled={approveMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✅ Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectBooking(booking.id)}
                                  disabled={rejectMutation.isPending}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  ❌ Reject
                                </Button>
                              </>
                            )}
                            
                            

                            {booking.status === "completed" && (
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-800">
                                  🎉 Completed
                                </p>
                              </div>
                            )}

                            {booking.status === "cancelled" && (
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">
                                  ❌ Cancelled
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
