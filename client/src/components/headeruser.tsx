import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Heart, Book, HelpCircle, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";

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
        // Clear auth cache
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        // Redirect to home
        setLocation("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 h-16 md:h-20">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img
              src="/attached_assets/IMG_2128-Photoroom_1749772590031.png"
              alt="Charterly Logo"
              className="h-8 md:h-12 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Spacer for layout */}
        <div className="flex-1"></div>

        {/* Menu de usuario (desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/user/reservations">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <Book className="w-4 h-4 mr-2" /> My Trips
            </Button>
          </Link>
          <Link href="/user/favorites">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <Heart className="w-4 h-4 mr-2" /> Favorites
            </Button>
          </Link>
          <Link href="/user/profile">
            <div className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue cursor-pointer p-2 rounded transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImage || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-ocean-blue text-white text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline">Profile</span>
            </div>
          </Link>
          <Link href="/help">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <HelpCircle className="w-4 h-4 mr-2" /> Help
            </Button>
          </Link>
          <Button 
            onClick={handleLogout}
            className="bg-ocean-blue hover:bg-blue-800 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col space-y-4 mt-8">
              <Link href="/user/reservations" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Book className="w-4 h-4 mr-2" /> My Trips
                </Button>
              </Link>
              <Link href="/user/favorites" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Heart className="w-4 h-4 mr-2" /> Favorites
                </Button>
              </Link>
              <Link href="/user/profile" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={user?.profileImage || ""} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-ocean-blue text-white text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  Profile
                </Button>
              </Link>
              <Link href="/help" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" /> Help
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full bg-ocean-blue hover:bg-blue-800 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      
    </header>
  );
}
