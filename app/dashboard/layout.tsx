"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Sparkles,
  LayoutDashboard,
  History,
  ShoppingBag,
  Home,
  HelpCircle,
  Menu,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: "SEO Generator",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Gallery Generator",
      href: "/dashboard/gallery",
      icon: ImageIcon,
    },
    {
      label: "Saved History",
      href: "/dashboard/history",
      icon: History,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-daraz-orange flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Ummah DarazListings</span>
        </Link>

        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 space-y-2 sticky top-14 z-40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  active ? "bg-daraz-orange text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800"
          >
            <Home className="w-4 h-4" />
            Public Home
          </Link>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 sticky top-0 h-screen shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-daraz-orange to-amber-600 flex items-center justify-center text-white shadow-md shadow-daraz-orange/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight flex items-center gap-1">
                Ummah <span className="text-daraz-orange">Daraz</span>
              </span>
              <span className="text-[10px] block font-medium text-slate-400 uppercase tracking-wider">
                Seller Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* Nav list */}
        <div className="p-4 flex-1 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-daraz-orange text-white shadow-md shadow-daraz-orange/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Info Card */}
        <div className="p-4 m-3 bg-slate-800/80 border border-slate-700/60 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Daraz SEO Engine
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Claude 3.5 Sonnet optimizes titles for 100-120 char limit & highlights.
          </p>
          <Link
            href="/"
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Landing Page
          </Link>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <UserButton afterSignOutUrl="/" />
            <div className="truncate text-xs">
              <p className="font-semibold text-white truncate">
                {user?.fullName || user?.firstName || "Daraz Seller"}
              </p>
              <p className="text-slate-400 truncate text-[11px]">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
