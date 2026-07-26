"use client";

import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  Download,
  FolderArchive,
  RefreshCw,
  Info,
  CheckCircle,
  Plus,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface GeneratedImage {
  name: string;
  url: string;
}

export default function GalleryPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Attributes
  const [productName, setProductName] = useState("");
  const [sizeWeightLabel, setSizeWeightLabel] = useState("3LB / Standard Pack");
  const [topLeftBadgeText, setTopLeftBadgeText] = useState("");
  const [topRightBadgeText, setTopRightBadgeText] = useState("3LB / Standard Pack");
  const [featureCalloutsTitle, setFeatureCalloutsTitle] = useState("Key Product Features");
  const [dimensionsText, setDimensionsText] = useState('6.3" x 2.7"');
  const [heightText, setHeightText] = useState('6.3"');
  const [widthText, setWidthText] = useState('2.7"');
  const [depthText, setDepthText] = useState('');
  const [dimensionsTitle, setDimensionsTitle] = useState('Product Dimensions & Size');
  const [callouts, setCallouts] = useState<string[]>([
    "Ergonomic Comfort Fit",
    "High-Performance Chipset",
    "Durable Weatherproof Finish",
    "Universal Compatibility",
  ]);

  // Live Preview selector tab
  const [previewSlide, setPreviewSlide] = useState<"hero" | "callouts" | "dimensions" | "grid" | "trust">("hero");

  // Logo Overlay state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<
    "Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "None"
  >("None");

  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedGalleries, setSavedGalleries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generator" | "history">("generator");

  // Logo file handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
      toast.error("Logo must be PNG, JPG, or WebP image.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    if (logoPosition === "None") {
      setLogoPosition("Top-Left");
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoPosition("None");
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of incoming) {
      if (selectedFiles.length + validFiles.length >= 4) {
        toast.error("Maximum 4 photos allowed.");
        break;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds max size of 8MB.`);
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
        toast.error(`File "${file.name}" must be JPG, PNG, or WebP format.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
    setPreviews([...previews, ...validPreviews]);
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  // Callout list helpers
  const handleCalloutChange = (index: number, val: string) => {
    const next = [...callouts];
    next[index] = val;
    setCallouts(next);
  };

  const handleAddCallout = () => {
    if (callouts.length < 5) {
      setCallouts([...callouts, ""]);
    }
  };

  const handleRemoveCallout = (index: number) => {
    if (callouts.length > 2) {
      setCallouts(callouts.filter((_, i) => i !== index));
    }
  };

  // Submit Generation
  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please upload at least 1 product photo.");
      return;
    }

    setLoading(true);
    setGeneratedImages([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });

      formData.append("productName", productName || "Premium Product");
      formData.append("sizeWeightLabel", topRightBadgeText || sizeWeightLabel || "Standard Pack");
      formData.append("topLeftBadgeText", topLeftBadgeText);
      formData.append("topRightBadgeText", topRightBadgeText);
      formData.append("featureCalloutsTitle", featureCalloutsTitle || "Key Product Features");
      formData.append("dimensionsText", dimensionsText || `${heightText} x ${widthText}`);
      formData.append("heightText", heightText);
      formData.append("widthText", widthText);
      formData.append("depthText", depthText);
      formData.append("dimensionsTitle", dimensionsTitle || "Product Dimensions & Size");
      formData.append("logoPosition", logoPosition);
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("featureCallouts", JSON.stringify(callouts.filter((c) => c.trim().length > 0)));

      const res = await fetch("/api/gallery/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate gallery slides.");
      }

      setGeneratedImages(data.generatedImages || []);
      toast.success("8 E-Commerce Gallery Slides Generated!");
      fetchSavedGalleries();
    } catch (err: any) {
      console.error("Gallery generation error:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Download single image via server-side proxy (bypasses browser CORS)
  const downloadSingleImage = (url: string, filename: string) => {
    try {
      const proxyUrl = `/api/gallery/download?mode=single&url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      window.open(proxyUrl, "_blank");
      toast.success(`Downloading ${filename}...`);
    } catch (e) {
      toast.error("Could not download image.");
    }
  };

  // Download all as ZIP via server-side proxy (bypasses browser CORS)
  const downloadAllAsZip = () => {
    if (generatedImages.length === 0) return;
    toast.info("Preparing ZIP archive of all 8 gallery slides...");

    try {
      const proxyUrl = `/api/gallery/download?mode=zip&urls=${encodeURIComponent(
        JSON.stringify(generatedImages)
      )}&productName=${encodeURIComponent(productName || "Daraz-Product")}`;
      window.open(proxyUrl, "_blank");
    } catch (err) {
      console.error("ZIP creation error:", err);
      toast.error("Failed to create ZIP file.");
    }
  };

  // Fetch saved galleries
  const fetchSavedGalleries = async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (data.success) {
        setSavedGalleries(data.galleries || []);
      }
    } catch (e) {
      console.error("Fetch galleries error:", e);
    }
  };

  useEffect(() => {
    fetchSavedGalleries();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-daraz-orange" />
            Product Gallery Image Generator
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Upload 1 to 3 real photos of your item. Our server-side engine will composite 8 square 1:1 e-commerce gallery slides with specifications, dimensions, callouts, and trust badges.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              activeTab === "generator" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              activeTab === "history" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Saved Galleries ({savedGalleries.length})
          </button>
        </div>
      </div>

      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Upload Box */}
            <div className="card-daraz space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Upload Product Photos ({selectedFiles.length}/4)
              </span>

              {/* Upload Dropzone */}
              {selectedFiles.length < 4 && (
                <label className="border-2 border-dashed border-slate-300 hover:border-daraz-orange rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/40 transition-colors">
                  <Upload className="w-8 h-8 text-daraz-orange mb-2" />
                  <span className="text-xs font-bold text-slate-800">
                    Click to upload product photos (1–4 angles)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    JPG, PNG, or WebP • Max 8MB each
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Thumbnail Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square">
                      <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Attributes */}
            <div className="card-daraz space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                2. Product Overlay Attributes
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Title / Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Wireless Earbuds F9 Edition"
                    className="input-daraz"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Top-Left Badge Text
                    </label>
                    <input
                      type="text"
                      value={topLeftBadgeText}
                      onChange={(e) => setTopLeftBadgeText(e.target.value)}
                      placeholder="e.g. OFFICIAL BRAND (Empty = None)"
                      className="input-daraz"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Top-Right Badge Text
                    </label>
                    <input
                      type="text"
                      value={topRightBadgeText}
                      onChange={(e) => {
                        setTopRightBadgeText(e.target.value);
                        setSizeWeightLabel(e.target.value);
                      }}
                      placeholder="e.g. 3LB / Standard Pack"
                      className="input-daraz"
                    />
                  </div>
                </div>

                {/* Custom Logo Upload & Placement */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Custom Logo Overlay (Optional)
                  </span>

                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <div className="relative w-14 h-14 bg-white rounded border overflow-hidden shrink-0">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          title="Remove logo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5 text-daraz-orange" />
                        Upload Logo (PNG/JPG, max 2MB)
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Logo Position Corner
                      </label>
                      <select
                        value={logoPosition}
                        onChange={(e) => setLogoPosition(e.target.value as any)}
                        className="input-daraz py-1 text-xs"
                      >
                        <option value="None">None (No Logo)</option>
                        <option value="Top-Left">Top-Left Corner</option>
                        <option value="Top-Right">Top-Right Corner</option>
                        <option value="Bottom-Left">Bottom-Left Corner</option>
                        <option value="Bottom-Right">Bottom-Right Corner</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Feature Callouts Slide Title
                  </label>
                  <input
                    type="text"
                    value={featureCalloutsTitle}
                    onChange={(e) => setFeatureCalloutsTitle(e.target.value)}
                    placeholder="Key Product Features"
                    className="input-daraz"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Product Dimensions (Slide #3)
                    </span>
                    <span className="text-[10px] text-slate-400">Separate Height & Width</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dimensions Slide Title Header
                    </label>
                    <input
                      type="text"
                      value={dimensionsTitle}
                      onChange={(e) => setDimensionsTitle(e.target.value)}
                      placeholder="Product Dimensions & Size"
                      className="input-daraz py-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Height (Vertical)
                      </label>
                      <input
                        type="text"
                        value={heightText}
                        onChange={(e) => setHeightText(e.target.value)}
                        placeholder='e.g. 6.3"'
                        className="input-daraz py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Width (Horizontal)
                      </label>
                      <input
                        type="text"
                        value={widthText}
                        onChange={(e) => setWidthText(e.target.value)}
                        placeholder='e.g. 2.7"'
                        className="input-daraz py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Depth (Optional)
                      </label>
                      <input
                        type="text"
                        value={depthText}
                        onChange={(e) => setDepthText(e.target.value)}
                        placeholder='e.g. 1.2"'
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Callouts List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Feature Callouts (3–5 points)
                    </label>
                    <span className="text-[10px] text-slate-400">Overlay on slide #2</span>
                  </div>

                  {callouts.map((callout, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={callout}
                        onChange={(e) => handleCalloutChange(idx, e.target.value)}
                        placeholder={`Callout point #${idx + 1}`}
                        className="input-daraz py-1.5 text-xs"
                      />
                      {callouts.length > 2 && (
                        <button
                          onClick={() => handleRemoveCallout(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {callouts.length < 5 && (
                    <button
                      onClick={handleAddCallout}
                      className="text-xs text-daraz-orange hover:text-daraz-orange-hover font-semibold flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Callout Point
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || selectedFiles.length === 0}
                className="w-full btn-primary py-3 text-sm font-bold shadow-md shadow-daraz-orange/20 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Compositing 8 Gallery Slides...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Gallery (8 Slides)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Display Column */}
          <div className="lg:col-span-7 space-y-6">
            {loading && (
              <div className="card-daraz py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-daraz-orange flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Generating Gallery Composites...</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Building 8 1200x1200px Daraz square slides with text overlays and measurement arrows
                  </p>
                </div>
              </div>
            )}

            {!loading && generatedImages.length === 0 && (
              <div className="card-daraz space-y-4">
                {/* Header & Disclaimer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-daraz-orange" />
                      Live Layout Preview
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Client-side preview — final generated image may differ slightly in styling
                    </p>
                  </div>

                  {/* Slide selector tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg self-start text-[11px]">
                    <button
                      onClick={() => setPreviewSlide("hero")}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "hero" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Hero
                    </button>
                    <button
                      onClick={() => setPreviewSlide("callouts")}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "callouts" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Callouts
                    </button>
                    <button
                      onClick={() => setPreviewSlide("dimensions")}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "dimensions" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Dimensions
                    </button>
                    <button
                      onClick={() => setPreviewSlide("grid")}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setPreviewSlide("trust")}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "trust" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Trust
                    </button>
                  </div>
                </div>

                {/* 1:1 Aspect Ratio Live Preview Canvas Container */}
                <div className="aspect-square w-full max-w-[520px] mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col justify-between select-none">
                  {/* SLIDE 1: HERO PREVIEW */}
                  {previewSlide === "hero" && (
                    <div className="w-full h-full relative bg-gradient-to-b from-white to-slate-50 p-6 flex flex-col justify-between">
                      {/* Top Badges / Logo */}
                      <div className="flex items-start justify-between w-full relative z-10">
                        {/* Top-Left Badge */}
                        {topLeftBadgeText && logoPosition !== "Top-Left" ? (
                          <span className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs">
                            {topLeftBadgeText}
                          </span>
                        ) : logoPreview && logoPosition === "Top-Left" ? (
                          <img src={logoPreview} alt="Logo" className="w-16 h-10 object-contain" />
                        ) : (
                          <div />
                        )}

                        {/* Top-Right Badge */}
                        {topRightBadgeText && logoPosition !== "Top-Right" ? (
                          <span className="px-3.5 py-1.5 bg-daraz-orange text-white font-bold text-xs rounded-full shadow-xs">
                            {topRightBadgeText}
                          </span>
                        ) : logoPreview && logoPosition === "Top-Right" ? (
                          <img src={logoPreview} alt="Logo" className="w-16 h-10 object-contain" />
                        ) : (
                          <div />
                        )}
                      </div>

                      {/* Center Product Image */}
                      <div className="flex-1 flex items-center justify-center my-2 relative">
                        {previews[0] ? (
                          <img src={previews[0]} alt="Hero preview" className="max-h-[70%] max-w-[80%] object-contain" />
                        ) : (
                          <div className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                            <span className="text-xs font-semibold">Upload Photo</span>
                          </div>
                        )}

                        {/* Bottom Corners Logos if configured */}
                        {logoPreview && logoPosition === "Bottom-Left" && (
                          <img src={logoPreview} alt="Logo" className="absolute bottom-2 left-2 w-16 h-10 object-contain" />
                        )}
                        {logoPreview && logoPosition === "Bottom-Right" && (
                          <img src={logoPreview} alt="Logo" className="absolute bottom-2 right-2 w-16 h-10 object-contain" />
                        )}
                      </div>

                      {/* Bottom Footer Banner */}
                      <div className="bg-slate-900 text-white p-3 text-center -mx-6 -mb-6">
                        <p className="font-bold text-sm truncate px-2">
                          {productName || "YOUR PRODUCT TITLE OVERLAY"}
                        </p>
                        <p className="text-[10px] text-daraz-orange font-bold uppercase tracking-wider mt-0.5">
                          PREMIUM QUALITY • ORIGINAL PRODUCT
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 2: FEATURE CALLOUTS PREVIEW */}
                  {previewSlide === "callouts" && (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col justify-between">
                      <div className="bg-daraz-orange text-white p-3 text-center font-bold text-sm tracking-wide">
                        {featureCalloutsTitle ? featureCalloutsTitle.toUpperCase() : "KEY PRODUCT FEATURES"}
                      </div>

                      <div className="flex-1 p-4 relative flex items-center justify-center">
                        {/* Center Photo */}
                        {previews[0] ? (
                          <img src={previews[0]} alt="Product" className="w-36 h-36 object-contain z-10" />
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold z-10 shadow-xs">
                            Product
                          </div>
                        )}

                        {/* Render Callout Cards Overlay */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-around pointer-events-none">
                          {callouts.map((text, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1.5 ${
                                idx % 2 === 0 ? "self-start" : "self-end"
                              }`}
                            >
                              <div className="bg-white border-2 border-daraz-orange px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 shadow-xs max-w-[150px]">
                                {text || `Callout #${idx + 1}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 3: DIMENSIONS PREVIEW */}
                  {previewSlide === "dimensions" && (
                    <div className="w-full h-full relative bg-white flex flex-col justify-between">
                      <div className="bg-slate-900 text-white p-3 text-center font-bold text-sm tracking-wide">
                        {dimensionsTitle ? dimensionsTitle.toUpperCase() : "PRODUCT DIMENSIONS & SIZE"}
                      </div>

                      <div className="flex-1 p-8 relative flex items-center justify-center">
                        {/* Depth badge if present */}
                        {depthText && (
                          <div className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-daraz-orange">
                            DEPTH: {depthText}
                          </div>
                        )}

                        {/* Height vertical line */}
                        {heightText && (
                          <div className="absolute left-6 top-10 bottom-10 flex flex-col items-center justify-center">
                            <div className="w-0.5 flex-1 bg-daraz-orange" />
                            <span className="my-1 px-1.5 py-0.5 bg-daraz-orange text-white text-[10px] font-bold rounded -rotate-90">
                              {heightText}
                            </span>
                            <div className="w-0.5 flex-1 bg-daraz-orange" />
                          </div>
                        )}

                        {/* Product Photo */}
                        {previews[0] ? (
                          <img src={previews[0]} alt="Product" className="max-h-[65%] max-w-[65%] object-contain" />
                        ) : (
                          <div className="w-36 h-36 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                            Product
                          </div>
                        )}

                        {/* Width horizontal line */}
                        {widthText && (
                          <div className="absolute bottom-4 left-12 right-12 flex items-center justify-center">
                            <div className="h-0.5 flex-1 bg-daraz-orange" />
                            <span className="mx-1 px-2 py-0.5 bg-daraz-orange text-white text-[10px] font-bold rounded">
                              {widthText}
                            </span>
                            <div className="h-0.5 flex-1 bg-daraz-orange" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SLIDE 4: SHOWCASE GRID PREVIEW */}
                  {previewSlide === "grid" && (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col justify-between p-3">
                      <div className="bg-daraz-orange text-white p-2 rounded text-center font-bold text-xs">
                        MULTI-ANGLE SHOWCASE
                      </div>
                      <div className="grid grid-cols-2 gap-2 flex-1 my-2">
                        {[0, 1, 2, 0].map((imgIdx, i) => (
                          <div key={i} className="bg-white rounded-lg border border-slate-200 p-1 flex flex-col items-center justify-center">
                            {previews[imgIdx] ? (
                              <img src={previews[imgIdx]} alt={`Angle ${i}`} className="w-full h-20 object-contain" />
                            ) : (
                              <div className="text-[10px] text-slate-400 font-semibold">Angle #{i + 1}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SLIDE 8: SELLER PROTECTION PREVIEW */}
                  {previewSlide === "trust" && (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col justify-between">
                      <div className="bg-slate-900 text-white p-3 text-center font-bold text-xs truncate">
                        {productName || "YOUR PRODUCT TITLE OVERLAY"}
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4">
                        {previews[0] ? (
                          <img src={previews[0]} alt="Product" className="h-32 object-contain" />
                        ) : (
                          <div className="w-28 h-28 bg-white border rounded-xl flex items-center justify-center text-slate-400 text-xs">
                            Product
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-3 bg-white border-t border-slate-200">
                        <div className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                          <span className="text-amber-500 font-bold text-xs block">★</span>
                          <span className="text-[9px] font-bold text-slate-800">Quality Tested</span>
                        </div>
                        <div className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                          <span className="text-slate-800 font-bold text-xs block">⚡</span>
                          <span className="text-[9px] font-bold text-slate-800">Fast Shipping</span>
                        </div>
                        <div className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                          <span className="text-emerald-600 font-bold text-xs block">✓</span>
                          <span className="text-[9px] font-bold text-slate-800">Protection</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && generatedImages.length > 0 && (
              <div className="space-y-6">
                {/* Header Action Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    8 Gallery Slides Ready
                  </div>
                  <button
                    onClick={downloadAllAsZip}
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    <FolderArchive className="w-4 h-4" />
                    Download All as ZIP
                  </button>
                </div>

                {/* Slides Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-2 p-3">
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Slide #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[160px]">
                          {img.name}
                        </span>
                        <button
                          onClick={() => downloadSingleImage(img.url, img.name)}
                          className="btn-secondary text-[11px] py-1 px-2.5"
                          title="Download single slide"
                        >
                          <Download className="w-3.5 h-3.5 text-daraz-orange" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {savedGalleries.length === 0 ? (
            <div className="card-daraz py-16 text-center text-slate-500 text-sm">
              No saved galleries found. Generate a gallery above to view it in history.
            </div>
          ) : (
            <div className="space-y-4">
              {savedGalleries.map((gal) => (
                <div key={gal.id} className="card-daraz space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm">{gal.productName}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(gal.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {gal.generatedImageKeys?.map((url: string, idx: number) => (
                      <div key={idx} className="aspect-square bg-slate-100 rounded border overflow-hidden">
                        <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
