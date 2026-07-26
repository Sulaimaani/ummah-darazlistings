import Link from "next/link";
import { ShoppingBag, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-daraz-orange flex items-center justify-center text-white font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white">
                Ummah <span className="text-daraz-orange">DarazListings</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-4">
              The premier AI-powered SEO listing generator built specifically for Daraz marketplace sellers. Turn top-performing competitor titles into page-1 ranking product listings in seconds.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md w-fit">
              <CheckCircle2 className="w-4 h-4" />
              Designed to comply with official Daraz SEO & character limit rules
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-daraz-orange transition-colors">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-daraz-orange transition-colors">
                  SEO Listing Generator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/history" className="hover:text-daraz-orange transition-colors">
                  Saved History
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-daraz-orange transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">Daraz Guidelines</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Title Length limit: 100–120 chars</li>
              <li>Front-load primary keyword</li>
              <li>No promotional hype words</li>
              <li>Structured bullet highlights</li>
              <li>Detailed specs coverage</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Ummah DarazListings. All rights reserved.</p>
          <p className="text-slate-400">
            Powered by Claude 3.5 Sonnet & Clerk Auth
          </p>
        </div>
      </div>
    </footer>
  );
}
