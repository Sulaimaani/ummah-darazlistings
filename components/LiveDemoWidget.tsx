"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ArrowRight, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const DEMO_PRESETS = [
  {
    name: "Earbuds",
    inputs: [
      "F9 TWS Wireless Earphones Bluetooth 5.1 Stereo Earbuds Waterproof Touch Control",
      "M10 TWS Bluetooth Earbuds Noise Reduction Headset Gaming Headphones Power Bank",
      "Air3 TWS Earphones Wireless Bluetooth Headset Heavy Bass Earbuds With Mic",
    ],
    result: {
      seoTitle: "F9 TWS Wireless Bluetooth 5.1 Headphones Heavy Bass Waterproof Stereo Earbuds with Mic",
      shortDescription: `• Advanced Bluetooth 5.1 chip for ultra-stable connection and zero audio delay
• Deep Bass Stereo HD Sound Quality with active environmental noise isolation
• IPX7 Waterproof and sweat-resistant build ideal for workout, sports & outdoor use
• Ergonomic touch sensor controls for volume, music tracks, and incoming calls
• Built-in 2000mAh LED display power bank case supporting emergency phone charging`,
      longDescription: `### Product Specifications & Features
- **Model**: F9 TWS Stereo Earbuds
- **Bluetooth Version**: V5.1 with auto-pairing protocol
- **Battery Life**: 4–5 Hours continuous playback time per single charge
- **Charging Case Capacity**: 2000mAh with digital LED battery indicator
- **Waterproof Rating**: IPX7 Certified

### What is included in the package?
- 2x Wireless Bluetooth Earbuds (Left & Right)
- 1x Magnetic Charging Case Power Bank
- 1x Type-C High Speed Charging Cable
- 3x Sets of Silicone Eartips (S/M/L)
- 1x English User Guide Manual`,
    },
  },
  {
    name: "Smartwatch",
    inputs: [
      "Series 9 Smart Watch Ultra 2 Bluetooth Call Heart Rate Monitor Fitness Tracker",
      "i8 Pro Max Smart Watch Full Touch Screen Waterproof Sports Wristband NFC",
      "T900 Ultra Smartwatch Wireless Charging Men Women Fitness Band Watch",
    ],
    result: {
      seoTitle: "Series 9 Ultra Smartwatch 2.0 HD Full Touch Screen Bluetooth Calling Fitness Tracker Wristband",
      shortDescription: `• Large 2.0-inch HD Infinity display with vibrant clarity and customizable watch faces
• Bluetooth Calling feature with high-definition loudspeaker and noise-canceling mic
• 24/7 Health Monitoring: Blood Oxygen, Real-time Heart Rate & Sleep Tracking
• Multi-Sport Tracking Modes including running, cycling, swimming, and workout steps
• Wireless Fast Charger included with long-lasting 5-7 days standby battery life`,
      longDescription: `### Overview
Stay connected and track your health goals with the Series 9 Ultra Smartwatch. Featuring a sleek alloy casing and responsive full-touch interface.

### Tech Specs
- **Screen**: 2.0-inch IPS Full Touch HD Display
- **Battery**: 280mAh Lithium Polymer Battery
- **Water Resistance**: IP67 Daily Splash Proof
- **Compatibility**: Android 5.0+ and iOS 9.0+ via companion app`,
    },
  },
];

export default function LiveDemoWidget() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const preset = DEMO_PRESETS[selectedPreset];

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("SEO Listing generated! (Interactive Demo)");
    }, 600);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-daraz-orange/20 shadow-xl overflow-hidden text-slate-800">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-daraz-orange animate-pulse" />
          <span className="font-bold text-sm sm:text-base">Interactive Live Demo</span>
          <span className="bg-daraz-orange/20 border border-daraz-orange/40 text-daraz-orange text-xs px-2.5 py-0.5 rounded-full font-medium">
            Simulated Engine
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Try Sample Product:</span>
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => {
                setSelectedPreset(idx);
                handleSimulate();
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedPreset === idx
                  ? "bg-daraz-orange text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Simulation Column */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Input Daraz Competitor Titles ({preset.inputs.length} titles)
            </label>
            <div className="space-y-2.5">
              {preset.inputs.map((title, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute left-3 top-3 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center border border-slate-300">
                    {idx + 1}
                  </div>
                  <textarea
                    readOnly
                    value={title}
                    rows={2}
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-700 resize-none focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full btn-primary py-3 text-sm font-bold shadow-md shadow-daraz-orange/20"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Titles & Keywords...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Simulate SEO Generation
              </>
            )}
          </button>
        </div>

        {/* Right Output Simulated Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: SEO Title */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                1. Daraz SEO Title
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                  {preset.result.seoTitle.length} / 120 Chars (Optimal)
                </span>
                <button
                  onClick={() => copyToClipboard(preset.result.seoTitle, "SEO Title")}
                  className="p-1.5 text-slate-500 hover:text-daraz-orange hover:bg-white rounded transition-all"
                  title="Copy Title"
                >
                  {copiedField === "SEO Title" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
              {preset.result.seoTitle}
            </p>
          </div>

          {/* Card 2: Short Description */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Short Description (Daraz Highlights)
              </span>
              <button
                onClick={() => copyToClipboard(preset.result.shortDescription, "Short Description")}
                className="p-1.5 text-slate-500 hover:text-daraz-orange hover:bg-white rounded transition-all"
                title="Copy Highlights"
              >
                {copiedField === "Short Description" ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="text-[11px] font-sans whitespace-pre-wrap text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
              {preset.result.shortDescription}
            </pre>
          </div>

          {/* Bottom Callout Banner */}
          <div className="bg-gradient-to-r from-daraz-orange/10 via-amber-50 to-orange-50 border border-daraz-orange/30 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div className="text-xs text-slate-800">
              <span className="font-bold text-daraz-orange block">Ready to generate for your real Daraz products?</span>
              Sign up free to access the live Anthropic Claude 3.5 engine.
            </div>
            <Link href="/sign-up" className="btn-primary text-xs whitespace-nowrap py-2 px-3">
              Unlock Full Engine <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
