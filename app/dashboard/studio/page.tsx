"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wand2,
  Upload,
  Sparkles,
  Download,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sliders,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_OPTIONS, BackgroundPreset } from "@/lib/studio-types";

export default function StudioPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [mode, setMode] = useState<"bg_replace" | "enhance">("bg_replace");
  const [selectedPreset, setSelectedPreset] = useState<BackgroundPreset>("white_studio");

  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo exceeds maximum size limit of 8MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
      toast.error("File must be JPG, PNG, or WebP image format.");
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setResultUrl(null);
    setErrorMessage(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Please upload a product photo first.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("mode", mode);
      formData.append("preset", selectedPreset);

      const res = await fetch("/api/studio/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image in AI Product Studio.");
      }

      setResultUrl(data.imageUrl);
      toast.success(
        mode === "bg_replace"
          ? "Background scene replaced cleanly while keeping product 100% intact!"
          : "Photo lighting and sharpness enhanced successfully!"
      );
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseInGallery = () => {
    router.push("/dashboard/gallery");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-daraz-orange">
              <Wand2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              AI Product Studio
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-1.5 max-w-2xl">
            Cleanly swap product backgrounds onto realistic scenes or enhance photo lighting & clarity — with a <strong className="text-slate-800">100% guarantee</strong> that your product pixels, shape, color, and branding remain untouched.
          </p>
        </div>

        {/* Pixel Faithful Guarantee Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold self-start md:self-auto shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pixel-Faithful Guarantee (No Product Alteration)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Step 1: Upload Product Photo */}
          <div className="card-daraz space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Upload Real Product Photo
            </span>

            <label className="border-2 border-dashed border-slate-300 hover:border-daraz-orange rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/40 transition-colors">
              <Upload className="w-8 h-8 text-daraz-orange mb-2" />
              <span className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Click or drag to upload product photo"}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                JPG, PNG, or WebP • Max 8MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {filePreview && (
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-lg bg-white border overflow-hidden shrink-0">
                  <img src={filePreview} alt="Upload preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800 truncate">{selectedFile?.name}</p>
                  <p className="text-slate-500 text-[11px]">
                    {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Mode & Studio Preset Selection */}
          <div className="card-daraz space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Select Studio Processing Mode
            </span>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("bg_replace")}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === "bg_replace"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4 text-daraz-orange" />
                Background Scene
              </button>

              <button
                type="button"
                onClick={() => setMode("enhance")}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === "enhance"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-4 h-4 text-daraz-orange" />
                Photo Enhancement
              </button>
            </div>

            {/* Mode A: Presets list */}
            {mode === "bg_replace" && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Background Preset Scene
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPreset(opt.id)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
                        selectedPreset === opt.id
                          ? "border-daraz-orange bg-orange-50/50 ring-2 ring-daraz-orange/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                        <p className="text-[11px] text-slate-500">{opt.description}</p>
                      </div>
                      <div
                        className="w-7 h-7 rounded-lg border border-slate-300 shrink-0 shadow-xs"
                        style={{ background: opt.color }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode B: Photo Enhancement info */}
            {mode === "enhance" && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-daraz-orange" />
                  Auto Lighting, Contrast & Level Correction
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Applies server-side color level correction, contrast enhancement, sharpening, and white balance optimization directly to your product photo.
                </p>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              onClick={handleProcess}
              disabled={loading || !selectedFile}
              className="w-full btn-primary py-3 text-sm font-bold shadow-md shadow-daraz-orange/20 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {mode === "bg_replace" ? "Isolating & Compositing Scene..." : "Enhancing Lighting & Sharpness..."}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {mode === "bg_replace" ? "Replace Background (Preserve Product)" : "Enhance Photo Clarity"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Result Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Error Alert Box */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                Processing Failed
              </div>
              <p className="text-xs text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Result Card */}
          <div className="card-daraz space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-daraz-orange" />
                Studio Result Preview
              </h3>
              {resultUrl && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <div className="aspect-square w-full max-w-[480px] mx-auto bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-xs flex items-center justify-center">
              {loading ? (
                <div className="text-center p-6 space-y-3">
                  <RefreshCw className="w-8 h-8 text-daraz-orange animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Processing in Studio...</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    {mode === "bg_replace"
                      ? "Isolating subject pixels & placing onto preset scene background..."
                      : "Refining contrast, white balance & sharpening..."}
                  </p>
                </div>
              ) : resultUrl ? (
                <img src={resultUrl} alt="Studio output" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-8 text-slate-400 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-xs font-semibold">No result generated yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Upload a product photo and select a mode to create high-converting marketplace product images.
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {resultUrl && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="studio_product.jpg"
                  className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Result
                </a>

                <button
                  onClick={handleUseInGallery}
                  className="btn-outline py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  Use in Gallery Generator <ArrowRight className="w-4 h-4 text-daraz-orange" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
