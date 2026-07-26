import sharp from "sharp";

export interface BenefitItem {
  title: string;
  description?: string;
}

export interface GalleryInputAttributes {
  productName?: string;
  sizeWeightLabel?: string;
  topLeftBadgeText?: string;
  topRightBadgeText?: string;
  featureCalloutsTitle?: string;
  dimensionsText?: string;
  heightText?: string;
  widthText?: string;
  depthText?: string;
  dimensionsTitle?: string;
  multiAngleTitle?: string;
  versatilityTitle?: string;
  versatilityPill?: string;
  versatilitySubheadline?: string;
  versatilityBullets?: string[]; // 0 to 3 bullet items
  benefitsTitle?: string;
  benefitsList?: (string | BenefitItem)[]; // 0 to 4 benefit items
  packageTitle?: string;
  packageListTitle?: string;
  packageContents?: string[]; // 0 to 6 itemized strings
  closingTitle?: string;
  closingSubtitle?: string;
  closingBadges?: { title: string; subtitle: string }[];
  featureCallouts?: string[]; // 0 to 5 bullet callouts
  logoBuffer?: Buffer;
  logoPosition?: "Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "None";
  /** Per-slide image buffer overrides. Keys: hero, callouts, dimensions, versatility, benefits, package, trust */
  slideBuffers?: Partial<Record<string, Buffer>>;
}

// =========================================================================
// UNIVERSAL REUSABLE TEXT FITTING HELPER
// =========================================================================
export interface TextFitOptions {
  text: string;
  maxBoxWidth: number;
  maxLines?: number;
  baseFontSize?: number;
  minFontSize?: number;
  lineHeightRatio?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string;
  textAnchor?: "start" | "middle" | "end";
  x?: number;
  y?: number;
}

export function fitTextToBox(options: TextFitOptions): {
  svg: string;
  lines: string[];
  actualFontSize: number;
  actualWidth: number;
  actualHeight: number;
} {
  const {
    text = "",
    maxBoxWidth,
    maxLines = 2,
    baseFontSize = 18,
    minFontSize = 12,
    lineHeightRatio = 1.3,
    fontFamily = "DejaVu Sans, Arial, Helvetica, sans-serif",
    fill = "#1E293B",
    fontWeight = "bold",
    textAnchor = "start",
    x = 0,
    y = 0,
  } = options;

  const rawText = text.trim();
  if (!rawText) {
    return { svg: "", lines: [], actualFontSize: baseFontSize, actualWidth: 0, actualHeight: 0 };
  }

  let currentFontSize = baseFontSize;
  let finalLines: string[] = [];

  // Try shrinking font size from baseFontSize down to minFontSize to fit within maxLines
  while (currentFontSize >= minFontSize) {
    const charsPerLine = Math.max(10, Math.floor(maxBoxWidth / (currentFontSize * 0.6)));
    const words = rawText.split(/\s+/);
    const candidateLines: string[] = [];
    let currentLine = "";

    for (const w of words) {
      if ((currentLine + " " + w).trim().length <= charsPerLine) {
        currentLine = (currentLine + " " + w).trim();
      } else {
        if (currentLine) candidateLines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) candidateLines.push(currentLine);

    if (candidateLines.length <= maxLines) {
      finalLines = candidateLines;
      break;
    }

    currentFontSize -= 1;
  }

  // If candidate lines still exceed maxLines at minFontSize, enforce maxLines with ellipsis
  if (finalLines.length === 0 || finalLines.length > maxLines) {
    currentFontSize = minFontSize;
    const charsPerLine = Math.max(10, Math.floor(maxBoxWidth / (currentFontSize * 0.6)));
    const words = rawText.split(/\s+/);
    const candidateLines: string[] = [];
    let currentLine = "";

    for (const w of words) {
      if ((currentLine + " " + w).trim().length <= charsPerLine) {
        currentLine = (currentLine + " " + w).trim();
      } else {
        if (currentLine) candidateLines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) candidateLines.push(currentLine);

    finalLines = candidateLines.slice(0, maxLines);
    // Truncate last line with ellipsis if words were omitted
    if (candidateLines.length > maxLines) {
      const last = finalLines[maxLines - 1];
      finalLines[maxLines - 1] = last.length > 3 ? last.substring(0, last.length - 3) + "..." : "...";
    }
  }

  const lineStep = Math.round(currentFontSize * lineHeightRatio);
  const actualHeight = finalLines.length * lineStep;
  const longestLineLen = Math.max(...finalLines.map((l) => l.length));
  const actualWidth = Math.min(maxBoxWidth, Math.round(longestLineLen * currentFontSize * 0.6));

  const tspanSvgParts = finalLines.map((line, idx) => {
    const dy = idx === 0 ? 0 : lineStep;
    return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
  });

  const svg = `
    <text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${currentFontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}">
      ${tspanSvgParts.join("")}
    </text>
  `;

  return {
    svg,
    lines: finalLines,
    actualFontSize: currentFontSize,
    actualWidth,
    actualHeight,
  };
}

// =========================================================================
// MAIN GALLERY COMPOSER ENGINE
// =========================================================================
export async function generateGallerySlides(
  sourceBuffers: Buffer[],
  attrs: GalleryInputAttributes
): Promise<{ buffer: Buffer; name: string }[]> {
  const CANVAS_SIZE = 1200;

  const productName = (attrs.productName || "").trim();
  const primaryBuf = sourceBuffers[0];
  if (!primaryBuf) {
    throw new Error("[Composer Error] At least 1 primary photo buffer is required.");
  }

  // Per-slide image override helper
  const getSlideBuffer = (slideKey: string): Buffer => {
    return attrs.slideBuffers?.[slideKey] || primaryBuf;
  };

  async function prepareMainPhoto(
    buf: Buffer,
    targetWidth: number,
    targetHeight: number
  ): Promise<Buffer> {
    return sharp(buf)
      .resize(targetWidth, targetHeight, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toBuffer();
  }

  const results: { buffer: Buffer; name: string }[] = [];

  // =========================================================================
  // SLIDE 1: Hero (White background, customizable badges, logo overlay)
  // =========================================================================
  const heroPhoto = await prepareMainPhoto(getSlideBuffer("hero"), 820, 820);

  const topLeftBadge = (attrs.topLeftBadgeText || "").trim();
  const topRightBadge = (attrs.topRightBadgeText || attrs.sizeWeightLabel || "").trim();
  const logoPosition = attrs.logoPosition || "None";
  const hasLogo = Boolean(attrs.logoBuffer && attrs.logoBuffer.length > 0 && logoPosition !== "None");

  const renderTopLeftBadge = Boolean(topLeftBadge && (!hasLogo || logoPosition !== "Top-Left"));
  const renderTopRightBadge = Boolean(topRightBadge && (!hasLogo || logoPosition !== "Top-Right"));

  let topLeftSvg = "";
  if (renderTopLeftBadge) {
    const badgeW = Math.max(160, Math.min(380, topLeftBadge.length * 14 + 40));
    topLeftSvg = `
      <g transform="translate(60, 70)">
        <rect width="${badgeW}" height="54" rx="12" fill="#1E293B"/>
        <text x="${badgeW / 2}" y="34" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(topLeftBadge)}</text>
      </g>
    `;
  }

  let topRightSvg = "";
  if (renderTopRightBadge) {
    const badgeW = Math.max(160, Math.min(380, topRightBadge.length * 14 + 40));
    const badgeX = CANVAS_SIZE - 60 - badgeW;
    topRightSvg = `
      <g transform="translate(${badgeX}, 70)">
        <rect width="${badgeW}" height="54" rx="27" fill="#F57224"/>
        <text x="${badgeW / 2}" y="34" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(topRightBadge)}</text>
      </g>
    `;
  }

  let footerBannerSvg = "";
  if (productName) {
    const titleFit = fitTextToBox({
      text: productName,
      maxBoxWidth: CANVAS_SIZE - 80,
      maxLines: 1,
      baseFontSize: 34,
      minFontSize: 22,
      fill: "#FFFFFF",
      textAnchor: "middle",
      x: CANVAS_SIZE / 2,
      y: 1120,
    });
    footerBannerSvg = `
      <rect x="0" y="1050" width="${CANVAS_SIZE}" height="150" fill="#1E293B"/>
      ${titleFit.svg}
      <text x="${CANVAS_SIZE / 2}" y="1160" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#F57224" text-anchor="middle">PREMIUM QUALITY • ORIGINAL PRODUCT</text>
    `;
  }

  const heroSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F8FAFC"/>
        </linearGradient>
      </defs>
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#bgGrad)"/>
      <rect x="20" y="20" width="${CANVAS_SIZE - 40}" height="${CANVAS_SIZE - 40}" fill="none" stroke="#E2E8F0" stroke-width="3" rx="16"/>

      ${topLeftSvg}
      ${topRightSvg}
      ${footerBannerSvg}
    </svg>
  `;

  const slide1Composites: sharp.OverlayOptions[] = [
    { input: Buffer.from(heroSvg), top: 0, left: 0 },
    { input: heroPhoto, top: 170, left: (CANVAS_SIZE - 820) / 2 },
  ];

  if (hasLogo && attrs.logoBuffer) {
    try {
      const resizedLogo = await sharp(attrs.logoBuffer)
        .resize(180, 100, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      let logoLeft = 60;
      let logoTop = 50;
      if (logoPosition === "Top-Right") {
        logoLeft = CANVAS_SIZE - 240;
        logoTop = 50;
      } else if (logoPosition === "Bottom-Left") {
        logoLeft = 60;
        logoTop = 930;
      } else if (logoPosition === "Bottom-Right") {
        logoLeft = CANVAS_SIZE - 240;
        logoTop = 930;
      }

      slide1Composites.push({ input: resizedLogo, top: logoTop, left: logoLeft });
    } catch (logoErr) {
      console.error("[Composer Error] Failed to composite logo:", logoErr);
    }
  }

  const slide1 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(slide1Composites)
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide1, name: "1_Hero_Main_Photo.jpg" });

  // =========================================================================
  // SLIDE 2: Feature Callouts (Auto-Sizing, 1-to-1 Slot Mapping, No Duplicates)
  // =========================================================================
  const userCallouts = (attrs.featureCallouts || []).filter((c) => c.trim().length > 0);
  const calloutPhoto = await prepareMainPhoto(getSlideBuffer("callouts"), 360, 360);
  const calloutTitle = attrs.featureCalloutsTitle || (userCallouts.length > 0 ? "KEY PRODUCT FEATURES" : "");

  const calloutBoxParts: string[] = [];
  const calloutLineParts: string[] = [];

  const count = Math.min(5, userCallouts.length);

  if (count > 0) {
    let slots: { y: number; isRight: boolean }[] = [];
    if (count === 1) {
      slots = [{ y: 550, isRight: false }];
    } else if (count === 2) {
      slots = [
        { y: 360, isRight: false },
        { y: 740, isRight: true },
      ];
    } else if (count === 3) {
      slots = [
        { y: 250, isRight: false },
        { y: 550, isRight: true },
        { y: 850, isRight: false },
      ];
    } else if (count === 4) {
      slots = [
        { y: 240, isRight: false },
        { y: 240, isRight: true },
        { y: 860, isRight: false },
        { y: 860, isRight: true },
      ];
    } else {
      // 5 items: distributed evenly across y: 200, 360, 520, 680, 840
      slots = [
        { y: 200, isRight: false },
        { y: 360, isRight: true },
        { y: 520, isRight: false },
        { y: 680, isRight: true },
        { y: 840, isRight: false },
      ];
    }

    userCallouts.slice(0, count).forEach((text, idx) => {
      const slot = slots[idx];
      const fit = fitTextToBox({
        text,
        maxBoxWidth: 310,
        maxLines: 2,
        baseFontSize: 17,
        minFontSize: 12,
        fill: "#1E293B",
        x: 52,
        y: 34,
      });

      const boxWidth = Math.min(380, Math.max(220, fit.actualWidth + 70));
      const boxHeight = fit.lines.length > 1 ? 100 : 70;

      let posX = 50;
      let lineX1 = posX + boxWidth;
      let lineX2 = 410;

      if (slot.isRight) {
        posX = CANVAS_SIZE - 50 - boxWidth;
        lineX1 = posX;
        lineX2 = 790;
      }

      const circleY = boxHeight / 2;

      const boxSvg = `
        <g transform="translate(${posX}, ${slot.y - boxHeight / 2})">
          <rect width="${boxWidth}" height="${boxHeight}" rx="14" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
          <circle cx="24" cy="${circleY}" r="12" fill="#F57224"/>
          <text x="24" y="${circleY + 5}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓</text>
          ${fit.svg}
        </g>
      `;

      const targetPhotoY = Math.min(740, Math.max(420, slot.y));
      const lineSvg = `
        <line x1="${lineX1}" y1="${slot.y}" x2="${lineX2}" y2="${targetPhotoY}" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>
      `;

      calloutBoxParts.push(boxSvg);
      calloutLineParts.push(lineSvg);
    });
  }

  let calloutHeaderSvg = "";
  if (calloutTitle) {
    const titleFit = fitTextToBox({
      text: calloutTitle.toUpperCase(),
      maxBoxWidth: CANVAS_SIZE - 80,
      maxLines: 1,
      baseFontSize: 34,
      minFontSize: 20,
      fill: "#FFFFFF",
      textAnchor: "middle",
      x: CANVAS_SIZE / 2,
      y: 62,
    });
    calloutHeaderSvg = `
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#F57224"/>
      ${titleFit.svg}
    `;
  }

  const calloutSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      ${calloutHeaderSvg}
      ${calloutLineParts.join("\n")}
      ${calloutBoxParts.join("\n")}
    </svg>
  `;

  const slide2 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(calloutSvg), top: 0, left: 0 },
      { input: calloutPhoto, top: 400, left: 420 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide2, name: "2_Feature_Callouts.jpg" });

  // =========================================================================
  // SLIDE 3: Dimensions Slide (Separate Height, Width, Depth + Legacy Fallback)
  // =========================================================================
  const dimPhoto = await prepareMainPhoto(getSlideBuffer("dimensions"), 700, 700);
  const { height: heightVal, width: widthVal, depth: depthVal } = parseDimensions(attrs);
  const dimTitle = attrs.dimensionsTitle || (heightVal || widthVal ? "PRODUCT DIMENSIONS & SIZE" : "");

  let heightSvg = "";
  if (heightVal) {
    const badgeW = Math.max(140, heightVal.length * 14 + 36);
    heightSvg = `
      <line x1="180" y1="260" x2="180" y2="940" stroke="#F57224" stroke-width="4"/>
      <line x1="160" y1="260" x2="200" y2="260" stroke="#F57224" stroke-width="4"/>
      <line x1="160" y1="940" x2="200" y2="940" stroke="#F57224" stroke-width="4"/>
      <g transform="translate(90, 600) rotate(-90)">
        <rect width="${badgeW}" height="46" rx="8" fill="#F57224"/>
        <text x="${badgeW / 2}" y="30" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(heightVal)}</text>
      </g>
    `;
  }

  let widthSvg = "";
  if (widthVal) {
    const badgeW = Math.max(140, widthVal.length * 14 + 36);
    const badgeX = 600 - badgeW / 2;
    widthSvg = `
      <line x1="250" y1="980" x2="950" y2="980" stroke="#F57224" stroke-width="4"/>
      <line x1="250" y1="960" x2="250" y2="1000" stroke="#F57224" stroke-width="4"/>
      <line x1="950" y1="960" x2="950" y2="1000" stroke="#F57224" stroke-width="4"/>
      <g transform="translate(${badgeX}, 1020)">
        <rect width="${badgeW}" height="46" rx="8" fill="#F57224"/>
        <text x="${badgeW / 2}" y="30" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(widthVal)}</text>
      </g>
    `;
  }

  let depthSvg = "";
  if (depthVal) {
    const badgeW = Math.max(160, depthVal.length * 14 + 60);
    depthSvg = `
      <g transform="translate(${1060 - badgeW}, 150)">
        <rect width="${badgeW}" height="50" rx="10" fill="#1E293B" stroke="#F57224" stroke-width="2"/>
        <text x="${badgeW / 2}" y="32" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">DEPTH: ${escapeXml(depthVal)}</text>
      </g>
    `;
  }

  let dimHeaderSvg = "";
  if (dimTitle) {
    const titleFit = fitTextToBox({
      text: dimTitle.toUpperCase(),
      maxBoxWidth: CANVAS_SIZE - 80,
      maxLines: 1,
      baseFontSize: 36,
      minFontSize: 22,
      fill: "#FFFFFF",
      textAnchor: "middle",
      x: CANVAS_SIZE / 2,
      y: 62,
    });
    dimHeaderSvg = `
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#1E293B"/>
      ${titleFit.svg}
    `;
  }

  const dimSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      ${dimHeaderSvg}
      ${heightSvg}
      ${widthSvg}
      ${depthSvg}
    </svg>
  `;

  const slide3 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(dimSvg), top: 0, left: 0 },
      { input: dimPhoto, top: 250, left: 250 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide3, name: "3_Dimensions_Spec.jpg" });

  // =========================================================================
  // SLIDE 4: Multi-Angle Showcase (1-4 Real Photos, NO Fake Flipped Angles)
  // =========================================================================
  const photoCount = sourceBuffers.length;
  const gridTitle = attrs.multiAngleTitle || "MULTI-ANGLE SHOWCASE";

  const gridTitleFit = fitTextToBox({
    text: gridTitle.toUpperCase(),
    maxBoxWidth: CANVAS_SIZE - 80,
    maxLines: 1,
    baseFontSize: 34,
    minFontSize: 20,
    fill: "#FFFFFF",
    textAnchor: "middle",
    x: CANVAS_SIZE / 2,
    y: 56,
  });

  const gridComposites: sharp.OverlayOptions[] = [];

  let gridSvg = "";

  if (photoCount === 1) {
    // 1 Photo: Clean Single Photo Slide
    const p1 = await prepareMainPhoto(sourceBuffers[0], 800, 800);
    gridSvg = `
      <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
        <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#F57224"/>
        ${gridTitleFit.svg}
        <rect x="180" y="160" width="840" height="840" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      </svg>
    `;
    gridComposites.push({ input: Buffer.from(gridSvg), top: 0, left: 0 });
    gridComposites.push({ input: p1, top: 180, left: 200 });
  } else if (photoCount === 2) {
    // 2 Photos: 2-Column Side-by-Side
    const p1 = await prepareMainPhoto(sourceBuffers[0], 510, 820);
    const p2 = await prepareMainPhoto(sourceBuffers[1], 510, 820);
    gridSvg = `
      <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
        <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#F57224"/>
        ${gridTitleFit.svg}
        <rect x="60" y="150" width="520" height="870" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="620" y="150" width="520" height="870" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      </svg>
    `;
    gridComposites.push({ input: Buffer.from(gridSvg), top: 0, left: 0 });
    gridComposites.push({ input: p1, top: 175, left: 65 });
    gridComposites.push({ input: p2, top: 175, left: 625 });
  } else if (photoCount === 3) {
    // 3 Photos: 1 Main Left + 2 Stacked Right
    const p1 = await prepareMainPhoto(sourceBuffers[0], 510, 820);
    const p2 = await prepareMainPhoto(sourceBuffers[1], 510, 400);
    const p3 = await prepareMainPhoto(sourceBuffers[2], 510, 400);
    gridSvg = `
      <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
        <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#F57224"/>
        ${gridTitleFit.svg}
        <rect x="60" y="140" width="520" height="870" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="620" y="140" width="520" height="420" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="620" y="590" width="520" height="420" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      </svg>
    `;
    gridComposites.push({ input: Buffer.from(gridSvg), top: 0, left: 0 });
    gridComposites.push({ input: p1, top: 165, left: 65 });
    gridComposites.push({ input: p2, top: 150, left: 625 });
    gridComposites.push({ input: p3, top: 600, left: 625 });
  } else {
    // 4 Photos: 2x2 Grid
    const p1 = await prepareMainPhoto(sourceBuffers[0], 500, 460);
    const p2 = await prepareMainPhoto(sourceBuffers[1], 500, 460);
    const p3 = await prepareMainPhoto(sourceBuffers[2], 500, 460);
    const p4 = await prepareMainPhoto(sourceBuffers[3], 500, 460);
    gridSvg = `
      <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
        <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#F57224"/>
        ${gridTitleFit.svg}
        <rect x="60" y="130" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="630" y="130" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="60" y="650" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="630" y="650" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      </svg>
    `;
    gridComposites.push({ input: Buffer.from(gridSvg), top: 0, left: 0 });
    gridComposites.push({ input: p1, top: 140, left: 65 });
    gridComposites.push({ input: p2, top: 140, left: 635 });
    gridComposites.push({ input: p3, top: 660, left: 65 });
    gridComposites.push({ input: p4, top: 660, left: 635 });
  }

  const slide4 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite(gridComposites)
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide4, name: "4_Multi_Angle_Grid.jpg" });

  // =========================================================================
  // SLIDE 5: Versatility / Multipurpose Banner (Clean Photo Boundary)
  // =========================================================================
  const versaPhoto = await prepareMainPhoto(getSlideBuffer("versatility"), 720, 680);
  const versaPill = (attrs.versatilityPill || "").trim();
  const versaTitle = (attrs.versatilityTitle || "").trim();
  const versaSub = (attrs.versatilitySubheadline || "").trim();
  const versaBullets = (attrs.versatilityBullets || []).filter((b) => b.trim().length > 0);

  let pillSvg = "";
  if (versaPill) {
    const pillW = Math.max(160, versaPill.length * 14 + 40);
    pillSvg = `
      <rect x="60" y="50" width="${pillW}" height="44" rx="22" fill="#F57224"/>
      <text x="${60 + pillW / 2}" y="78" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(versaPill)}</text>
    `;
  }

  let bannerContentSvg = "";
  if (versaTitle || versaSub || versaBullets.length > 0) {
    const titleFit = versaTitle
      ? fitTextToBox({
          text: versaTitle.toUpperCase(),
          maxBoxWidth: CANVAS_SIZE - 120,
          maxLines: 2,
          baseFontSize: 34,
          minFontSize: 22,
          fill: "#FFFFFF",
          x: 60,
          y: 890,
        })
      : null;

    const subFit = versaSub
      ? fitTextToBox({
          text: versaSub,
          maxBoxWidth: CANVAS_SIZE - 120,
          maxLines: 2,
          baseFontSize: 20,
          minFontSize: 14,
          fill: "#CBD5E1",
          x: 60,
          y: titleFit ? 890 + titleFit.actualHeight + 25 : 890,
        })
      : null;

    const bulletY = subFit
      ? 890 + (titleFit?.actualHeight || 0) + subFit.actualHeight + 45
      : titleFit
      ? 890 + titleFit.actualHeight + 35
      : 920;

    const bulletSvgParts = versaBullets.slice(0, 3).map((bullet, idx) => {
      const bulletX = 60 + idx * 370;
      return `
        <circle cx="${bulletX + 15}" cy="${bulletY}" r="8" fill="#F57224"/>
        <text x="${bulletX + 32}" y="${bulletY + 6}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#FFFFFF">${escapeXml(truncateText(bullet, 22))}</text>
      `;
    });

    bannerContentSvg = `
      <rect x="0" y="810" width="${CANVAS_SIZE}" height="390" fill="#1E293B"/>
      ${titleFit ? titleFit.svg : ""}
      ${subFit ? subFit.svg : ""}
      ${bulletSvgParts.join("\n")}
    `;
  }

  const versaSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      ${pillSvg}
      ${bannerContentSvg}
    </svg>
  `;

  const slide5 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(versaSvg), top: 0, left: 0 },
      { input: versaPhoto, top: 110, left: (CANVAS_SIZE - 720) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide5, name: "5_Versatility_Banner.jpg" });

  // =========================================================================
  // SLIDE 6: Product Benefits (Auto-Sizing Cards, Dynamic User Input)
  // =========================================================================
  const benefitPhoto = await prepareMainPhoto(getSlideBuffer("benefits"), 540, 540);
  const benefitTitle = attrs.benefitsTitle || (attrs.benefitsList && attrs.benefitsList.length > 0 ? "WHY CHOOSE THIS PRODUCT?" : "");

  // Normalize benefit items
  const userBenefits: BenefitItem[] = (attrs.benefitsList || [])
    .map((item) => {
      if (typeof item === "string") return { title: item };
      return item;
    })
    .filter((b) => b && b.title && b.title.trim().length > 0);

  const benefitCardSvgParts: string[] = [];
  const bCount = Math.min(4, userBenefits.length);

  if (bCount > 0) {
    const cardGap = bCount === 4 ? 20 : 35;
    const availableH = 920;
    const cardH = Math.min(200, Math.floor((availableH - (bCount - 1) * cardGap) / bCount));

    userBenefits.slice(0, bCount).forEach((item, idx) => {
      const topY = 140 + idx * (cardH + cardGap);

      const titleFit = fitTextToBox({
        text: item.title,
        maxBoxWidth: 420,
        maxLines: 2,
        baseFontSize: 20,
        minFontSize: 15,
        fill: "#1E293B",
        x: 80,
        y: 42,
      });

      const descFit = item.description
        ? fitTextToBox({
            text: item.description,
            maxBoxWidth: 420,
            maxLines: 2,
            baseFontSize: 14,
            minFontSize: 11,
            fill: "#64748B",
            x: 80,
            y: 42 + titleFit.actualHeight + 14,
          })
        : null;

      const svg = `
        <g transform="translate(620, ${topY})">
          <rect width="520" height="${cardH}" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
          <circle cx="45" cy="42" r="20" fill="#F57224"/>
          <text x="45" y="49" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓</text>
          ${titleFit.svg}
          ${descFit ? descFit.svg : ""}
        </g>
      `;

      benefitCardSvgParts.push(svg);
    });
  }

  let benefitHeaderSvg = "";
  if (benefitTitle) {
    const titleFit = fitTextToBox({
      text: benefitTitle.toUpperCase(),
      maxBoxWidth: CANVAS_SIZE - 80,
      maxLines: 1,
      baseFontSize: 34,
      minFontSize: 20,
      fill: "#FFFFFF",
      textAnchor: "middle",
      x: CANVAS_SIZE / 2,
      y: 56,
    });
    benefitHeaderSvg = `
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#1E293B"/>
      ${titleFit.svg}
    `;
  }

  const benefitSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      ${benefitHeaderSvg}
      ${benefitCardSvgParts.join("\n")}
    </svg>
  `;

  const slide6 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(benefitSvg), top: 0, left: 0 },
      { input: benefitPhoto, top: 320, left: 40 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide6, name: "6_Product_Benefits.jpg" });

  // =========================================================================
  // SLIDE 7: Package Showcase / What's in the Box (Photo Above Banner)
  // =========================================================================
  const pkgPhoto = await prepareMainPhoto(getSlideBuffer("package"), 700, 650);
  const pkgTitle = attrs.packageTitle || (attrs.packageContents && attrs.packageContents.length > 0 ? "WHAT IS IN THE PACKAGE?" : "");
  const pkgListTitle = attrs.packageListTitle || "Package Contents List:";
  const userPkgItems = (attrs.packageContents || []).filter((i) => i.trim().length > 0);

  let pkgHeaderSvg = "";
  if (pkgTitle) {
    const titleFit = fitTextToBox({
      text: pkgTitle.toUpperCase(),
      maxBoxWidth: CANVAS_SIZE - 80,
      maxLines: 1,
      baseFontSize: 34,
      minFontSize: 20,
      fill: "#FFFFFF",
      textAnchor: "middle",
      x: CANVAS_SIZE / 2,
      y: 62,
    });
    pkgHeaderSvg = `
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#F57224"/>
      ${titleFit.svg}
    `;
  }

  let pkgBannerSvg = "";
  if (userPkgItems.length > 0) {
    const itemSvgParts = userPkgItems.slice(0, 6).map((item, idx) => {
      const fit = fitTextToBox({
        text: `• ${item}`,
        maxBoxWidth: 1000,
        maxLines: 1,
        baseFontSize: 19,
        minFontSize: 14,
        fill: "#FFFFFF",
        x: 100,
        y: 885 + idx * 36,
      });
      return fit.svg;
    });

    pkgBannerSvg = `
      <rect x="60" y="790" width="1080" height="360" rx="20" fill="#1E293B"/>
      <text x="100" y="838" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#F57224">${escapeXml(pkgListTitle)}</text>
      ${itemSvgParts.join("\n")}
    `;
  }

  const pkgSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      ${pkgHeaderSvg}
      ${pkgBannerSvg}
    </svg>
  `;

  const slide7 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(pkgSvg), top: 0, left: 0 },
      { input: pkgPhoto, top: 110, left: (CANVAS_SIZE - 700) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide7, name: "7_Package_Contents.jpg" });

  // =========================================================================
  // SLIDE 8: Branded Closing / Seller Protection (Customizable Badges)
  // =========================================================================
  const closingPhoto = await prepareMainPhoto(getSlideBuffer("trust"), 700, 700);
  const closingTitle = attrs.closingTitle || productName || "PREMIUM QUALITY GUARANTEED";

  const closingTitleFit = fitTextToBox({
    text: closingTitle.toUpperCase(),
    maxBoxWidth: CANVAS_SIZE - 80,
    maxLines: 1,
    baseFontSize: 34,
    minFontSize: 20,
    fill: "#FFFFFF",
    textAnchor: "middle",
    x: CANVAS_SIZE / 2,
    y: 70,
  });

  const closingBadges = attrs.closingBadges || [
    { title: "100% Quality Tested", subtitle: "Inspected before dispatch" },
    { title: "Fast Shipping", subtitle: "Express Daraz fulfillment" },
    { title: "Buyer Protection", subtitle: "Hassle-free replacement" },
  ];

  const closingSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="120" fill="#1E293B"/>
      ${closingTitleFit.svg}

      <g transform="translate(60, 920)">
        <!-- Badge 1 -->
        <rect x="0" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="170" cy="55" r="30" fill="#F57224"/>
        <text x="170" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">★</text>
        <text x="170" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="19" font-weight="bold" fill="#1E293B" text-anchor="middle">${escapeXml(closingBadges[0]?.title || "Quality Tested")}</text>
        <text x="170" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">${escapeXml(closingBadges[0]?.subtitle || "100% Guaranteed")}</text>

        <!-- Badge 2 -->
        <rect x="370" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="540" cy="55" r="30" fill="#1E293B"/>
        <text x="540" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">⚡</text>
        <text x="540" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="19" font-weight="bold" fill="#1E293B" text-anchor="middle">${escapeXml(closingBadges[1]?.title || "Fast Dispatch")}</text>
        <text x="540" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">${escapeXml(closingBadges[1]?.subtitle || "Express Fulfillment")}</text>

        <!-- Badge 3 -->
        <rect x="740" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="910" cy="55" r="30" fill="#10B981"/>
        <text x="910" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">✓</text>
        <text x="910" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="19" font-weight="bold" fill="#1E293B" text-anchor="middle">${escapeXml(closingBadges[2]?.title || "Buyer Protection")}</text>
        <text x="910" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">${escapeXml(closingBadges[2]?.subtitle || "Safe Delivery")}</text>
      </g>
    </svg>
  `;

  const slide8 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(closingSvg), top: 0, left: 0 },
      { input: closingPhoto, top: 170, left: (CANVAS_SIZE - 700) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  results.push({ buffer: slide8, name: "8_Branded_Seller_Trust.jpg" });

  return results;
}

// =========================================================================
// HELPER UTILITIES
// =========================================================================
function parseDimensions(attrs: GalleryInputAttributes): {
  height: string;
  width: string;
  depth: string;
} {
  let height = (attrs.heightText || "").trim();
  let width = (attrs.widthText || "").trim();
  let depth = (attrs.depthText || "").trim();

  if (!height && !width && attrs.dimensionsText) {
    const parts = attrs.dimensionsText.split(/\s*x\s*/i).map((p) => p.trim());
    if (parts[0]) height = parts[0];
    if (parts[1]) width = parts[1];
    if (parts[2]) depth = parts[2];
  }

  return { height, width, depth };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateText(str: string, maxLength: number): string {
  if (!str) return "";
  return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
}
