import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Ship, Menu, MessageCircle, User } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "How it works", href: "#how-it-works" },
    { name: "Become a Captain", href: "/captain/dashboard" },
    { name: "Help", href: "#help" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    return location === href || location.startsWith(href + "/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 ocean-gradient rounded-xl flex items-center justify-center">
                <Ship className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-ocean-blue">Charterly</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors ${
                  isActive(item.href)
                    ? "text-ocean-blue"
                    : "text-storm-gray hover:text-ocean-blue"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/messages">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-storm-gray hover:text-ocean-blue"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-storm-gray hover:text-ocean-blue"
            >
              <User className="w-4 h-4 mr-2" />
              Log in
            </Button>
            <Button 
              size="sm"
              className="bg-ocean-blue hover:bg-blue-800 text-white"
            >
              Sign up
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg transition-colors ${
                      isActive(item.href)
                        ? "text-ocean-blue font-semibold"
                        : "text-storm-gray hover:text-ocean-blue"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="border-t pt-4 space-y-2">
                  <Link href="/messages" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-storm-gray hover:text-ocean-blue"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-storm-gray hover:text-ocean-blue"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                  <Button 
                    className="w-full bg-ocean-blue hover:bg-blue-800 text-white"
                  >
                    Sign up
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
