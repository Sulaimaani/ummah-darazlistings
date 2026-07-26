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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface GeneratedImage {
  name: string;
  url: string;
}

interface BenefitItem {
  title: string;
  description: string;
}

type SlideKey = "hero" | "callouts" | "dimensions" | "grid" | "versatility" | "benefits" | "package" | "trust";

type SingleImageSlideKey = Exclude<SlideKey, "grid">;

interface SlideImageOverride {
  source: "pool" | "custom";
  poolIndex: number;
  customFile?: File;
  customPreview?: string;
}

export default function GalleryPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Accordion Section & Live Preview Active Tab Sync
  const [openSection, setOpenSection] = useState<SlideKey>("hero");
  const [previewSlide, setPreviewSlide] = useState<SlideKey>("hero");

  const activateSection = (key: SlideKey) => {
    setOpenSection(key);
    setPreviewSlide(key);
  };

  // Slide 1: Hero Attributes
  const [productName, setProductName] = useState("");
  const [sizeWeightLabel, setSizeWeightLabel] = useState("3LB / Standard Pack");
  const [topLeftBadgeText, setTopLeftBadgeText] = useState("");
  const [topRightBadgeText, setTopRightBadgeText] = useState("3LB / Standard Pack");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<
    "Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "None"
  >("None");

  // Slide 2: Feature Callouts Attributes
  const [featureCalloutsTitle, setFeatureCalloutsTitle] = useState("Key Product Features");
  const [callouts, setCallouts] = useState<string[]>([
    "Ergonomic Comfort Fit",
    "High-Performance Build",
    "Durable Finish",
    "Universal Compatibility",
  ]);

  // Slide 3: Product Dimensions Attributes
  const [dimensionsTitle, setDimensionsTitle] = useState("Product Dimensions & Size");
  const [heightText, setHeightText] = useState('6.3"');
  const [widthText, setWidthText] = useState('2.7"');
  const [depthText, setDepthText] = useState('');

  // Slide 4: Multi-Angle Showcase Attributes
  const [multiAngleTitle, setMultiAngleTitle] = useState("Multi-Angle Showcase");

  // Slide 5: Versatility Banner Attributes
  const [versatilityPill, setVersatilityPill] = useState("");
  const [versatilityTitle, setVersatilityTitle] = useState("");
  const [versatilitySubheadline, setVersatilitySubheadline] = useState("");
  const [versatilityBullets, setVersatilityBullets] = useState<string[]>(["", "", ""]);

  // Slide 6: Product Benefits Attributes
  const [benefitsTitle, setBenefitsTitle] = useState("WHY CHOOSE THIS PRODUCT?");
  const [benefitsList, setBenefitsList] = useState<BenefitItem[]>([
    { title: "", description: "" },
    { title: "", description: "" },
  ]);

  // Slide 7: Package Contents Attributes
  const [packageTitle, setPackageTitle] = useState("WHAT IS IN THE PACKAGE?");
  const [packageListTitle, setPackageListTitle] = useState("Package Contents List:");
  const [packageContents, setPackageContents] = useState<string[]>([""]);

  // Slide 8: Seller Trust Closing Attributes
  const [closingTitle, setClosingTitle] = useState("PREMIUM QUALITY GUARANTEED");

  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedGalleries, setSavedGalleries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generator" | "history">("generator");

  // Per-slide image override state
  const defaultSlideImages: Record<SingleImageSlideKey, SlideImageOverride> = {
    hero: { source: "pool", poolIndex: 0 },
    callouts: { source: "pool", poolIndex: 0 },
    dimensions: { source: "pool", poolIndex: 0 },
    versatility: { source: "pool", poolIndex: 0 },
    benefits: { source: "pool", poolIndex: 0 },
    package: { source: "pool", poolIndex: 0 },
    trust: { source: "pool", poolIndex: 0 },
  };
  const [slideImages, setSlideImages] = useState<Record<SingleImageSlideKey, SlideImageOverride>>(defaultSlideImages);

  // Helper: get the preview URL for a given slide (respects per-slide override)
  const getSlidePreview = (key: SingleImageSlideKey): string | undefined => {
    const override = slideImages[key];
    if (override?.source === "custom" && override.customPreview) return override.customPreview;
    return previews[override?.poolIndex ?? 0];
  };

  const setSlidePool = (key: SingleImageSlideKey, poolIndex: number) => {
    setSlideImages(prev => ({ ...prev, [key]: { source: "pool", poolIndex } }));
  };

  const setSlideCustom = (key: SingleImageSlideKey, file: File) => {
    const preview = URL.createObjectURL(file);
    setSlideImages(prev => ({
      ...prev,
      [key]: { source: "custom", poolIndex: 0, customFile: file, customPreview: preview },
    }));
  };

  const clearSlideOverride = (key: SingleImageSlideKey) => {
    setSlideImages(prev => ({ ...prev, [key]: { source: "pool", poolIndex: 0 } }));
  };

  // Reusable per-slide image picker UI
  const renderSlideImagePicker = (slideKey: SingleImageSlideKey) => {
    const override = slideImages[slideKey];
    const isCustom = override.source === "custom" && override.customPreview;

    return (
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-700">Image for this Slide</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Thumbnail pool picker */}
          {previews.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlidePool(slideKey, idx)}
              className={`w-10 h-10 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                !isCustom && override.poolIndex === idx
                  ? "border-daraz-orange ring-2 ring-daraz-orange/30 scale-105"
                  : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
              }`}
              title={`Use uploaded photo #${idx + 1}`}
            >
              <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}

          {/* Custom upload button */}
          {isCustom ? (
            <div className="relative w-10 h-10 rounded-lg border-2 border-emerald-500 ring-2 ring-emerald-400/30 overflow-hidden shrink-0">
              <img src={override.customPreview!} alt="Custom" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => clearSlideOverride(slideKey)}
                className="absolute -top-0.5 -right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                title="Remove custom image"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <label
              className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-daraz-orange flex items-center justify-center cursor-pointer bg-slate-50 hover:bg-orange-50/40 transition-colors shrink-0"
              title="Upload a different image for this slide"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 8 * 1024 * 1024) { toast.error("Max 8MB per image."); return; }
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("JPG, PNG, or WebP only."); return; }
                  setSlideCustom(slideKey, file);
                }}
              />
            </label>
          )}
        </div>
        {isCustom && (
          <span className="text-[10px] text-emerald-600 font-semibold">✓ Using custom image for this slide</span>
        )}
        {!isCustom && override.poolIndex > 0 && (
          <span className="text-[10px] text-daraz-orange font-semibold">Using uploaded photo #{override.poolIndex + 1}</span>
        )}
      </div>
    );
  };

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

  // File selection handler (1 to 4 photos)
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

  const handleRemovePhoto = (index: number) => {
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  // Helper arrays update functions
  const updateCallout = (index: number, val: string) => {
    const next = [...callouts];
    next[index] = val;
    setCallouts(next);
  };
  const addCallout = () => {
    if (callouts.length < 5) setCallouts([...callouts, ""]);
  };
  const removeCallout = (index: number) => {
    if (callouts.length > 1) setCallouts(callouts.filter((_, i) => i !== index));
  };

  const updateVersatilityBullet = (index: number, val: string) => {
    const next = [...versatilityBullets];
    next[index] = val;
    setVersatilityBullets(next);
  };

  const updateBenefit = (index: number, field: "title" | "description", val: string) => {
    const next = [...benefitsList];
    next[index] = { ...next[index], [field]: val };
    setBenefitsList(next);
  };
  const addBenefit = () => {
    if (benefitsList.length < 4) setBenefitsList([...benefitsList, { title: "", description: "" }]);
  };
  const removeBenefit = (index: number) => {
    if (benefitsList.length > 1) setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  const updatePackageItem = (index: number, val: string) => {
    const next = [...packageContents];
    next[index] = val;
    setPackageContents(next);
  };
  const addPackageItem = () => {
    if (packageContents.length < 6) setPackageContents([...packageContents, ""]);
  };
  const removePackageItem = (index: number) => {
    if (packageContents.length > 1) setPackageContents(packageContents.filter((_, i) => i !== index));
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
      formData.append("heightText", heightText);
      formData.append("widthText", widthText);
      formData.append("depthText", depthText);
      formData.append("dimensionsTitle", dimensionsTitle || "Product Dimensions & Size");
      formData.append("multiAngleTitle", multiAngleTitle || "Multi-Angle Showcase");

      formData.append("versatilityPill", versatilityPill);
      formData.append("versatilityTitle", versatilityTitle);
      formData.append("versatilitySubheadline", versatilitySubheadline);
      formData.append("versatilityBullets", JSON.stringify(versatilityBullets.filter(b => b.trim())));

      formData.append("benefitsTitle", benefitsTitle || "WHY CHOOSE THIS PRODUCT?");
      formData.append("benefitsList", JSON.stringify(benefitsList.filter(b => b.title.trim())));

      formData.append("packageTitle", packageTitle || "WHAT IS IN THE PACKAGE?");
      formData.append("packageListTitle", packageListTitle || "Package Contents List:");
      formData.append("packageContents", JSON.stringify(packageContents.filter(p => p.trim())));

      formData.append("closingTitle", closingTitle || "PREMIUM QUALITY GUARANTEED");
      formData.append("logoPosition", logoPosition);
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("featureCallouts", JSON.stringify(callouts.filter(c => c.trim())));

      // Append per-slide image overrides
      const singleSlideKeys: SingleImageSlideKey[] = ["hero", "callouts", "dimensions", "versatility", "benefits", "package", "trust"];
      for (const slideKey of singleSlideKeys) {
        const override = slideImages[slideKey];
        if (override.source === "custom" && override.customFile) {
          formData.append(`slideImage_${slideKey}`, override.customFile);
        } else if (override.source === "pool" && override.poolIndex > 0) {
          formData.append(`slideImagePool_${slideKey}`, override.poolIndex.toString());
        }
      }

      const res = await fetch("/api/gallery/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate product gallery.");
      }

      setGeneratedImages(data.generatedImages || []);
      toast.success("Product gallery with 8 slides generated successfully!");
      fetchSavedGalleries();
    } catch (err: any) {
      toast.error(err.message || "Could not generate product gallery.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Saved History
  const fetchSavedGalleries = async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (res.ok) {
        setSavedGalleries(data.galleries || []);
      }
    } catch (e) {
      console.error("Failed to fetch saved galleries:", e);
    }
  };

  useEffect(() => {
    fetchSavedGalleries();
  }, []);

  // Download Handlers
  const downloadSingleImage = (url: string, name: string) => {
    const proxyUrl = `/api/gallery/download?mode=single&url=${encodeURIComponent(url)}&filename=${encodeURIComponent(name)}`;
    window.location.href = proxyUrl;
  };

  const downloadAllAsZip = () => {
    if (!generatedImages || generatedImages.length === 0) return;
    const urlsJson = JSON.stringify(generatedImages);
    const proxyUrl = `/api/gallery/download?mode=zip&urls=${encodeURIComponent(urlsJson)}&productName=${encodeURIComponent(productName || "Daraz_Product")}`;
    window.location.href = proxyUrl;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-daraz-orange" />
            Product Gallery Image Generator
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-xl">
            Composites up to 4 real product photos into 8 high-converting, 1200x1200px Daraz marketplace gallery slides with text overlays and measurement arrows.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "generator" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Gallery Studio
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "history" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
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

            {/* Per-Slide Accordion Form */}
            <div className="card-daraz space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                2. Per-Slide Customization Sections
              </span>

              {/* Accordion 1: Hero Main Photo */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("hero")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "hero" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #1: Hero Main Photo</span>
                  {openSection === "hero" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "hero" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product Title Overlay</label>
                      <input
                        type="text"
                        value={productName}
                        onFocus={() => activateSection("hero")}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Wireless Earbuds F9 Edition"
                        className="input-daraz py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Top-Left Badge</label>
                        <input
                          type="text"
                          value={topLeftBadgeText}
                          onFocus={() => activateSection("hero")}
                          onChange={(e) => setTopLeftBadgeText(e.target.value)}
                          placeholder="e.g. OFFICIAL STORE"
                          className="input-daraz py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Top-Right Badge</label>
                        <input
                          type="text"
                          value={topRightBadgeText}
                          onFocus={() => activateSection("hero")}
                          onChange={(e) => setTopRightBadgeText(e.target.value)}
                          placeholder="e.g. 3LB / Standard Pack"
                          className="input-daraz py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                      {logoPreview ? (
                        <div className="relative w-12 h-12 bg-white rounded border overflow-hidden shrink-0">
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                          <button onClick={handleRemoveLogo} className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="px-2.5 py-1.5 border border-dashed border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 cursor-pointer flex items-center gap-1 shrink-0">
                          <Upload className="w-3 h-3 text-daraz-orange" />
                          Logo (PNG/JPG)
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="hidden" />
                        </label>
                      )}
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Logo Position Corner</label>
                        <select
                          value={logoPosition}
                          onFocus={() => activateSection("hero")}
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
                    {renderSlideImagePicker("hero")}
                  </div>
                )}
              </div>

              {/* Accordion 2: Feature Callouts */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("callouts")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "callouts" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #2: Feature Callouts</span>
                  {openSection === "callouts" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "callouts" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Slide Title</label>
                      <input
                        type="text"
                        value={featureCalloutsTitle}
                        onFocus={() => activateSection("callouts")}
                        onChange={(e) => setFeatureCalloutsTitle(e.target.value)}
                        placeholder="Key Product Features"
                        className="input-daraz py-1.5 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">Callouts List (1–5 Points)</label>
                      {callouts.map((text, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={text}
                            onFocus={() => activateSection("callouts")}
                            onChange={(e) => updateCallout(idx, e.target.value)}
                            placeholder={`Callout Point #${idx + 1}`}
                            className="input-daraz py-1 text-xs"
                          />
                          {callouts.length > 1 && (
                            <button onClick={() => removeCallout(idx)} className="p-1 text-slate-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {callouts.length < 5 && (
                        <button onClick={addCallout} className="text-[11px] text-daraz-orange font-bold flex items-center gap-1 pt-1">
                          <Plus className="w-3 h-3" /> Add Callout
                        </button>
                      )}
                    </div>
                    {renderSlideImagePicker("callouts")}
                  </div>
                )}
              </div>

              {/* Accordion 3: Product Dimensions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("dimensions")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "dimensions" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #3: Product Dimensions</span>
                  {openSection === "dimensions" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "dimensions" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Header Title</label>
                      <input
                        type="text"
                        value={dimensionsTitle}
                        onFocus={() => activateSection("dimensions")}
                        onChange={(e) => setDimensionsTitle(e.target.value)}
                        placeholder="Product Dimensions & Size"
                        className="input-daraz py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Height (Vertical)</label>
                        <input
                          type="text"
                          value={heightText}
                          onFocus={() => activateSection("dimensions")}
                          onChange={(e) => setHeightText(e.target.value)}
                          placeholder='e.g. 6.3"'
                          className="input-daraz py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Width (Horizontal)</label>
                        <input
                          type="text"
                          value={widthText}
                          onFocus={() => activateSection("dimensions")}
                          onChange={(e) => setWidthText(e.target.value)}
                          placeholder='e.g. 2.7"'
                          className="input-daraz py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Depth (Optional)</label>
                        <input
                          type="text"
                          value={depthText}
                          onFocus={() => activateSection("dimensions")}
                          onChange={(e) => setDepthText(e.target.value)}
                          placeholder='e.g. 1.2"'
                          className="input-daraz py-1 text-xs"
                        />
                      </div>
                    </div>
                    {renderSlideImagePicker("dimensions")}
                  </div>
                )}
              </div>

              {/* Accordion 4: Multi-Angle Showcase */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("grid")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "grid" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #4: Multi-Angle Showcase</span>
                  {openSection === "grid" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "grid" && (
                  <div className="p-3.5 space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Header Title</label>
                      <input
                        type="text"
                        value={multiAngleTitle}
                        onFocus={() => activateSection("grid")}
                        onChange={(e) => setMultiAngleTitle(e.target.value)}
                        placeholder="Multi-Angle Showcase"
                        className="input-daraz py-1.5 text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      Displays ONLY real uploaded product photos (1–4) without fabricated caption labels.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 5: Versatility Banner */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("versatility")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "versatility" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #5: Versatility Banner</span>
                  {openSection === "versatility" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "versatility" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Top Pill Badge (Optional)</label>
                      <input
                        type="text"
                        value={versatilityPill}
                        onFocus={() => activateSection("versatility")}
                        onChange={(e) => setVersatilityPill(e.target.value)}
                        placeholder="e.g. VERSATILE USE"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banner Headline</label>
                      <input
                        type="text"
                        value={versatilityTitle}
                        onFocus={() => activateSection("versatility")}
                        onChange={(e) => setVersatilityTitle(e.target.value)}
                        placeholder="e.g. DESIGNED FOR EVERYDAY PERFORMANCE"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banner Subheadline</label>
                      <input
                        type="text"
                        value={versatilitySubheadline}
                        onFocus={() => activateSection("versatility")}
                        onChange={(e) => setVersatilitySubheadline(e.target.value)}
                        placeholder="e.g. Suitable for Home, Office & Travel"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">3 Short Bullet Callouts</label>
                      {versatilityBullets.map((bullet, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={bullet}
                          onFocus={() => activateSection("versatility")}
                          onChange={(e) => updateVersatilityBullet(idx, e.target.value)}
                          placeholder={`Bullet #${idx + 1} (e.g. Easy Operation)`}
                          className="input-daraz py-1 text-xs"
                        />
                      ))}
                    </div>
                    {renderSlideImagePicker("versatility")}
                  </div>
                )}
              </div>

              {/* Accordion 6: Product Benefits */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("benefits")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "benefits" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #6: Product Benefits</span>
                  {openSection === "benefits" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "benefits" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Header Title</label>
                      <input
                        type="text"
                        value={benefitsTitle}
                        onFocus={() => activateSection("benefits")}
                        onChange={(e) => setBenefitsTitle(e.target.value)}
                        placeholder="WHY CHOOSE THIS PRODUCT?"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[11px] font-semibold text-slate-700">Benefit Cards (1–4 Cards)</label>
                      {benefitsList.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700">Benefit #{idx + 1}</span>
                            {benefitsList.length > 1 && (
                              <button onClick={() => removeBenefit(idx)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={item.title}
                            onFocus={() => activateSection("benefits")}
                            onChange={(e) => updateBenefit(idx, "title", e.target.value)}
                            placeholder="Benefit Title (e.g. Ergonomic Fit)"
                            className="input-daraz py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onFocus={() => activateSection("benefits")}
                            onChange={(e) => updateBenefit(idx, "description", e.target.value)}
                            placeholder="Benefit Description (optional)"
                            className="input-daraz py-1 text-xs"
                          />
                        </div>
                      ))}
                      {benefitsList.length < 4 && (
                        <button onClick={addBenefit} className="text-[11px] text-daraz-orange font-bold flex items-center gap-1 pt-1">
                          <Plus className="w-3 h-3" /> Add Benefit Card
                        </button>
                      )}
                    </div>
                    {renderSlideImagePicker("benefits")}
                  </div>
                )}
              </div>

              {/* Accordion 7: Package Contents */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("package")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "package" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #7: Package Contents</span>
                  {openSection === "package" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "package" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Header Title</label>
                      <input
                        type="text"
                        value={packageTitle}
                        onFocus={() => activateSection("package")}
                        onChange={(e) => setPackageTitle(e.target.value)}
                        placeholder="WHAT IS IN THE PACKAGE?"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">List Header</label>
                      <input
                        type="text"
                        value={packageListTitle}
                        onFocus={() => activateSection("package")}
                        onChange={(e) => setPackageListTitle(e.target.value)}
                        placeholder="Package Contents List:"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">Package Items (1–6 Items)</label>
                      {packageContents.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onFocus={() => activateSection("package")}
                            onChange={(e) => updatePackageItem(idx, e.target.value)}
                            placeholder={`e.g. 1x Silicone Spatula`}
                            className="input-daraz py-1 text-xs"
                          />
                          {packageContents.length > 1 && (
                            <button onClick={() => removePackageItem(idx)} className="p-1 text-slate-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {packageContents.length < 6 && (
                        <button onClick={addPackageItem} className="text-[11px] text-daraz-orange font-bold flex items-center gap-1 pt-1">
                          <Plus className="w-3 h-3" /> Add Package Item
                        </button>
                      )}
                    </div>
                    {renderSlideImagePicker("package")}
                  </div>
                )}
              </div>

              {/* Accordion 8: Seller Trust Closing */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => activateSection("trust")}
                  className={`w-full p-3.5 text-left font-bold text-xs flex items-center justify-between transition-colors ${
                    openSection === "trust" ? "bg-orange-50/60 text-daraz-orange border-b border-slate-200" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  <span>Slide #8: Seller Trust Closing</span>
                  {openSection === "trust" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === "trust" && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Closing Title Overlay</label>
                      <input
                        type="text"
                        value={closingTitle}
                        onFocus={() => activateSection("trust")}
                        onChange={(e) => setClosingTitle(e.target.value)}
                        placeholder="PREMIUM QUALITY GUARANTEED"
                        className="input-daraz py-1 text-xs"
                      />
                    </div>
                    {renderSlideImagePicker("trust")}
                  </div>
                )}
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

          {/* Output Display Column / Live Preview Widget */}
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
                  <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg self-start text-[11px]">
                    <button
                      onClick={() => setPreviewSlide("hero")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "hero" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Hero
                    </button>
                    <button
                      onClick={() => setPreviewSlide("callouts")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "callouts" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Callouts
                    </button>
                    <button
                      onClick={() => setPreviewSlide("dimensions")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "dimensions" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Dimensions
                    </button>
                    <button
                      onClick={() => setPreviewSlide("grid")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setPreviewSlide("versatility")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "versatility" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Versatility
                    </button>
                    <button
                      onClick={() => setPreviewSlide("benefits")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "benefits" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Benefits
                    </button>
                    <button
                      onClick={() => setPreviewSlide("package")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
                        previewSlide === "package" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Package
                    </button>
                    <button
                      onClick={() => setPreviewSlide("trust")}
                      className={`px-2 py-1 font-semibold rounded transition-colors ${
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
                      <div className="flex items-start justify-between w-full relative z-10">
                        {topLeftBadgeText && logoPosition !== "Top-Left" ? (
                          <span className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs">
                            {topLeftBadgeText}
                          </span>
                        ) : logoPreview && logoPosition === "Top-Left" ? (
                          <img src={logoPreview} alt="Logo" className="w-16 h-10 object-contain" />
                        ) : (
                          <div />
                        )}

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

                      <div className="flex-1 flex items-center justify-center my-2 relative">
                        {getSlidePreview("hero") ? (
                          <img src={getSlidePreview("hero")} alt="Hero preview" className="max-h-[70%] max-w-[80%] object-contain" />
                        ) : (
                          <div className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                            <span className="text-xs font-semibold">Upload Photo</span>
                          </div>
                        )}
                      </div>

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
                        {getSlidePreview("callouts") ? (
                          <img src={getSlidePreview("callouts")} alt="Product" className="w-32 h-32 object-contain z-10" />
                        ) : (
                          <div className="w-28 h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold z-10 shadow-xs">
                            Product
                          </div>
                        )}

                        <div className="absolute inset-0 p-4 flex flex-col justify-around pointer-events-none">
                          {callouts.filter(c => c.trim()).map((text, idx) => (
                            <div key={idx} className={`flex items-center gap-1.5 ${idx % 2 === 0 ? "self-start" : "self-end"}`}>
                              <div className="bg-white border-2 border-daraz-orange px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 shadow-xs max-w-[150px]">
                                {text}
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
                        {depthText && (
                          <div className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-daraz-orange">
                            DEPTH: {depthText}
                          </div>
                        )}

                        {heightText && (
                          <div className="absolute left-6 top-10 bottom-10 flex flex-col items-center justify-center">
                            <div className="w-0.5 flex-1 bg-daraz-orange" />
                            <span className="my-1 px-1.5 py-0.5 bg-daraz-orange text-white text-[10px] font-bold rounded -rotate-90">
                              {heightText}
                            </span>
                            <div className="w-0.5 flex-1 bg-daraz-orange" />
                          </div>
                        )}

                        {getSlidePreview("dimensions") ? (
                          <img src={getSlidePreview("dimensions")} alt="Product" className="max-h-[65%] max-w-[65%] object-contain" />
                        ) : (
                          <div className="w-36 h-36 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                            Product
                          </div>
                        )}

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
                        {multiAngleTitle.toUpperCase()}
                      </div>
                      <div className="grid grid-cols-2 gap-2 flex-1 my-2">
                        {[0, 1, 2, 3].slice(0, Math.max(1, previews.length)).map((imgIdx, i) => (
                          <div key={i} className="bg-white rounded-lg border border-slate-200 p-1 flex flex-col items-center justify-center">
                            {previews[imgIdx] ? (
                              <img src={previews[imgIdx]} alt={`Angle ${i}`} className="w-full h-24 object-contain" />
                            ) : (
                              <div className="text-[10px] text-slate-400 font-semibold">Real Angle #{i + 1}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SLIDE 5: VERSATILITY PREVIEW */}
                  {previewSlide === "versatility" && (
                    <div className="w-full h-full relative bg-white flex flex-col justify-between p-4">
                      {versatilityPill && (
                        <span className="px-3 py-1 bg-daraz-orange text-white font-bold text-[10px] rounded-full self-start">
                          {versatilityPill}
                        </span>
                      )}
                      <div className="flex-1 flex items-center justify-center my-2">
                        {getSlidePreview("versatility") ? (
                          <img src={getSlidePreview("versatility")} alt="Product" className="max-h-40 object-contain" />
                        ) : (
                          <div className="w-28 h-28 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">Product</div>
                        )}
                      </div>
                      {(versatilityTitle || versatilitySubheadline || versatilityBullets.some(b => b)) && (
                        <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1">
                          {versatilityTitle && <p className="font-bold text-xs">{versatilityTitle}</p>}
                          {versatilitySubheadline && <p className="text-[10px] text-slate-300">{versatilitySubheadline}</p>}
                          <div className="flex gap-2 pt-1">
                            {versatilityBullets.filter(b => b).map((b, i) => (
                              <span key={i} className="text-[9px] bg-daraz-orange px-1.5 py-0.5 rounded text-white font-semibold">✓ {b}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 6: BENEFITS PREVIEW */}
                  {previewSlide === "benefits" && (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col justify-between">
                      <div className="bg-slate-900 text-white p-2.5 text-center font-bold text-xs">
                        {benefitsTitle.toUpperCase()}
                      </div>
                      <div className="flex-1 p-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center border rounded-xl bg-white p-2">
                          {getSlidePreview("benefits") ? <img src={getSlidePreview("benefits")} alt="Product" className="max-h-32 object-contain" /> : <span className="text-xs text-slate-400">Photo</span>}
                        </div>
                        <div className="space-y-2 overflow-hidden">
                          {benefitsList.filter(b => b.title.trim()).map((b, i) => (
                            <div key={i} className="p-2 bg-white border border-slate-200 rounded-lg text-[10px]">
                              <p className="font-bold text-slate-800">✓ {b.title}</p>
                              {b.description && <p className="text-[9px] text-slate-500 truncate">{b.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 7: PACKAGE PREVIEW */}
                  {previewSlide === "package" && (
                    <div className="w-full h-full relative bg-white flex flex-col justify-between">
                      <div className="bg-daraz-orange text-white p-2.5 text-center font-bold text-xs">
                        {packageTitle.toUpperCase()}
                      </div>
                      <div className="flex-1 flex items-center justify-center p-3">
                        {getSlidePreview("package") ? <img src={getSlidePreview("package")} alt="Product" className="max-h-36 object-contain" /> : <span className="text-xs text-slate-400">Photo</span>}
                      </div>
                      {packageContents.some(p => p.trim()) && (
                        <div className="bg-slate-900 text-white p-3 rounded-t-xl space-y-1">
                          <p className="text-[10px] font-bold text-daraz-orange">{packageListTitle}</p>
                          {packageContents.filter(p => p.trim()).map((item, i) => (
                            <p key={i} className="text-[9px] truncate">• {item}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 8: SELLER PROTECTION PREVIEW */}
                  {previewSlide === "trust" && (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col justify-between">
                      <div className="bg-slate-900 text-white p-3 text-center font-bold text-xs truncate">
                        {closingTitle || productName || "YOUR PRODUCT TITLE OVERLAY"}
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4">
                        {getSlidePreview("trust") ? (
                          <img src={getSlidePreview("trust")} alt="Product" className="h-32 object-contain" />
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
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    8 Gallery Slides Ready
                  </div>
                  <button onClick={downloadAllAsZip} className="btn-primary text-xs py-2 px-4 shadow-sm">
                    <FolderArchive className="w-4 h-4" />
                    Download All as ZIP
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 space-y-3">
                      <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden relative border border-slate-200">
                        <img src={img.url} alt={img.name} className="w-full h-full object-contain" />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          Slide {idx + 1} of 8
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-700 break-all leading-tight">
                          {img.name}
                        </span>
                        <button
                          onClick={() => downloadSingleImage(img.url, img.name)}
                          className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
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
        <div className="card-daraz space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Saved Gallery Archives</h3>
            <span className="text-xs text-slate-500">{savedGalleries.length} items</span>
          </div>

          {savedGalleries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No saved galleries yet. Generate your first product gallery studio set above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedGalleries.map((gal: any) => (
                <div key={gal.id} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 truncate max-w-[220px]">
                      {gal.productName || "Product Gallery"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(gal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gal.generatedUrls?.slice(0, 4).map((img: any, i: number) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded border overflow-hidden">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const proxyUrl = `/api/gallery/download?mode=zip&urls=${encodeURIComponent(
                        JSON.stringify(gal.generatedUrls)
                      )}&productName=${encodeURIComponent(gal.productName || "Gallery")}`;
                      window.location.href = proxyUrl;
                    }}
                    className="w-full btn-outline py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-daraz-orange" /> Download Gallery ZIP
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
