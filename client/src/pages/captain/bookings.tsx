import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import HeaderCaptain from "@/components/headercaptain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
} from "lucide-react";

/* ====== Tipos derivados del backend /api/captain/earnings ====== */
type TxStatus = "pending" | "confirmed" | "completed" | "cancelled";
type RecentTx = {
  id: number;               // booking id
  charterTitle: string;
  guests: number;
  status: TxStatus;
  amount: number;
  dateISO: string;
};

type EarningsResp = {
  period: "7days" | "30days" | "90days" | "year";
  nowISO: string;
  fromISO: string;
  totals: {
    totalEarnings: number;
    completedEarnings: number;
    avgPerTrip: number;
    tripsCount: number;
    completedTrips: number;
    pendingAmount: number;
    pendingTrips: number;
    changePct: number;
  };
  recentTransactions: RecentTx[];
};

const PERIODS = [
  { key: "7days", label: "Last 7 days" },
  { key: "30days", label: "Last 30 days" },
  { key: "90days", label: "Last 90 days" },
  { key: "year", label: "Year to date" },
] as const;

const STATUS: Array<"all" | TxStatus> = ["all", "pending", "confirmed", "completed", "cancelled"];

/* ===========================
   Página (solo frontend)
=========================== */
export default function CaptainBookings() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7days" | "30days" | "90days" | "year">("30days");
  const [status, setStatus] = useState<"all" | TxStatus>("all");
  const [q, setQ] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<EarningsResp>({
    queryKey: ["/api/captain/earnings", period],
    queryFn: async () => {
      const res = await fetch(`/api/captain/earnings?period=${period}`, {
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

  const all = data?.recentTransactions ?? [];

  // Filtro por estado (frontend)
  const byStatus = status === "all" ? all : all.filter((t) => t.status === status);

  // Búsqueda por charterTitle
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return byStatus;
    return byStatus.filter((t) =>
      [t.charterTitle].join(" ").toLowerCase().includes(text)
    );
  }, [byStatus, q]);

  // Agrupado por día bonito
  const groups = useMemo(() => {
    const fmtKey = (iso: string) =>
      new Date(iso).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    const map = new Map<string, RecentTx[]>();
    for (const tx of filtered) {
      const key = fmtKey(tx.dateISO);
      const arr = map.get(key) || [];
      arr.push(tx);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [filtered]);

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // Mutations para approve/reject bookings
  const approveMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetch(`/api/captain/bookings/${bookingId}/approve`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/captain/earnings"] });
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
      const res = await fetch(`/api/captain/bookings/${bookingId}/reject`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/captain/earnings"] });
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

  const handleApproveBooking = (bookingId: number) => {
    approveMutation.mutate(bookingId);
  };

  const handleRejectBooking = (bookingId: number) => {
    rejectMutation.mutate(bookingId);
  };

  const statusBadge = (s: TxStatus) =>
    s === "confirmed" ? "default" : s === "pending" ? "secondary" : s === "completed" ? "outline" : "destructive";

  const counts = {
    all: all.length,
    pending: all.filter((t) => t.status === "pending").length,
    confirmed: all.filter((t) => t.status === "confirmed").length,
    completed: all.filter((t) => t.status === "completed").length,
    cancelled: all.filter((t) => t.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <HeaderCaptain />

      {/* Barra sticky con filtros y KPIs rápidos */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Título + periodo */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Bookings</h2>
            <Badge variant="secondary">{counts.all} total</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray" size={18} />
              <Input
                placeholder="Search by charter title…"
                className="pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chips de estado */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {STATUS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
                className="capitalize"
              >
                {s}
                <Badge variant="secondary" className="ml-2">
                  {counts[s]}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* estado carga / error */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Failed to load bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-red-700 break-all">{(error as Error)?.message}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length > 0 ? (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.key}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600">{g.key}</h3>
                  <div className="h-0.5 bg-gradient-to-r from-gray-200 to-transparent flex-1 ml-4 rounded" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {g.items.map((b: RecentTx) => (
                    <Card key={b.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-lg truncate">
                                {b.charterTitle || "Charter"}
                              </h4>
                              <Badge variant={statusBadge(b.status)} className="capitalize">
                                {b.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-storm-gray">
                              <div className="flex items-center min-w-0">
                                <CalendarIcon className="w-4 h-4 mr-2 shrink-0" />
                                <span className="truncate">
                                  {new Date(b.dateISO).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center min-w-0">
                                <Users className="w-4 h-4 mr-2 shrink-0" />
                                <span className="truncate">{b.guests} passengers</span>
                              </div>
                              <div className="flex items-center font-semibold text-ocean-blue min-w-0">
                                <DollarSign className="w-4 h-4 mr-2 shrink-0" />
                                <span className="truncate">{money(b.amount)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 sm:gap-4">
                            {b.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
                                  onClick={() => handleApproveBooking(b.id)}
                                  data-testid={`button-approve-${b.id}`}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="min-w-[70px]"
                                  onClick={() => handleRejectBooking(b.id)}
                                  data-testid={`button-reject-${b.id}`}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" className="min-w-[70px]" asChild>
                              <Link href={`/booking/${b.id}`}>
                                <span className="inline-flex items-center">
                                  Details
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </span>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Card className="text-center py-14">
            <CardContent>
              <CalendarIcon className="mx-auto mb-4 text-storm-gray" size={72} />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-storm-gray mb-6">
                New reservations will appear here as soon as guests book your charters.
              </p>
              <Button asChild>
                <Link href="/captain/charters">View My Charters</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary cards (basados en /earnings.totals) */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-storm-gray">Trips</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-2xl font-bold">{data.totals.tripsCount}</div>
                <p className="text-xs text-storm-gray mt-1">
                  Completed: {data.totals.completedTrips}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-storm-gray">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-2xl font-bold">{money(data.totals.totalEarnings)}</div>
                <p className="text-xs text-storm-gray mt-1">
                  Completed: {money(data.totals.completedEarnings)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-storm-gray">Avg per Trip</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-2xl font-bold">{money(data.totals.avgPerTrip)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-storm-gray">Change vs prev</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div
                  className={
                    "text-2xl font-bold " +
                    (data.totals.changePct >= 0 ? "text-green-600" : "text-red-600")
                  }
                >
                  {data.totals.changePct >= 0 ? "+" : ""}
                  {Math.round(data.totals.changePct)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
