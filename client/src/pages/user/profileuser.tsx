import { useEffect, useMemo, useState } from "react";
import HeaderUser from "@/components/headeruser";
import Footer from "@/components/footer";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileImageUpload from "@/components/ui/profile-image-upload";
import { fetchWithCsrf } from "@/lib/csrf";

import {
  User as UserIcon,
  Lock,
  Bell,
  HelpCircle,
  LogOut,
  Calendar,
  DollarSign,
  Ship,
  Loader2,
} from "lucide-react";

type Tab = "profile" | "security" | "notifications" | "trips" | "help";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  // avatar opcional si lo agregas luego
  avatar?: string | null;
  profileImageUrl?: string | null;
};

type Booking = {
  id: number;
  tripDate: string; // ISO
  guests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | string;
  charter?: {
    id: number;
    title: string;
    location: string;
    images: string[];
    price: number;
    captain?: { name: string };
  };
};

export default function UserProfilePage() {
  const [tab, setTab] = useState<Tab>("profile");

  // ===== Auth user =====
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ===== Profile form =====
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // ===== Password form =====
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  // ===== Bookings =====
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // ===== Notifications (localStorage) =====
  type Prefs = { tripReminders: boolean; captainMessages: boolean; marketing: boolean };
  const PREFS_KEY = "notif_prefs_v1";
  const [prefs, setPrefs] = useState<Prefs>({ tripReminders: true, captainMessages: true, marketing: false });

  // ---- Fetch user on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (!res.ok) throw new Error("Unauthorized");
        const u: User = await res.json();
        if (!active) return;
        setUser(u);
        setProfileForm({
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
        });
      } catch {
        setUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ---- Load bookings when switching to "trips" first time
  useEffect(() => {
    if (tab !== "trips") return;
    if (bookings.length > 0 || bookingsLoading) return;
    setBookingsLoading(true);
    fetch("/api/bookings/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Booking[]) => setBookings(data))
      .finally(() => setBookingsLoading(false));
  }, [tab, bookings.length, bookingsLoading]);

  // ---- Load notifications prefs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) setPrefs(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogout = async () => {
    await fetchWithCsrf("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  // ===== Handlers =====
  const onProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetchWithCsrf("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm), // solo firstName, lastName (tu backend lo espera así)
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setUser(updated);
      alert("Profile updated");
    } catch (e: any) {
      alert(e.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onPwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwdForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };
  const savePassword = async () => {
    setSavingPwd(true);
    try {
      const res = await fetchWithCsrf("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(pwdForm), // { currentPassword, newPassword }
      });
      if (!res.ok) throw new Error("Password change failed");
      alert("Password changed");
      setPwdForm({ currentPassword: "", newPassword: "" });
    } catch (e: any) {
      alert(e.message || "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  };

  const togglePref = (k: keyof Prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const savePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    alert("Preferences saved");
  };

  const cancelBooking = async (id: number) => {
    setCancelingId(id);
    try {
      const res = await fetchWithCsrf(`/api/bookings/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Cancel failed");
      setBookings((list) =>
        list.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
    } catch (e: any) {
      alert(e.message || "Failed to cancel");
    } finally {
      setCancelingId(null);
    }
  };

  const upcoming = useMemo(
    () => bookings.filter((b) => new Date(b.tripDate) >= new Date()),
    [bookings]
  );
  const past = useMemo(
    () => bookings.filter((b) => new Date(b.tripDate) < new Date()),
    [bookings]
  );

  // ===== UI states =====
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderUser />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ocean-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderUser />
        <div className="flex-1 flex items-center justify-center text-gray-600">
          Please&nbsp;<a className="text-ocean-blue underline" href="/login">log in</a>&nbsp;to access your account.
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderUser />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarImage src={user.profileImageUrl || user.avatar || ""} />
                <AvatarFallback>
                  {(user.firstName?.[0] || "U") + (user.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-base font-semibold">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account"}
              </h2>
              <p className="text-xs text-gray-500">{user.email}</p>
              <Button onClick={handleLogout} variant="outline" className="w-full mt-4 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </CardContent>
          </Card>

          {/* Menu */}
          <Card className="shadow-sm">
            <CardContent className="p-3 space-y-1">
              <SidebarItem icon={<UserIcon className="w-4 h-4" />} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
              <SidebarItem icon={<Lock className="w-4 h-4" />} label="Security" active={tab === "security"} onClick={() => setTab("security")} />
              <SidebarItem icon={<Bell className="w-4 h-4" />} label="Notifications" active={tab === "notifications"} onClick={() => setTab("notifications")} />
              <SidebarItem icon={<Calendar className="w-4 h-4" />} label="My Trips" active={tab === "trips"} onClick={() => setTab("trips")} />
              <SidebarItem icon={<HelpCircle className="w-4 h-4" />} label="Help" active={tab === "help"} onClick={() => setTab("help")} />
            </CardContent>
          </Card>
        </aside>

        {/* Main – dynamic content */}
        <main className="space-y-6">
          {tab === "profile" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <div className="mt-1 font-medium">{user.email}</div>
                </div>

                {/* Profile Image Upload */}
                <ProfileImageUpload
                  currentImageUrl={user.profileImageUrl}
                  onSuccess={(newImageUrl) => {
                    // Update user object with new image
                    setUser(prev => prev ? { ...prev, profileImageUrl: newImageUrl } : null);
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First name</label>
                    <Input name="firstName" value={profileForm.firstName} onChange={onProfileChange} placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last name</label>
                    <Input name="lastName" value={profileForm.lastName} onChange={onProfileChange} placeholder="Last name" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={savingProfile} className="bg-ocean-blue text-white hover:bg-blue-800">
                    {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "security" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Current password</label>
                    <Input type="password" name="currentPassword" value={pwdForm.currentPassword} onChange={onPwdChange} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">New password</label>
                    <Input type="password" name="newPassword" value={pwdForm.newPassword} onChange={onPwdChange} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={savePassword} disabled={savingPwd} className="bg-ocean-blue text-white hover:bg-blue-800">
                    {savingPwd && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "notifications" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleLine
                  checked={prefs.tripReminders}
                  onChange={() => togglePref("tripReminders")}
                  label="Trip reminders & updates"
                />
                <ToggleLine
                  checked={prefs.captainMessages}
                  onChange={() => togglePref("captainMessages")}
                  label="Captain messages"
                />
                <ToggleLine
                  checked={prefs.marketing}
                  onChange={() => togglePref("marketing")}
                  label="Promotions & tips"
                />
                <div className="pt-2 flex justify-end">
                  <Button onClick={savePrefs} className="bg-ocean-blue text-white hover:bg-blue-800">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "trips" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>My Trips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Upcoming */}
                <section>
                  <h3 className="font-semibold mb-3">Upcoming</h3>
                  {bookingsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading trips...
                    </div>
                  ) : upcoming.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming trips.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {upcoming.map((b) => (
                        <TripCard
                          key={b.id}
                          b={b}
                          onCancel={() => cancelBooking(b.id)}
                          canceling={cancelingId === b.id}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Past */}
                <section>
                  <h3 className="font-semibold mb-3">Past</h3>
                  {bookingsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading trips...
                    </div>
                  ) : past.length === 0 ? (
                    <p className="text-sm text-gray-500">You have no past trips.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {past.map((b) => (
                        <TripCard key={b.id} b={b} />
                      ))}
                    </div>
                  )}
                </section>
              </CardContent>
            </Card>
          )}

          {tab === "help" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Help Center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Need assistance? Check our <a href="/help" className="text-ocean-blue underline">Help page</a>.
                </p>
                <p className="text-sm text-gray-600">
                  For issues with a booking, message your captain from the trip details.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

/* ----------------- UI helpers ----------------- */

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-ocean-blue/10 text-ocean-blue" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ToggleLine({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-ocean-blue" />
      <span>{label}</span>
    </label>
  );
}

function TripCard({
  b,
  onCancel,
  canceling,
}: {
  b: Booking;
  onCancel?: () => void;
  canceling?: boolean;
}) {
  const img = b.charter?.images?.[0];
  const date = new Date(b.tripDate);
  const canCancel = b.status !== "cancelled" && onCancel;

  return (
    <Card className="overflow-hidden hover:shadow-md transition">
      {img && <img src={img} alt={b.charter?.title} className="h-40 w-full object-cover" />}
      <CardContent className="p-4 space-y-2">
        <h4 className="font-semibold text-gray-900 line-clamp-1">{b.charter?.title || "Fishing Trip"}</h4>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <Ship className="w-4 h-4 text-ocean-blue" />
          {b.charter?.captain?.name || "Captain"}
        </p>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-ocean-blue" />
          {date.toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-ocean-blue" /> ${b.totalPrice}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
              b.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : b.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {b.status}
          </span>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={!!canceling}
              className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
