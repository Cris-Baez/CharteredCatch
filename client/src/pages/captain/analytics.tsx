import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

import HeaderCaptain from "@/components/headercaptain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar as CalendarIcon,
  Star,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";

/* ========= Tipos basados en tu endpoint de earnings ========= */
type Tx = {
  id: number | string;
  charterTitle?: string;
  guests?: number;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  amount?: number;
  dateISO?: string; // ISO
};

type EarningsResponse = {
  period: "7days" | "30days" | "90days" | "year";
  nowISO?: string;
  fromISO?: string;
  totals?: {
    totalEarnings?: number;     // confirmed + completed
    completedEarnings?: number; // completed
    avgPerTrip?: number;
    tripsCount?: number;        // all in period
    completedTrips?: number;
    pendingAmount?: number;
    pendingTrips?: number;
    changePct?: number;         // vs periodo anterior
  };
  recentTransactions?: Tx[];
};

type CaptainRow = {
  id: number;
  userId: string;
  rating?: number | null;
  reviewCount?: number | null;
};

/* ========= Utils ========= */
const fmtMoney = (v?: number, currency = "USD") => {
  if (typeof v !== "number") return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `$${v.toFixed(0)}`;
  }
};

const growthPct = (curr?: number, prev?: number): number | null => {
  if (typeof curr !== "number" || typeof prev !== "number") return null;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

const monthKey = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
};

const monthLabel = (key: string) => {
  // key: "YYYY-MM"
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
};

/* ========= Página ========= */
export default function CaptainAnalytics() {
  const { user, isAuthenticated, isLoading: loadingAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"7days" | "30days" | "90days" | "year">("30days");

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) setLocation("/login");
  }, [loadingAuth, isAuthenticated, setLocation]);

  // Earnings (reales)
  const {
    data: earnings,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery<EarningsResponse>({
    queryKey: ["/api/captain/earnings", period],
    queryFn: async () => {
      const r = await fetch(`/api/captain/earnings?period=${period}`, { credentials: "include" });
      if (!r.ok) {
        const msg = await r.text().catch(() => "");
        const e = new Error(msg || "Failed to load earnings");
        (e as any).status = r.status;
        throw e;
      }
      return r.json();
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    if ((error as any)?.status === 401) setLocation("/login");
  }, [error, setLocation]);

  // Mi ficha de capitán (para rating real)
  const { data: myCaptain } = useQuery({
    enabled: !!user?.id,
    queryKey: ["captain", user?.id],
    queryFn: async (): Promise<CaptainRow | null> => {
      const r = await fetch("/api/captains", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load captain");
      const list: CaptainRow[] = await r.json();
      return list.find((c) => c.userId === user!.id) ?? null;
    },
    staleTime: 60_000,
  });

  /* ===== Derivados desde datos reales ===== */
  const currency = "USD"; // en MVP tus endpoints no devuelven currency; fija USD

  const totalEarnings = earnings?.totals?.totalEarnings;
  const completedEarnings = earnings?.totals?.completedEarnings;
  const tripsCount = earnings?.totals?.tripsCount;
  const completedTrips = earnings?.totals?.completedTrips;
  const pendingAmount = earnings?.totals?.pendingAmount;
  const pendingTrips = earnings?.totals?.pendingTrips;
  const changePctTotal = earnings?.totals?.changePct;

  // "This month vs last month": aproximamos con changePct si el backend lo entrega.
  // Para Bookings usamos tripsCount como "this period".
  const bookingsNow = typeof tripsCount === "number" ? tripsCount : undefined;
  const bookingsPrev = typeof changePctTotal === "number" && typeof tripsCount === "number"
    ? Math.round(tripsCount / (1 + changePctTotal / 100))
    : undefined;
  const bookingsGrowth = growthPct(bookingsNow, bookingsPrev);

  const ratingAvg = typeof myCaptain?.rating === "number" ? myCaptain.rating : undefined;
  const reviewCount = typeof myCaptain?.reviewCount === "number" ? myCaptain.reviewCount : undefined;

  // Construimos tendencia mensual y top charters a partir de recentTransactions reales
  const grouped = useMemo(() => {
    const txs = earnings?.recentTransactions || [];
    const byMonth = new Map<string, { revenue: number; bookings: number }>();
    const byCharter = new Map<string, { revenue: number; bookings: number }>();

    for (const tx of txs) {
      const okForRevenue = tx.status === "completed" || tx.status === "confirmed";
      const k = monthKey(tx.dateISO);
      const monthRec = byMonth.get(k) || { revenue: 0, bookings: 0 };
      if (okForRevenue && typeof tx.amount === "number") monthRec.revenue += tx.amount;
      monthRec.bookings += 1; // contamos toda transacción como intento/booking del periodo
      byMonth.set(k, monthRec);

      const cn = tx.charterTitle || "Charter";
      const chRec = byCharter.get(cn) || { revenue: 0, bookings: 0 };
      if (okForRevenue && typeof tx.amount === "number") chRec.revenue += tx.amount;
      chRec.bookings += 1;
      byCharter.set(cn, chRec);
    }

    // Orden cronológico por clave YYYY-MM
    const months = Array.from(byMonth.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const topCharters = Array.from(byCharter.entries())
      .sort((a, b) => (b[1].revenue - a[1].revenue))
      .slice(0, 6);

    const maxRevenue = months.reduce((m, [, v]) => Math.max(m, v.revenue), 0);

    return {
      months,          // [ [ '2025-01', { revenue, bookings } ], ... ]
      topCharters,     // [ [ 'Deep Sea', { revenue, bookings } ], ... ]
      maxRevenue,
    };
  }, [earnings?.recentTransactions]);

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-seafoam-50">
      <HeaderCaptain />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-storm-gray">Track your performance and grow your charter business.</p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as "7days" | "30days" | "90days" | "year")}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>

            <Button variant="outline" asChild>
              <Link href="/captain/overview">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading / error */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : isError ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-red-600">
            Failed to load analytics.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard
                label="Total Earnings"
                value={fmtMoney(totalEarnings, currency)}
                growth={typeof changePctTotal === "number" ? changePctTotal : null}
                icon={<DollarSign className="text-green-600" size={28} />}
              />
              <KpiCard
                label="Completed Earnings"
                value={fmtMoney(completedEarnings, currency)}
                sub={`${typeof completedTrips === "number" ? completedTrips : "—"} completed trips`}
                icon={<CalendarIcon className="text-ocean-blue" size={28} />}
              />
              <KpiCard
                label="Total Bookings"
                value={typeof bookingsNow === "number" ? String(bookingsNow) : "—"}
                growth={bookingsGrowth}
                icon={<CalendarIcon className="text-purple-600" size={28} />}
              />
              <KpiCard
                label="Average Rating"
                value={typeof ratingAvg === "number" ? ratingAvg.toFixed(1) : "—"}
                sub={typeof reviewCount === "number" ? `${reviewCount} reviews` : undefined}
                icon={<Star className="text-yellow-500" size={28} />}
              />
            </div>

            {/* Trend + Top Charters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Trend (agrupado por mes real) */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {grouped.months.length ? (
                    <div className="space-y-4">
                      {grouped.months.map(([key, val]) => {
                        const width = grouped.maxRevenue > 0
                          ? Math.round((val.revenue / grouped.maxRevenue) * 100)
                          : 0;
                        return (
                          <div key={key} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <span className="text-sm font-medium w-12 shrink-0">{monthLabel(key)}</span>
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-ocean-blue h-2 rounded-full" style={{ width: `${width}%` }} />
                                </div>
                              </div>
                            </div>
                            <span className="text-sm font-medium shrink-0">{fmtMoney(val.revenue, currency)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-storm-gray">No transactions in this period.</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing Charters */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Top Performing Charters</CardTitle>
                </CardHeader>
                <CardContent>
                  {grouped.topCharters.length ? (
                    <div className="space-y-3">
                      {grouped.topCharters.map(([name, val], i) => (
                        <div
                          key={`${name}-${i}`}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{name}</p>
                            <p className="text-sm text-storm-gray">
                              {val.bookings} bookings
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{fmtMoney(val.revenue, currency)}</p>
                            <p className="text-xs text-green-600">Revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-storm-gray">No charter performance data.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending box si aplica */}
            {typeof pendingAmount === "number" && pendingAmount > 0 && (
              <Card className="mt-8 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div>
                      <p className="font-semibold">{fmtMoney(pendingAmount, currency)}</p>
                      <p className="text-sm text-storm-gray">
                        {typeof pendingTrips === "number" ? `${pendingTrips} trips awaiting confirmation` : "Awaiting confirmation"}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/captain/bookings">Review bookings</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips (copy sin números inventados) */}
            <Card className="mt-8 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Performance Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <TipItem title="Keep availability updated" desc="Up-to-date calendars avoid rejections and increase conversions." />
                  <TipItem title="Photos & details matter" desc="Sharp images and clear descriptions increase interest." />
                  <TipItem title="Encourage reviews" desc="A short follow-up after each trip improves your sustained rating." />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

/* ========= Subcomponentes ========= */
function KpiCard({
  label,
  value,
  growth,
  sub,
  icon,
}: {
  label: string;
  value: string;
  growth?: number | null;
  sub?: string;
  icon: React.ReactNode;
}) {
  const positive = typeof growth === "number" && growth >= 0;
  const negative = typeof growth === "number" && growth < 0;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-storm-gray">{label}</p>
            <p className="text-3xl font-bold truncate">{value}</p>
            {typeof growth === "number" ? (
              <p className={["text-sm mt-1", positive ? "text-green-600" : "", negative ? "text-red-600" : ""].join(" ")}>
                {positive && <TrendingUp className="w-4 h-4 inline mr-1" />}
                {negative && <TrendingDown className="w-4 h-4 inline mr-1" />}
                {growth >= 0 ? "+" : ""}
                {Math.round(growth * 10) / 10}% vs prev.
              </p>
            ) : sub ? (
              <p className="text-sm text-storm-gray mt-1">{sub}</p>
            ) : (
              <p className="text-sm text-storm-gray mt-1">—</p>
            )}
          </div>
          <div className="shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TipItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-storm-gray">{desc}</p>
    </div>
  );
}
