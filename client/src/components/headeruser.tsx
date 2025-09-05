import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, Heart, Book, HelpCircle, LogOut, Menu } from "lucide-react";
import SearchBar from "@/components/search-bar";

export default function HeaderUser() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img
              src="/attached_assets/IMG_2128-Photoroom_1749772590031.png"
              alt="Charterly Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>
        </Link>

        {/* SearchBar en el centro */}
        <div className="hidden md:flex flex-1 justify-center px-6">
          <SearchBar onSearch={(filters) => {
            const params = new URLSearchParams(filters as any).toString();
            window.location.href = `/search?${params}`;
          }} />
        </div>

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
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <User className="w-4 h-4 mr-2" /> Profile
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="ghost" className="text-gray-700 hover:text-ocean-blue">
              <HelpCircle className="w-4 h-4 mr-2" /> Help
            </Button>
          </Link>
          <Link href="/logout">
            <Button className="bg-ocean-blue hover:bg-blue-800 text-white">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </Link>
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
                  <User className="w-4 h-4 mr-2" /> Profile
                </Button>
              </Link>
              <Link href="/help" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" /> Help
                </Button>
              </Link>
              <Link href="/logout" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-ocean-blue hover:bg-blue-800 text-white">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* SearchBar para móvil */}
      <div className="md:hidden border-t border-gray-100 p-3">
        <SearchBar onSearch={(filters) => {
          const params = new URLSearchParams(filters as any).toString();
          window.location.href = `/search?${params}`;
        }} />
      </div>
    </header>
  );
}
