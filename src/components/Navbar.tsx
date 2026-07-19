"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, User, Info, Map as MapIcon } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Map", path: "/map", icon: MapIcon },
    { name: "Methodology", path: "/methodology", icon: Info },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <nav className="h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <MapPin className="w-6 h-6 text-brand" />
        <span className="text-xl font-bold tracking-tight text-white">AreaVibe</span>
      </Link>
      
      <div className="flex items-center gap-6">
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
    </nav>
  );
}
