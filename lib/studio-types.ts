export type BackgroundPreset =
  | "white_studio"
  | "soft_gradient"
  | "kitchen_counter"
  | "marble_surface"
  | "wood_surface";

export const PRESET_OPTIONS: { id: BackgroundPreset; label: string; description: string; color: string }[] = [
  {
    id: "white_studio",
    label: "Clean White Studio",
    description: "Pure white backdrop with soft ground shadow",
    color: "#FFFFFF",
  },
  {
    id: "soft_gradient",
    label: "Soft Modern Gradient",
    description: "Subtle neutral gradient from slate to light gray",
    color: "linear-gradient(to bottom, #F8FAFC, #E2E8F0)",
  },
  {
    id: "kitchen_counter",
    label: "Kitchen / Countertop",
    description: "Minimalist light countertop with subtle reflection",
    color: "#F1F5F9",
  },
  {
    id: "marble_surface",
    label: "Marble Surface",
    description: "Elegant white marble texture with subtle gray veining",
    color: "#F8FAFC",
  },
  {
    id: "wood_surface",
    label: "Warm Wood Grain",
    description: "Natural warm wood surface for organic products",
    color: "#D97706",
  },
];
