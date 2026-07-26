"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Sparkles, ShoppingBag, LayoutDashboard, History } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-daraz-orange to-amber-600 flex items-center justify-center text-white shadow-md shadow-daraz-orange/20 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              Ummah <span className="text-daraz-orange">DarazListings</span>
            </span>
            <span className="text-[10px] block -mt-1 font-medium text-slate-500 tracking-wider uppercase">
              SEO Engine for Daraz Sellers
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-daraz-orange transition-colors">
            Home
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 hover:text-daraz-orange transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-daraz-orange" />
              Generator
            </Link>
            <Link
              href="/dashboard/history"
              className="flex items-center gap-1.5 hover:text-daraz-orange transition-colors"
            >
              <History className="w-4 h-4 text-slate-500" />
              Saved History
            </Link>
          </SignedIn>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <Link href="/sign-up" className="btn-primary text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" />
              Get Started Free
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="btn-primary text-xs sm:text-sm hidden sm:flex">
              <Sparkles className="w-4 h-4" />
              Create Listing
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
