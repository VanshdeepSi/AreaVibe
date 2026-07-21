"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MapPin, User, Info, Map as MapIcon, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navItems = [
    { name: "Map", path: "/map", icon: MapIcon },
    { name: "Methodology", path: "/methodology", icon: Info },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <nav className="h-14 md:h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-50 relative">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <MapPin className="w-5 h-5 md:w-6 md:h-6 text-brand" />
        <span className="text-lg md:text-xl font-bold tracking-tight text-white">AreaVibe</span>
      </Link>
      
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive ? "text-brand" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 md:hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors border-b border-white/5 ${
                  isActive ? "text-brand bg-brand/5" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
