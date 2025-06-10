import { Link } from "wouter";
import { Ship, Facebook, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/attached_assets/IMG_2128_1749590320746.PNG" 
                alt="Charterly Logo" 
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 mb-4">
              The smarter way to book fishing charters. Connect with verified captains without the fees.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* For Anglers */}
          <div>
            <h3 className="font-semibold mb-4">For Anglers</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Find Charters
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#safety" className="hover:text-white transition-colors">
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a href="#help" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* For Captains */}
          <div>
            <h3 className="font-semibold mb-4">For Captains</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/captain/dashboard" className="hover:text-white transition-colors">
                  List Your Charter
                </Link>
              </li>
              <li>
                <a href="#resources" className="hover:text-white transition-colors">
                  Captain Resources
                </a>
              </li>
              <li>
                <a href="#safety" className="hover:text-white transition-colors">
                  Safety Standards
                </a>
              </li>
              <li>
                <a href="#support" className="hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Charterly. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
