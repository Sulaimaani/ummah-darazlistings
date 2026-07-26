"use client";

import { useEffect, useState } from "react";
import {
  History,
  Search,
  Copy,
  Check,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Listing } from "@/lib/db/schema";

export default function HistoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      if (data.success) {
        setListings(data.listings || []);
      } else {
        toast.error(data.error || "Failed to load saved listings.");
      }
    } catch (err) {
      console.error("Fetch listings error:", err);
      toast.error("Network error loading listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Filter listings
  const filtered = listings.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = item.seoTitle.toLowerCase().includes(query);
    const matchesInput = item.inputTitles.some((t) => t.toLowerCase().includes(query));
    return matchesTitle || matchesInput;
  });

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Delete listing
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved listing?")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/listings?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setListings(listings.filter((item) => item.id !== id));
        toast.success("Listing deleted successfully.");
      } else {
        toast.error(data.error || "Failed to delete listing.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-daraz-orange" />
            Saved Daraz Listings
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Access and manage all your previously generated SEO titles and product descriptions.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved listings..."
            className="input-daraz pl-9 text-xs"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-daraz animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-12 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card-daraz py-16 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            {searchQuery ? "No matching listings found" : "No saved listings yet"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search query keyword."
              : "Generate a new SEO listing in the Generator tab and save it to view it here."}
          </p>
        </div>
      )}

      {/* List Grid */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={item.id} className="card-daraz space-y-4 transition-all">
                {/* Card Top Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {dateStr}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                      <Layers className="w-3 h-3" />
                      {item.inputTitles.length} Input Titles
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.seoTitle, `Title-${item.id}`)}
                      className="btn-secondary text-xs py-1 px-2.5"
                      title="Copy SEO Title"
                    >
                      {copiedField === `Title-${item.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy Title
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main SEO Title */}
                <div>
                  <span className="text-[11px] font-bold text-daraz-orange uppercase tracking-wider block mb-1">
                    Optimized SEO Title ({item.seoTitle.length} chars)
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {item.seoTitle}
                  </h3>
                </div>

                {/* Input Titles Preview */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Based on competitor titles:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 italic">
                    {item.inputTitles.map((t, idx) => (
                      <li key={idx} className="truncate">
                        "{t}"
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Toggle details button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="text-xs text-daraz-orange hover:text-daraz-orange-hover font-semibold flex items-center gap-1 transition-colors pt-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Hide Highlights & Long Description
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> View Highlights & Long Description
                    </>
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-200 space-y-4 animate-fadeIn">
                    {/* Highlights */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          Short Description (Highlights)
                        </span>
                        <button
                          onClick={() => handleCopy(item.shortDescription, `Short-${item.id}`)}
                          className="text-xs text-slate-600 hover:text-daraz-orange flex items-center gap-1 font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Highlights
                        </button>
                      </div>
                      <pre className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-sans whitespace-pre-wrap text-slate-800 leading-relaxed">
                        {item.shortDescription}
                      </pre>
                    </div>

                    {/* Long Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          Long Description
                        </span>
                        <button
                          onClick={() => handleCopy(item.longDescription, `Long-${item.id}`)}
                          className="text-xs text-slate-600 hover:text-daraz-orange flex items-center gap-1 font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Long Description
                        </button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs whitespace-pre-wrap text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
                        {item.longDescription}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
