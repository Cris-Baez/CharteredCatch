// src/pages/captain/earnings.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// Header unificado del panel de capitán
import HeaderCaptain from "@/components/headercaptain";

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  DollarSign,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Loader2,
  Wallet,
  AlertTriangle,
} from "lucide-react";

/* ========================
   Tipos de respuesta API
======================== */
type Tx = {
  id: number;
  charterTitle: string;
  guests: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  amount: number;
  dateISO: string;
};

type EarningsResponse = {
  period: "7days" | "30days" | "90days" | "year";
  nowISO: string;
  fromISO: string;
  totals: {
    totalEarnings: number;      // confirmed+completed
    completedEarnings: number;  // completed
    avgPerTrip: number;         // completedEarnings / completedTrips
    tripsCount: number;         // all in period
    completedTrips: number;
    pendingAmount: number;      // pending
    pendingTrips: number;
    changePct: number;          // vs periodo anterior
  };
  recentTransactions: Tx[];
};

/* ========================
   Utilidades
======================== */
const fmtUSD = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round((v + Number.EPSILON) * 100) / 100);

const statusTone = (s: Tx["status"]) => {
  switch (s) {
    case "completed":
      return "text-green-600";
    case "pending":
      return "text-amber-600";
    case "confirmed":
      return "text-sky-700";
    case "cancelled":
      return "text-gray-500";
    default:
      return "text-gray-700";
  }
};

/* ========================
   Página
======================== */
export default function CaptainEarnings() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<EarningsResponse["period"]>("30days");

  // Proteger ruta
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  const {
    data,
    isLoading: loadingData,
    isError,
    refetch,
  } = useQuery<EarningsResponse>({
    queryKey: ["/api/captain/earnings", period],
    queryFn: async () => {
      const r = await fetch(`/api/captain/earnings?period=${period}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to load earnings");
      return r.json();
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const totals = data?.totals;
  const rangeText = useMemo(() => {
    if (!data) return "";
    const from = new Date(data.fromISO);
    const to = new Date(data.nowISO);
    const fmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${fmt.format(from)} – ${fmt.format(to)}`;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header unificado del panel de capitán */}
      <HeaderCaptain />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Encabezado sección */}
        <div className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Earnings Dashboard
            </h1>
            <p className="text-storm-gray">
              Track your performance and payouts from bookings.
              {rangeText && <span className="ml-2 text-gray-500">({rangeText})</span>}
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="whitespace-nowrap"
              onClick={() =>
                window.open(`/api/captain/earnings/export?period=${period}`, "_blank")
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Loading / Error */}
        {loadingData ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Failed to load.{" "}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <KpiCard
                title="Total Earnings"
                value={fmtUSD(totals?.totalEarnings ?? 0)}
                hint={`${Math.round((totals?.changePct ?? 0) * 10) / 10}% vs prev.`}
                tone={(totals?.changePct ?? 0) >= 0 ? "pos" : "neg"}
                icon={<Wallet size={32} className="text-green-600" />}
              />
              <KpiCard
                title="Completed Earnings"
                value={fmtUSD(totals?.completedEarnings ?? 0)}
                hint={`${totals?.completedTrips ?? 0} completed trips`}
                icon={<CalendarIcon size={32} className="text-ocean-blue" />}
              />
              <KpiCard
                title="Average Per Trip"
                value={fmtUSD(totals?.avgPerTrip ?? 0)}
                hint={`${totals?.tripsCount ?? 0} trips in period`}
                icon={<TrendingUp size={32} className="text-purple-600" />}
              />
              <KpiCard
                title="Pending"
                value={fmtUSD(totals?.pendingAmount ?? 0)}
                hint={`${totals?.pendingTrips ?? 0} pending trips`}
                icon={<DollarSign size={32} className="text-orange-500" />}
              />
            </section>

            {/* Transacciones recientes */}
            <section>
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.recentTransactions?.length ? (
                    <div className="space-y-3">
                      {data.recentTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 border rounded-xl bg-white hover:shadow-sm transition"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {tx.charterTitle || "Charter"}
                            </p>
                            <p className="text-sm text-storm-gray">
                              {new Date(tx.dateISO).toLocaleDateString()} • {tx.guests}{" "}
                              passengers
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${statusTone(tx.status)}`}>
                              {tx.status === "completed" ? "+" : ""}
                              {fmtUSD(tx.amount)}
                            </p>
                            <p className="text-xs text-storm-gray capitalize">
                              {tx.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyList />
                  )}
                </CardContent>
              </Card>
            </section>

            {/* CTA secundaria */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/captain/analytics">View full analytics</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/captain/bookings">Go to bookings</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ========================
   Subcomponentes
======================== */
function KpiCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  /** pos | neg para colorear el hint */
  tone?: "pos" | "neg";
}) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition">
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-storm-gray">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {hint && (
              <p
                className={[
                  "text-sm",
                  tone === "pos"
                    ? "text-green-600"
                    : tone === "neg"
                    ? "text-red-600"
                    : "text-storm-gray",
                ].join(" ")}
              >
                {hint}
              </p>
            )}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyList() {
  return (
    <div className="text-center py-10">
      <div className="text-3xl mb-2">💳</div>
      <p className="font-medium">No transactions in this period.</p>
      <p className="text-sm text-storm-gray">
        When you get bookings and complete trips, they’ll appear here.
      </p>
    </div>
  );
}
