import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  Ship,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageSquare,
  Pencil,
  CreditCard,
} from "lucide-react";
import React from "react";

type NavItem = { label: string; href: string; icon: React.ReactNode };

const defaultNav: NavItem[] = [
  { label: "Overview", href: "/captain/overview", icon: <Ship className="w-5 h-5" /> },
  { label: "Charters", href: "/captain/charters", icon: <Ship className="w-5 h-5" /> },
  { label: "Bookings", href: "/captain/bookings", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Calendar", href: "/captain/calendar", icon: <CalendarIcon className="w-5 h-5" /> },
  { label: "Analytics", href: "/captain/analytics", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Messages", href: "/captain/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Subscription", href: "/captain/subscribe", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Profile", href: "/captain/profile", icon: <Pencil className="w-5 h-5" /> },
];

export default function HeaderCaptain({
  nav = defaultNav,
  logoSrc = "/attached_assets/IMG_2128-Photoroom_1749772590031.png",
}: {
  nav?: NavItem[];
  logoSrc?: string;
}) {
  const [pathname] = useLocation();

  const isActive = (href: string) => {
    if (href === "/captain/overview") return pathname === "/captain/overview";
    return pathname?.startsWith(href);
  };

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo XL */}
        <Link href="/captain/overview" className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="Charterly"
            className="h-32 md:h-36 lg:h-40 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={[
                "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition",
                isActive(n.href)
                  ? "bg-ocean-blue/10 text-ocean-blue"
                  : "text-gray-800 hover:bg-gray-100",
              ].join(" ")}
            >
              {n.icon}
              {n.label}
              {isActive(n.href) && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-ocean-blue" />
              )}
            </Link>
          ))}

          {/* Logout a la derecha */}
          <div className="ml-2 flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className="md:hidden">
          <MobileCaptainDrawer nav={nav} onLogout={handleLogout} logoSrc={logoSrc} />
        </div>
      </nav>
    </header>
  );
}

function MobileCaptainDrawer({
  nav,
  onLogout,
  logoSrc,
}: {
  nav: NavItem[];
  onLogout: () => void;
  logoSrc: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        {/* Encabezado simple sin avatar */}
        <div className="mt-6 px-1">
          <Link href="/captain/overview" className="flex items-center gap-2">
            <img
              src={logoSrc}
              alt="Charterly"
              className="h-16 w-auto object-contain"
            />
            <span className="text-sm text-gray-500">Captain Panel</span>
          </Link>
        </div>

        <div className="mt-6 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block px-3 py-2 rounded-lg font-medium transition text-gray-900 hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                {n.icon}
                {n.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-2 px-1">
          <Button variant="outline" className="w-full" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
