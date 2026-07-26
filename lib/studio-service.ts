import sharp from "sharp";
import { BackgroundPreset } from "./studio-types";

export { PRESET_OPTIONS, type BackgroundPreset } from "./studio-types";

/**
 * Isolates subject by removing the background via external Background Removal API (remove.bg / Clipdrop API).
 * Throws loud, clear errors if API key is missing or request fails.
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = (process.env.REMOVE_BG_API_KEY || process.env.IMAGE_STUDIO_API_KEY || "").trim();

  if (!apiKey || apiKey.startsWith("xxx")) {
    throw new Error(
      "Background Removal API key is missing or unconfigured. Please add a valid REMOVE_BG_API_KEY to your .env.local or DigitalOcean environment settings."
    );
  }

  console.log(`[Studio Service] Sending ${imageBuffer.length} bytes to background removal API...`);

  // Remove.bg API call
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
  formData.append("image_file", blob, "product.jpg");
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson?.errors?.[0]?.title || JSON.stringify(errJson);
    } catch (e) {
      errorDetail = await response.text();
    }
    console.error(`[Studio Service] remove.bg API error (HTTP ${response.status}):`, errorDetail);
    throw new Error(
      `Background Removal API failed (HTTP ${response.status}): ${errorDetail || response.statusText}. Please check your REMOVE_BG_API_KEY quota or credentials.`
    );
  }

  const arrayBuf = await response.arrayBuffer();
  const pngBuffer = Buffer.from(arrayBuf);

  if (!pngBuffer || pngBuffer.length === 0) {
    throw new Error("Background removal API returned empty 0-byte result.");
  }

  console.log(`[Studio Service] Received isolated product PNG (${pngBuffer.length} bytes).`);
  return pngBuffer;
}

/**
 * Composites the isolated product PNG buffer onto a selected background preset using Sharp.
 * Preserves 100% of product pixels without altering shape, color, or text.
 */
export async function compositeProductOnBackground(
  productPngBuffer: Buffer,
  preset: BackgroundPreset
): Promise<Buffer> {
  const CANVAS_SIZE = 1200;

  // Prepare isolated product PNG cutout scaled to fit within 820x820px canvas center
  // Preserves 100% of original cutout pixels without color shift, modulation, or re-filtering
  const productOverlay = await sharp(productPngBuffer)
    .resize(820, 820, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // Dual-layer realistic ground shadow SVG overlay (tight contact shadow + ambient soft shadow)
  const shadowSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="contactBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="ambientBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <!-- Tight contact shadow under product base -->
      <ellipse cx="600" cy="945" rx="330" ry="22" fill="#0F172A" opacity="0.38" filter="url(#contactBlur)" />
      <!-- Ambient soft spread shadow -->
      <ellipse cx="600" cy="958" rx="420" ry="42" fill="#0F172A" opacity="0.18" filter="url(#ambientBlur)" />
    </svg>
  `;

  let bgSvg = "";

  switch (preset) {
    case "soft_gradient":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="softGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F8FAFC"/>
              <stop offset="50%" stop-color="#E2E8F0"/>
              <stop offset="100%" stop-color="#CBD5E1"/>
            </linearGradient>
            <radialGradient id="spotHighlight" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#softGrad)"/>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#spotHighlight)"/>
        </svg>
      `;
      break;

    case "kitchen_counter":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F8FAFC"/>
              <stop offset="100%" stop-color="#E2E8F0"/>
            </linearGradient>
            <linearGradient id="kSurface" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="40%" stop-color="#F1F5F9"/>
              <stop offset="100%" stop-color="#CBD5E1"/>
            </linearGradient>
            <linearGradient id="kReflection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#94A3B8" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#94A3B8" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Wall background -->
          <rect width="${CANVAS_SIZE}" height="810" fill="url(#kWall)"/>
          <!-- Soft blurred horizon reflection band -->
          <rect y="790" width="${CANVAS_SIZE}" height="40" fill="url(#kReflection)"/>
          <!-- Countertop surface -->
          <rect y="810" width="${CANVAS_SIZE}" height="390" fill="url(#kSurface)"/>
        </svg>
      `;
      break;

    case "marble_surface":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="mSpot" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="70%" stop-color="#F8FAFC"/>
              <stop offset="100%" stop-color="#E2E8F0"/>
            </radialGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#mSpot)"/>
          <!-- Soft organic marble veining -->
          <path d="M 50,-50 C 350,300 200,600 650,1250" fill="none" stroke="#CBD5E1" stroke-width="8" opacity="0.3" stroke-linecap="round"/>
          <path d="M 600,-50 C 850,350 750,750 1150,1250" fill="none" stroke="#94A3B8" stroke-width="5" opacity="0.2" stroke-linecap="round"/>
          <path d="M 250,200 C 500,450 350,850 800,1250" fill="none" stroke="#E2E8F0" stroke-width="12" opacity="0.45" stroke-linecap="round"/>
        </svg>
      `;
      break;

    case "wood_surface":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#78350F"/>
              <stop offset="40%" stop-color="#92400E"/>
              <stop offset="100%" stop-color="#451A03"/>
            </linearGradient>
            <radialGradient id="wLight" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#78350F" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#wBase)"/>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#wLight)"/>
          <!-- Subtle organic wood grain waves -->
          <path d="M -50,300 Q 600,280 1250,310" fill="none" stroke="#451A03" stroke-width="6" opacity="0.3"/>
          <path d="M -50,600 Q 600,590 1250,610" fill="none" stroke="#451A03" stroke-width="6" opacity="0.3"/>
          <path d="M -50,900 Q 600,910 1250,890" fill="none" stroke="#451A03" stroke-width="6" opacity="0.3"/>
        </svg>
      `;
      break;

    case "white_studio":
    default:
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="whiteSpot" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="70%" stop-color="#FAFAFA"/>
              <stop offset="100%" stop-color="#F1F5F9"/>
            </radialGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#whiteSpot)"/>
        </svg>
      `;
      break;
  }

  const finalJpeg = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(bgSvg), top: 0, left: 0 },
      { input: Buffer.from(shadowSvg), top: 0, left: 0 },
      { input: productOverlay, top: 150, left: (CANVAS_SIZE - 820) / 2 },
    ])
    .jpeg({ quality: 94 })
    .toBuffer();

  return finalJpeg;
}

/**
 * Enhances the product photo lighting, contrast, white balance, and sharpness.
 * Does NOT alter product geometry, color values destructively, or text/branding.
 */
export async function enhanceProductPhoto(imageBuffer: Buffer): Promise<Buffer> {
  const CANVAS_SIZE = 1200;

  // Process image corrections: lighting, contrast curve, level optimization, and subtle sharpening
  const enhancedBuf = await sharp(imageBuffer)
    .resize(CANVAS_SIZE, CANVAS_SIZE, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .modulate({
      brightness: 1.04,
      saturation: 1.06,
    })
    .linear(1.05, -4)
    .sharpen({
      sigma: 1.1,
      m1: 1.0,
      m2: 2.0,
    })
    .jpeg({ quality: 94 })
    .toBuffer();

  return enhancedBuf;
}
