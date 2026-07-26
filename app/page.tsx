import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveDemoWidget from "@/components/LiveDemoWidget";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Search,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-orange-50/50 via-slate-50 to-slate-50 border-b border-slate-200">
        {/* Background Accent Blur */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-daraz-orange/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-daraz-orange/10 border border-daraz-orange/30 text-daraz-orange px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Sparkles className="w-4 h-4" />
            Optimized for Daraz Search Algorithm
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Generate <span className="text-daraz-orange">Page-1 Daraz Listings</span> in Seconds
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Paste 2 to 5 competitor titles. Our Claude AI engine extracts high-converting keywords, formats strict 100–120 char titles, and writes seller-ready highlights & descriptions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="btn-primary py-3.5 px-8 text-base font-bold shadow-lg shadow-daraz-orange/25 w-full sm:w-auto"
            >
              <Sparkles className="w-5 h-5" />
              Start Generating Free
            </Link>
            <a
              href="#demo"
              className="btn-secondary py-3.5 px-7 text-base font-semibold w-full sm:w-auto"
            >
              <Zap className="w-5 h-5 text-daraz-orange" />
              Try Interactive Demo
            </a>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6 border-t border-slate-200 text-slate-700 text-sm font-medium">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100–120 Char Limit Compliance</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Banned Words Auto-Filter</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Copy-Paste Field Ready</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>History Dashboard Saved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            See the AI Engine in Action
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Test our simulated generator below to see how raw competitor titles are transformed into structured Daraz marketplace assets.
          </p>
        </div>

        <LiveDemoWidget />
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Why Top Daraz Sellers Choose Ummah DarazListings
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              Built ground-up following Daraz’s official product ranking documentation and buyer conversion patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-daraz">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-daraz-orange flex items-center justify-center mb-4 font-bold">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Keyword Front-Loading</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automatically isolates the highest-volume search queries from your 2-5 input titles and positions them at the very beginning for search index preference.
              </p>
            </div>

            <div className="card-daraz">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Strict Rule Enforcement</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Prevents product rejection by automatically removing spam words like "best", "cheap", "free shipping", or "#1", while enforcing strict 100-120 character caps.
              </p>
            </div>

            <div className="card-daraz">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Conversion Bullet Points</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Generates 4 to 6 scannable bullet points in Daraz "Highlights" format, focusing on key features, benefits, and buyer confidence triggers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              3 Simple Steps to Create Optimized Listings
            </h2>
            <p className="text-slate-600 text-sm">No copywriting expertise required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-daraz-orange text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Paste 2 to 5 Titles</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Copy existing Daraz titles of competing top-selling items in your category into our dynamic form.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-daraz-orange text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-slate-900 mb-2">AI Analyzes & Synthesizes</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Claude 3.5 Sonnet extracts common attributes, primary keywords, brand models, and specifications.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-daraz-orange text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Copy & Save</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Copy individual fields directly into your Daraz Seller Center form and save the listing to your history dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-16 bg-slate-900 rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">
                Ready to boost your Daraz sales?
              </h3>
              <p className="text-slate-400 text-sm max-w-xl">
                Join hundreds of marketplace sellers optimizing their product listings for search traffic and conversions today.
              </p>
            </div>
            <Link href="/sign-up" className="btn-primary py-3.5 px-8 text-base font-bold whitespace-nowrap">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
