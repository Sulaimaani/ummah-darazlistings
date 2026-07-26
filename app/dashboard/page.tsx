"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  RefreshCw,
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { GenerationResult } from "@/lib/validations";

const PRESETS = [
  {
    label: "Wireless Earbuds",
    titles: [
      "F9 TWS Wireless Earphones Bluetooth 5.1 Stereo Earbuds Waterproof Touch Control",
      "M10 TWS Bluetooth Earbuds Noise Reduction Headset Gaming Headphones Power Bank",
      "Air3 TWS Earphones Wireless Bluetooth Headset Heavy Bass Earbuds With Mic",
    ],
  },
  {
    label: "Smartwatch Series 9",
    titles: [
      "Series 9 Smart Watch Ultra 2 Bluetooth Call Heart Rate Monitor Fitness Tracker",
      "i8 Pro Max Smart Watch Full Touch Screen Waterproof Sports Wristband NFC",
      "T900 Ultra Smartwatch Wireless Charging Men Women Fitness Band Watch",
    ],
  },
  {
    label: "Air Fryer 6L",
    titles: [
      "Digital Air Fryer 6L Oil Free Electric Oven Touch Screen Smart Multicooker",
      "6 Liter Airfryer Automatic Temperature Control Non Stick Basket 1400W",
      "Large Capacity Healthy Oil-Free Air Fryer Roaster Oven with Recipe Book",
    ],
  },
];

export default function GeneratorPage() {
  const [titles, setTitles] = useState<string[]>([
    "F9 TWS Wireless Earphones Bluetooth 5.1 Stereo Earbuds Waterproof Touch Control",
    "M10 TWS Bluetooth Earbuds Noise Reduction Headset Gaming Headphones Power Bank",
    "Air3 TWS Earphones Wireless Bluetooth Headset Heavy Bass Earbuds With Mic",
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Field change handler
  const handleTitleChange = (index: number, value: string) => {
    const next = [...titles];
    next[index] = value;
    setTitles(next);
  };

  // Add field
  const handleAddTitle = () => {
    if (titles.length < 5) {
      setTitles([...titles, ""]);
    }
  };

  // Remove field
  const handleRemoveTitle = (index: number) => {
    if (titles.length > 2) {
      setTitles(titles.filter((_, i) => i !== index));
    }
  };

  // Load preset
  const handleLoadPreset = (presetTitles: string[]) => {
    setTitles([...presetTitles]);
    toast.success("Loaded sample product titles preset!");
  };

  // Generate Listing
  const handleGenerate = async () => {
    // Basic frontend checks
    const cleaned = titles.map((t) => t.trim()).filter((t) => t.length > 0);
    if (cleaned.length < 2) {
      toast.error("Please enter at least 2 non-empty Daraz competitor titles.");
      return;
    }

    const shortTitles = cleaned.filter((t) => t.length < 3);
    if (shortTitles.length > 0) {
      toast.error("Each title must contain at least 3 characters.");
      return;
    }

    setLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles: cleaned }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate listing.");
      }

      setResult(data.data);
      toast.success("Daraz SEO listing generated successfully!");
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Save to DB
  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputTitles: titles.filter((t) => t.trim().length > 0),
          seoTitle: result.seoTitle,
          shortDescription: result.shortDescription,
          longDescription: result.longDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save listing.");
      }

      setIsSaved(true);
      toast.success("Saved to your history dashboard!");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Could not save listing.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-daraz-orange" />
          Daraz SEO Listing Generator
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Paste 2 to 5 competitor titles from Daraz. Our AI engine will extract primary keywords, apply Daraz character limits (~100–120 chars), and format bullet highlights and descriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-daraz space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-daraz-orange" />
                Input Competitor Titles ({titles.length}/5)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Min 2 • Max 5</span>
            </div>

            {/* Quick Fill Presets */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Quick Fill Example Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleLoadPreset(p.titles)}
                    className="text-xs bg-white hover:bg-orange-50 hover:text-daraz-orange text-slate-700 font-medium px-2.5 py-1 rounded border border-slate-300 transition-colors"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Inputs */}
            <div className="space-y-3">
              {titles.map((title, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Title #{idx + 1}</span>
                    <span>{title.trim().length} chars</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      placeholder={`e.g., Competitor product title #${idx + 1} from Daraz...`}
                      rows={2}
                      className="input-daraz resize-none text-xs"
                    />
                    {titles.length > 2 && (
                      <button
                        onClick={() => handleRemoveTitle(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                        title="Remove title"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            {titles.length < 5 && (
              <button
                onClick={handleAddTitle}
                className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-daraz-orange hover:text-daraz-orange rounded-lg text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Competitor Title ({5 - titles.length} remaining)
              </button>
            )}

            {/* Submit CTA */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-bold shadow-md shadow-daraz-orange/20 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Daraz Listing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate SEO Listing
                </>
              )}
            </button>
          </div>

          {/* Guidelines Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              Daraz SEO Best Practices Included
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>Primary keyword front-loaded for initial search index scanning.</li>
              <li>Calculated character limit strictly targeted around 100–120 chars.</li>
              <li>Excludes banned promotional words like "best", "cheap", "free shipping".</li>
            </ul>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {loading && (
            <div className="card-daraz py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-daraz-orange flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Analyzing Product Titles...</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Extracting primary search keywords & engineering Daraz highlights
                </p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card-daraz py-20 text-center space-y-3 bg-slate-50/50 border-dashed border-2 border-slate-300">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">No Generation Yet</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Enter your competitor titles on the left and click "Generate SEO Listing" to view optimized title, highlights, and description.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {/* Header bar with save button */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Generation Complete
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                  className={`btn-secondary text-xs py-2 px-3.5 ${
                    isSaved ? "bg-emerald-50 text-emerald-700 border-emerald-300" : ""
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4 text-daraz-orange" />
                  {isSaving ? "Saving..." : isSaved ? "Saved to History ✓" : "Save Listing to Dashboard"}
                </button>
              </div>

              {/* Field 1: SEO Title */}
              <div className="card-daraz space-y-3 relative">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    1. Optimized Daraz Title
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        result.seoTitle.length >= 90 && result.seoTitle.length <= 125
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {result.seoTitle.length} Chars (100–120 Optimal)
                    </span>
                    <button
                      onClick={() => handleCopy(result.seoTitle, "SEO Title")}
                      className="btn-secondary text-xs py-1.5 px-2.5"
                      title="Copy SEO Title"
                    >
                      {copiedField === "SEO Title" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedField === "SEO Title" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-900 leading-relaxed">
                  {result.seoTitle}
                </div>
              </div>

              {/* Field 2: Short Description / Highlights */}
              <div className="card-daraz space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Short Description (Daraz Highlights)
                  </span>
                  <button
                    onClick={() => handleCopy(result.shortDescription, "Short Description")}
                    className="btn-secondary text-xs py-1.5 px-2.5"
                    title="Copy Highlights"
                  >
                    {copiedField === "Short Description" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedField === "Short Description" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-sans whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {result.shortDescription}
                </pre>
              </div>

              {/* Field 3: Long Description */}
              <div className="card-daraz space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Long Description
                  </span>
                  <button
                    onClick={() => handleCopy(result.longDescription, "Long Description")}
                    className="btn-secondary text-xs py-1.5 px-2.5"
                    title="Copy Long Description"
                  >
                    {copiedField === "Long Description" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedField === "Long Description" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs whitespace-pre-wrap text-slate-800 leading-relaxed max-h-96 overflow-y-auto">
                  {result.longDescription}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
