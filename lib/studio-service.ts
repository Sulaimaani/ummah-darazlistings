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

  // Prepare isolated product image scaled to fit within 820x820px canvas center
  const productOverlay = await sharp(productPngBuffer)
    .resize(820, 820, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // Create ground shadow SVG overlay
  const shadowSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blurShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>
      <!-- Soft natural drop shadow under product -->
      <ellipse cx="${CANVAS_SIZE / 2}" cy="970" rx="360" ry="40" fill="#0F172A" opacity="0.22" filter="url(#blurShadow)" />
      <ellipse cx="${CANVAS_SIZE / 2}" cy="960" rx="280" ry="25" fill="#0F172A" opacity="0.3" filter="url(#blurShadow)" />
    </svg>
  `;

  let bgSvg = "";

  switch (preset) {
    case "soft_gradient":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F8FAFC"/>
              <stop offset="100%" stop-color="#E2E8F0"/>
            </linearGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#grad)"/>
        </svg>
      `;
      break;

    case "kitchen_counter":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F8FAFC"/>
              <stop offset="100%" stop-color="#E2E8F0"/>
            </linearGradient>
            <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="100%" stop-color="#CBD5E1"/>
            </linearGradient>
          </defs>
          <!-- Wall background -->
          <rect width="${CANVAS_SIZE}" height="840" fill="url(#wall)"/>
          <!-- Countertop line & surface -->
          <line x1="0" y1="840" x2="${CANVAS_SIZE}" y2="840" stroke="#94A3B8" stroke-width="4"/>
          <rect x="0" y="840" width="${CANVAS_SIZE}" height="360" fill="url(#counter)"/>
        </svg>
      `;
      break;

    case "marble_surface":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="50%" stop-color="#F1F5F9"/>
              <stop offset="100%" stop-color="#E2E8F0"/>
            </linearGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#mGrad)"/>
          <!-- Subtle marble veining simulation -->
          <path d="M 100,0 Q 300,400 200,800 T 600,1200" fill="none" stroke="#CBD5E1" stroke-width="6" opacity="0.35"/>
          <path d="M 700,0 Q 900,300 850,700 T 1100,1200" fill="none" stroke="#94A3B8" stroke-width="4" opacity="0.25"/>
          <path d="M 400,0 Q 200,600 500,1200" fill="none" stroke="#E2E8F0" stroke-width="8" opacity="0.5"/>
        </svg>
      `;
      break;

    case "wood_surface":
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#78350F"/>
              <stop offset="50%" stop-color="#92400E"/>
              <stop offset="100%" stop-color="#451A03"/>
            </linearGradient>
          </defs>
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#woodGrad)"/>
          <!-- Wood plank lines -->
          <line x1="0" y1="300" x2="${CANVAS_SIZE}" y2="300" stroke="#451A03" stroke-width="4" opacity="0.6"/>
          <line x1="0" y1="600" x2="${CANVAS_SIZE}" y2="600" stroke="#451A03" stroke-width="4" opacity="0.6"/>
          <line x1="0" y1="900" x2="${CANVAS_SIZE}" y2="900" stroke="#451A03" stroke-width="4" opacity="0.6"/>
        </svg>
      `;
      break;

    case "white_studio":
    default:
      bgSvg = `
        <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
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
    .jpeg({ quality: 93 })
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
