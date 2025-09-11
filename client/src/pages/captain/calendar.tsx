import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HeaderCaptain from "@/components/headercaptain";

import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  Calendar as CalendarIcon,
  Clock,
  Ship,
  Plus,
  Trash2,
  Pencil,
  Download,
} from "lucide-react";

// ====== Tipos locales ======
type AvailabilityItem = {
  id: number;
  charterId: number;
  date: string;         // ISO
  slots: number;
  bookedSlots: number;
};

type CharterLite = {
  id: number;
  title: string;
  location?: string | null;
  duration?: string | null;
  maxGuests?: number | null;
  price?: number | null;
  images?: string[] | null;
  isListed?: boolean;
};

// =======================
// Página: Calendar
// =======================
export default function CaptainCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charter seleccionado
  const [selectedCharterId, setSelectedCharterId] = useState<number | null>(null);

  // Mes visible en el calendario (para pedir disponibilidad por mes)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());

  // Día seleccionado (para ver detalle y añadir disponibilidad)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Dialogos / estados locales
  const [isAdding, setIsAdding] = useState(false);
  const [newSlots, setNewSlots] = useState<number>(1);
  const [editRow, setEditRow] = useState<AvailabilityItem | null>(null);
  const [editSlots, setEditSlots] = useState<number>(1);

  // 1) Traer charters del capitán
  const { data: myCharters, isLoading: loadingCharters } = useQuery<CharterLite[]>({
    queryKey: ["/api/captain/charters"],
    enabled: !!user,
  });

  // set default charter
  useEffect(() => {
    if (myCharters && myCharters.length > 0 && selectedCharterId == null) {
      setSelectedCharterId(myCharters[0].id);
    }
  }, [myCharters, selectedCharterId]);

  // 2) Traer availability del charter seleccionado para el mes visible
  const monthKey = useMemo(() => {
    const y = visibleMonth.getUTCFullYear();
    const m = String(visibleMonth.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [visibleMonth]);

  const { data: availability, isLoading: loadingAvailability } = useQuery<AvailabilityItem[]>({
    queryKey: ["/api/availability", selectedCharterId, monthKey],
    queryFn: async () => {
      if (!selectedCharterId) return [];
      const res = await fetch(`/api/availability?charterId=${selectedCharterId}&month=${monthKey}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!selectedCharterId,
  });

  // Helpers
  const dayKey = (d: Date) => d.toISOString().split("T")[0];

  const availabilityByDay = useMemo(() => {
    const map: Record<string, AvailabilityItem[]> = {};
    (availability || []).forEach((a) => {
      const key = a.date.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [availability]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return [];
    return availabilityByDay[dayKey(selectedDate)] || [];
  }, [selectedDate, availabilityByDay]);

  // 3) Mutations: add, update, delete
  const addMutation = useMutation({
    mutationFn: async (payload: { charterId: number; date: string; slots: number }) => {
      // URL primero, método después
      return apiRequest("/api/availability", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", selectedCharterId, monthKey] });
      setIsAdding(false);
      setNewSlots(1);
      toast({ title: "Availability added", description: "Your availability has been saved." });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to add availability",
        variant: "destructive",
      });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (payload: { id: number; slots: number }) => {
      return apiRequest(`/api/availability/${payload.id}`, "PATCH", { slots: payload.slots });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", selectedCharterId, monthKey] });
      setEditRow(null);
      toast({ title: "Availability updated", description: "Slots updated successfully." });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message || "Failed to update availability", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/availability/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", selectedCharterId, monthKey] });
      toast({ title: "Removed", description: "Availability deleted." });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message || "Failed to delete availability", variant: "destructive" }),
  });

  // 4) Derivadas para métricas
  const metrics = useMemo(() => {
    if (!availability) {
      return { daysWithAvailability: 0, fullyBookedDays: 0, remainingSlots: 0 };
    }
    const byDate: Record<string, { slots: number; booked: number }> = {};
    availability.forEach((a) => {
      const k = a.date.split("T")[0];
      if (!byDate[k]) byDate[k] = { slots: 0, booked: 0 };
      byDate[k].slots += a.slots;
      byDate[k].booked += a.bookedSlots;
    });

    let daysWithAvailability = 0;
    let fullyBookedDays = 0;
    let remainingSlots = 0;

    Object.values(byDate).forEach((day) => {
      if (day.slots > 0) {
        daysWithAvailability++;
        if (day.slots === day.booked) fullyBookedDays++;
        if (day.slots > day.booked) remainingSlots += (day.slots - day.booked);
      }
    });

    return { daysWithAvailability, fullyBookedDays, remainingSlots };
  }, [availability]);

  // 5) UI handlers
  const handleAdd = () => {
    if (!selectedDate || !selectedCharterId) return;
    addMutation.mutate({
      charterId: selectedCharterId,
      date: dayKey(selectedDate),
      slots: Math.max(1, newSlots),
    });
  };

  const startEdit = (row: AvailabilityItem) => {
    setEditRow(row);
    setEditSlots(row.slots);
  };

  const confirmDelete = (row: AvailabilityItem) => {
    deleteMutation.mutate(row.id);
  };

  // 6) Render
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Ship className="mx-auto mb-4 text-ocean-blue" size={48} />
            <h2 className="text-2xl font-bold mb-4">Captain Portal</h2>
            <p className="text-storm-gray mb-6">Please log in to access your captain dashboard</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderCaptain />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Encabezado / acciones */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Availability</h1>
            <p className="text-storm-gray">Keep your calendar up to date so guests can book you.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Charter selector */}
            <div className="min-w-[220px]">
              <Select
                value={selectedCharterId ? String(selectedCharterId) : undefined}
                onValueChange={(val) => setSelectedCharterId(Number(val))}
                disabled={loadingCharters || !myCharters || myCharters.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCharters ? "Loading charters..." : "Select a charter"} />
                </SelectTrigger>
                <SelectContent>
                  {(myCharters || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.title || `Charter #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export earnings (atajo) */}
            <Button variant="outline" asChild title="Export your earnings report (financial)">
              <a href="/api/captain/earnings/export?period=30days" target="_blank" rel="noreferrer">
                <Download className="w-4 h-4 mr-2" /> Export (earnings)
              </a>
            </Button>

            {/* Add availability */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button disabled={!selectedCharterId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Availability
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Availability</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      defaultValue={selectedDate ? dayKey(selectedDate) : undefined}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) setSelectedDate(new Date(`${v}T00:00:00Z`));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slots">Available Slots</Label>
                    <Input
                      id="slots"
                      type="number"
                      min={1}
                      value={newSlots}
                      onChange={(e) => setNewSlots(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={!selectedCharterId || addMutation.isPending}>
                      {addMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Calendario mensual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-ocean-blue" />
                Calendar — {monthKey}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DayPickerCalendar
                mode="single"
                month={visibleMonth}
                onMonthChange={(m) => setVisibleMonth(m)}
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  // Día tiene al menos 1 slot disponible
                  available: (date) => {
                    const key = dayKey(date);
                    const items = availabilityByDay[key] || [];
                    const total = items.reduce((acc, r) => acc + r.slots, 0);
                    const booked = items.reduce((acc, r) => acc + r.bookedSlots, 0);
                    return total > booked;
                  },
                  // Día completamente lleno
                  booked: (date) => {
                    const key = dayKey(date);
                    const items = availabilityByDay[key] || [];
                    if (items.length === 0) return false;
                    const total = items.reduce((acc, r) => acc + r.slots, 0);
                    const booked = items.reduce((acc, r) => acc + r.bookedSlots, 0);
                    return total > 0 && total === booked;
                  },
                }}
                modifiersStyles={{
                  available: { backgroundColor: "#dcfce7", color: "#166534" }, // green-100 / green-700
                  booked: { backgroundColor: "#fee2e2", color: "#b91c1c" },    // red-100 / red-700
                }}
              />

              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded border bg-green-100 border-green-300" />
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded border bg-red-100 border-red-300" />
                    <span className="text-sm">Fully booked</span>
                  </div>
                </div>
                <div className="text-xs text-storm-gray">
                  Tap any day to view or edit its availability.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalle del día */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-ocean-blue" />
                {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAvailability ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200/60 rounded animate-pulse" />
                  ))}
                </div>
              ) : selectedDayItems.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayItems.map((row) => {
                    const remaining = Math.max(0, row.slots - row.bookedSlots);
                    const isFull = row.slots > 0 && row.slots === row.bookedSlots;

                    return (
                      <div
                        key={row.id}
                        className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {new Date(row.date).toLocaleDateString()} — {row.slots} {row.slots === 1 ? "slot" : "slots"}
                          </p>
                          <p className="text-sm text-storm-gray">
                            {remaining} remaining • {row.bookedSlots} booked
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={isFull ? "destructive" : "secondary"}>
                            {isFull ? "Fully booked" : "Available"}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(row)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(row)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline editor */}
                  {editRow && (
                    <div className="mt-2 p-4 border rounded-lg bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <Label htmlFor="edit-slots">Edit slots</Label>
                          <Input
                            id="edit-slots"
                            type="number"
                            min={Math.max(1, editRow.bookedSlots)}
                            value={editSlots}
                            onChange={(e) => setEditSlots(Number(e.target.value) || Math.max(1, editRow.bookedSlots))}
                          />
                          <p className="text-xs text-storm-gray mt-1">
                            Must be ≥ booked ({editRow.bookedSlots}).
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => patchMutation.mutate({ id: editRow.id, slots: Math.max(editRow.bookedSlots, editSlots) })}
                            disabled={patchMutation.isPending}
                          >
                            {patchMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => setEditRow(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock className="w-12 h-12 text-storm-gray mx-auto mb-4" />
                  <p className="text-storm-gray">No availability set for this date.</p>
                  <Button className="mt-4" onClick={() => setIsAdding(true)} disabled={!selectedCharterId}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Availability
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Days with availability</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.daysWithAvailability}</p>
                </div>
                <CalendarIcon className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Fully booked days</p>
                  <p className="text-3xl font-bold text-blue-600">{metrics.fullyBookedDays}</p>
                </div>
                <CalendarIcon className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-storm-gray">Remaining slots (month)</p>
                  <p className="text-3xl font-bold text-purple-600">{metrics.remainingSlots}</p>
                </div>
                <Clock className="text-purple-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado: sin charters */}
        {!loadingCharters && (!myCharters || myCharters.length === 0) && (
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <Ship className="mx-auto mb-4 text-storm-gray" size={56} />
              <h3 className="text-xl font-semibold mb-2">You don’t have any charters yet</h3>
              <p className="text-storm-gray mb-6">Create a charter first to manage its availability.</p>
              <Button asChild>
                <Link href="/captain/charters/new">
                  Create Charter
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
