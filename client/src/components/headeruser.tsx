import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Book, HelpCircle, LogOut, Menu, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function HeaderUser() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Logo */}
        <Link href="/user/home">
          <div className="flex items-center cursor-pointer">
            <img
              src="/attached_assets/IMG_2128-Photoroom_1749772590031.png"
              alt="Charterly Logo"
              className="h-20 md:h-24 lg:h-28 w-auto object-contain transition-transform hover:scale-110"
            />
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/user/profileuser">
            <div className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue cursor-pointer p-2 rounded transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                <AvatarFallback className="bg-ocean-blue text-white text-sm">
                  {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline font-medium">Profile</span>
            </div>
          </Link>

          <Link href="/user/my-trips">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <Book className="w-4 h-4 mr-2" /> My Trips
            </Button>
          </Link>

          <Link href="/user/messages">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <MessageCircle className="w-4 h-4 mr-2" /> Messages
            </Button>
          </Link>

          <Link href="/user/helpuser">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <HelpCircle className="w-4 h-4 mr-2" /> Help
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>

        {/* Mobile menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden" aria-label="Menu">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col space-y-4 mt-8">
              <Link href="/user/profileuser" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-ocean-blue text-white text-xs">
                      {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  Profile
                </Button>
              </Link>

              <Link href="/user/my-trips" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Book className="w-4 h-4 mr-2" /> My Trips
                </Button>
              </Link>

              <Link href="/user/messages" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" /> Messages
                </Button>
              </Link>

              <Link href="/user/helpuser" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" /> Help
                </Button>
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-2"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

