import sharp from "sharp";

export interface GalleryInputAttributes {
  productName?: string;
  sizeWeightLabel?: string;
  topLeftBadgeText?: string;
  topRightBadgeText?: string;
  featureCalloutsTitle?: string;
  dimensionsText?: string;
  featureCallouts?: string[]; // 3 to 5 bullet callouts
  benefitsList?: string[];
  packageContents?: string[];
  logoBuffer?: Buffer;
  logoPosition?: "Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "None";
}

export async function generateGallerySlides(
  sourceBuffers: Buffer[],
  attrs: GalleryInputAttributes
): Promise<{ buffer: Buffer; name: string }[]> {
  const CANVAS_SIZE = 1200;

  const productName = attrs.productName || "Premium Product Edition";
  const dimensions = attrs.dimensionsText || "Standard Size";
  const userCallouts = (attrs.featureCallouts || []).filter((c) => c.trim().length > 0);
  const callouts =
    userCallouts.length >= 1
      ? userCallouts
      : [
          "Ergonomic Premium Build",
          "High-Efficiency Performance",
          "Durable Weatherproof Finish",
          "Universal Compatibility",
        ];

  const benefits =
    attrs.benefitsList && attrs.benefitsList.length >= 2
      ? attrs.benefitsList
      : [
          "100% High Quality Tested",
          "Maximum Comfort & Precision",
          "Long-Lasting Reliability",
          "Compact & Easy to Use",
        ];

  // Helper to resize and format primary photo with optional drop shadow / padding
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

  const primaryBuf = sourceBuffers[0];
  const secondaryBuf = sourceBuffers[1] || primaryBuf;
  const tertiaryBuf = sourceBuffers[2] || primaryBuf;

  const results: { buffer: Buffer; name: string }[] = [];

  // =========================================================================
  // SLIDE 1: Hero (White background, customizable badges, logo overlay)
  // =========================================================================
  const heroPhoto = await prepareMainPhoto(primaryBuf, 850, 850);

  const topLeftBadge = (attrs.topLeftBadgeText || "").trim();
  const topRightBadge = (attrs.topRightBadgeText || attrs.sizeWeightLabel || "").trim();
  const logoPosition = attrs.logoPosition || "None";
  const hasLogo = Boolean(attrs.logoBuffer && attrs.logoBuffer.length > 0 && logoPosition !== "None");

  // Suppress text badge if custom logo shares that exact corner
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

  const heroSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F8FAFC"/>
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#bgGrad)"/>
      <rect x="20" y="20" width="${CANVAS_SIZE - 40}" height="${CANVAS_SIZE - 40}" fill="none" stroke="#E2E8F0" stroke-width="3" rx="16"/>

      ${topLeftSvg}
      ${topRightSvg}

      <!-- Bottom Footer Banner -->
      <rect x="0" y="1050" width="${CANVAS_SIZE}" height="150" fill="#1E293B"/>
      <text x="${CANVAS_SIZE / 2}" y="1120" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(truncateText(productName, 40))}</text>
      <text x="${CANVAS_SIZE / 2}" y="1160" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" fill="#F57224" text-anchor="middle">PREMIUM QUALITY • ORIGINAL PRODUCT</text>
    </svg>
  `;

  // Prepare composites for Slide 1
  const slide1Composites: sharp.OverlayOptions[] = [
    { input: Buffer.from(heroSvg), top: 0, left: 0 },
    { input: heroPhoto, top: 160, left: (CANVAS_SIZE - 850) / 2 },
  ];

  // Optional Logo Overlay
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
      console.log(`[Composer] Composited logo at position: ${logoPosition}`);
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

  if (!slide1 || slide1.length === 0) {
    throw new Error("[Composer Error] Slide 1 (Hero) generated a 0-byte image buffer");
  }
  console.log(`[Composer] Slide 1 (Hero) successfully composited: ${slide1.length} bytes`);

  results.push({ buffer: slide1, name: "1_Hero_Main_Photo.jpg" });

  // =========================================================================
  // SLIDE 2: Feature Callouts (Auto-Sizing, Word-Wrapping, Reserved Central Photo Zone)
  // =========================================================================
  // Reserved Central Photo Zone: 460x460 centered at left: 370, top: 350
  const calloutPhoto = await prepareMainPhoto(primaryBuf, 460, 460);
  const calloutTitle = attrs.featureCalloutsTitle || "KEY PRODUCT FEATURES";

  // Build Auto-Sizing Callout Boxes
  const calloutBoxSvgParts: string[] = [];
  const connectorLineParts: string[] = [];

  const count = Math.min(5, Math.max(1, callouts.length));

  // Determine Y centers for 1..5 callout items
  let yPositions: { y: number; isRight: boolean }[] = [];
  if (count === 1) {
    yPositions = [{ y: 260, isRight: false }];
  } else if (count === 2) {
    yPositions = [
      { y: 280, isRight: false },
      { y: 280, isRight: true },
    ];
  } else if (count === 3) {
    yPositions = [
      { y: 260, isRight: false },
      { y: 550, isRight: true },
      { y: 840, isRight: false },
    ];
  } else if (count === 4) {
    yPositions = [
      { y: 260, isRight: false },
      { y: 260, isRight: true },
      { y: 840, isRight: false },
      { y: 840, isRight: true },
    ];
  } else {
    // 5 items
    yPositions = [
      { y: 230, isRight: false },
      { y: 230, isRight: true },
      { y: 550, isRight: false },
      { y: 550, isRight: true },
      { y: 850, isRight: false },
    ];
  }

  callouts.slice(0, count).forEach((text, idx) => {
    const pos = yPositions[idx] || { y: 260 + idx * 180, isRight: idx % 2 === 1 };
    const { boxSvg, lineSvg } = createAutoSizedCallout(text, pos.isRight, pos.y);
    calloutBoxSvgParts.push(boxSvg);
    connectorLineParts.push(lineSvg);
  });

  const calloutSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#F57224"/>
      <text x="${CANVAS_SIZE / 2}" y="62" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(calloutTitle.toUpperCase())}</text>

      <!-- Connectors & Auto-Sized Callout Boxes -->
      ${connectorLineParts.join("\n")}
      ${calloutBoxSvgParts.join("\n")}
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
      { input: calloutPhoto, top: 350, left: 370 }, // Reserved Central Photo Zone (460x460)
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide2 || slide2.length === 0) {
    throw new Error("[Composer Error] Slide 2 (Feature Callouts) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 2 (Feature Callouts) composited: ${slide2.length} bytes`);

  results.push({ buffer: slide2, name: "2_Feature_Callouts.jpg" });

  // =========================================================================
  // SLIDE 3: Dimensions Slide
  // =========================================================================
  const dimPhoto = await prepareMainPhoto(primaryBuf, 700, 700);
  const dimSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#1E293B"/>
      <text x="${CANVAS_SIZE / 2}" y="62" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PRODUCT DIMENSIONS &amp; SIZE</text>

      <!-- Height Line (Left) -->
      <line x1="180" y1="260" x2="180" y2="940" stroke="#F57224" stroke-width="4"/>
      <line x1="160" y1="260" x2="200" y2="260" stroke="#F57224" stroke-width="4"/>
      <line x1="160" y1="940" x2="200" y2="940" stroke="#F57224" stroke-width="4"/>
      <g transform="translate(90, 600) rotate(-90)">
        <rect width="180" height="46" rx="8" fill="#F57224"/>
        <text x="90" y="30" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(dimensions)}</text>
      </g>

      <!-- Width Line (Bottom) -->
      <line x1="250" y1="980" x2="950" y2="980" stroke="#F57224" stroke-width="4"/>
      <line x1="250" y1="960" x2="250" y2="1000" stroke="#F57224" stroke-width="4"/>
      <line x1="950" y1="960" x2="950" y2="1000" stroke="#F57224" stroke-width="4"/>
      <g transform="translate(510, 1020)">
        <rect width="180" height="46" rx="8" fill="#F57224"/>
        <text x="90" y="30" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(dimensions)}</text>
      </g>
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

  if (!slide3 || slide3.length === 0) {
    throw new Error("[Composer Error] Slide 3 (Dimensions) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 3 (Dimensions) composited: ${slide3.length} bytes`);

  results.push({ buffer: slide3, name: "3_Dimensions_Spec.jpg" });

  // =========================================================================
  // SLIDE 4: Multi-Angle Grid
  // =========================================================================
  const gridPhoto1 = await prepareMainPhoto(primaryBuf, 520, 520);
  const gridPhoto2 = await prepareMainPhoto(secondaryBuf, 520, 520);
  const gridPhoto3 = await prepareMainPhoto(tertiaryBuf, 520, 520);
  const gridPhoto4 = await prepareMainPhoto(primaryBuf, 520, 520);

  const gridSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#F57224"/>
      <text x="${CANVAS_SIZE / 2}" y="56" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">MULTI-ANGLE SHOWCASE</text>

      <!-- Frame Cards -->
      <rect x="60" y="130" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <rect x="630" y="130" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <rect x="60" y="650" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <rect x="630" y="650" width="510" height="480" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

      <!-- Labels -->
      <text x="315" y="580" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#1E293B" text-anchor="middle">Front Overview</text>
      <text x="885" y="580" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#1E293B" text-anchor="middle">Side Angle</text>
      <text x="315" y="1100" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#1E293B" text-anchor="middle">Detail View</text>
      <text x="885" y="1100" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#1E293B" text-anchor="middle">Compact Fit</text>
    </svg>
  `;

  const slide4 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(gridSvg), top: 0, left: 0 },
      { input: gridPhoto1, top: 140, left: 75 },
      { input: gridPhoto2, top: 140, left: 645 },
      { input: gridPhoto3, top: 660, left: 75 },
      { input: gridPhoto4, top: 660, left: 645 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide4 || slide4.length === 0) {
    throw new Error("[Composer Error] Slide 4 (Multi-Angle Grid) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 4 (Multi-Angle Grid) composited: ${slide4.length} bytes`);

  results.push({ buffer: slide4, name: "4_Multi_Angle_Grid.jpg" });

  // =========================================================================
  // SLIDE 5: Versatility / Multipurpose Banner
  // =========================================================================
  const versaPhoto = await prepareMainPhoto(primaryBuf, 780, 780);
  const versaSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      
      <!-- Header Badge -->
      <rect x="60" y="50" width="280" height="44" rx="22" fill="#F57224"/>
      <text x="200" y="78" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">VERSATILE USE</text>

      <!-- Bottom Banner Block -->
      <rect x="0" y="850" width="${CANVAS_SIZE}" height="350" fill="#1E293B"/>
      <text x="60" y="930" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="40" font-weight="extrabold" fill="#FFFFFF">DESIGNED FOR EVERYDAY PERFORMANCE</text>
      <text x="60" y="980" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="22" fill="#CBD5E1">Suitable for Home, Office, Travel &amp; Heavy Duty Daily Deployment</text>
      
      <!-- Bullet row in banner -->
      <circle cx="80" cy="1050" r="10" fill="#F57224"/>
      <text x="105" y="1056" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">Heavy Duty Resilience</text>
      
      <circle cx="420" cy="1050" r="10" fill="#F57224"/>
      <text x="445" y="1056" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">Easy Operation</text>

      <circle cx="740" cy="1050" r="10" fill="#F57224"/>
      <text x="765" y="1056" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">Universal Fit</text>
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
      { input: versaPhoto, top: 100, left: (CANVAS_SIZE - 780) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide5 || slide5.length === 0) {
    throw new Error("[Composer Error] Slide 5 (Versatility Banner) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 5 (Versatility Banner) composited: ${slide5.length} bytes`);

  results.push({ buffer: slide5, name: "5_Versatility_Banner.jpg" });

  // =========================================================================
  // SLIDE 6: Benefits Slide
  // =========================================================================
  const benefitPhoto = await prepareMainPhoto(primaryBuf, 580, 580);
  const benefitSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="90" fill="#1E293B"/>
      <text x="${CANVAS_SIZE / 2}" y="56" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">WHY CHOOSE THIS PRODUCT?</text>

      <!-- Benefits List Cards (Right side) -->
      ${benefits
        .slice(0, 4)
        .map(
          (b, idx) => `
        <g transform="translate(620, ${150 + idx * 240})">
          <rect width="520" height="200" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
          <circle cx="45" cy="50" r="22" fill="#F57224"/>
          <text x="45" y="58" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓</text>
          <text x="85" y="56" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#1E293B">${escapeXml(truncateText(b, 26))}</text>
          <text x="45" y="115" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="16" fill="#64748B">Tested &amp; engineered for maximum quality, safety and long-term seller satisfaction.</text>
        </g>
      `
        )
        .join("")}
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
      { input: benefitPhoto, top: 310, left: 30 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide6 || slide6.length === 0) {
    throw new Error("[Composer Error] Slide 6 (Product Benefits) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 6 (Product Benefits) composited: ${slide6.length} bytes`);

  results.push({ buffer: slide6, name: "6_Product_Benefits.jpg" });

  // =========================================================================
  // SLIDE 7: Package Showcase / What's in the Box
  // =========================================================================
  const pkgPhoto = await prepareMainPhoto(primaryBuf, 750, 750);
  const pkgSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#F57224"/>
      <text x="${CANVAS_SIZE / 2}" y="62" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle">WHAT IS IN THE PACKAGE?</text>

      <!-- Package Items Overlay Box (Bottom) -->
      <rect x="60" y="860" width="1080" height="280" rx="20" fill="#1E293B"/>
      <text x="100" y="920" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#F57224">Package Contents List:</text>
      
      <text x="100" y="970" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" fill="#FFFFFF">• 1x ${escapeXml(truncateText(productName, 35))}</text>
      <text x="100" y="1010" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" fill="#FFFFFF">• 1x High-Speed Charging Cable / Accessories</text>
      <text x="100" y="1050" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" fill="#FFFFFF">• 1x User Operation Manual &amp; Warranty Card</text>
      <text x="100" y="1090" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" fill="#FFFFFF">• 1x Protective Safe-Dispatch Packaging Box</text>
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
      { input: pkgPhoto, top: 120, left: (CANVAS_SIZE - 750) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide7 || slide7.length === 0) {
    throw new Error("[Composer Error] Slide 7 (Package Contents) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 7 (Package Contents) composited: ${slide7.length} bytes`);

  results.push({ buffer: slide7, name: "7_Package_Contents.jpg" });

  // =========================================================================
  // SLIDE 8: Branded Closing / Seller Protection Slide
  // =========================================================================
  const closingPhoto = await prepareMainPhoto(primaryBuf, 700, 700);
  const closingSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      
      <!-- Top Banner -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="120" fill="#1E293B"/>
      <text x="${CANVAS_SIZE / 2}" y="70" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(truncateText(productName, 40))}</text>

      <!-- Trust Badges (Bottom Grid) -->
      <g transform="translate(60, 920)">
        <!-- Badge 1 -->
        <rect x="0" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="170" cy="55" r="30" fill="#F57224"/>
        <text x="170" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">★</text>
        <text x="170" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#1E293B" text-anchor="middle">100% Quality Tested</text>
        <text x="170" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Inspected before dispatch</text>

        <!-- Badge 2 -->
        <rect x="370" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="540" cy="55" r="30" fill="#1E293B"/>
        <text x="540" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">⚡</text>
        <text x="540" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#1E293B" text-anchor="middle">Fast Shipping</text>
        <text x="540" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Express Daraz fulfillment</text>

        <!-- Badge 3 -->
        <rect x="740" y="0" width="340" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <circle cx="910" cy="55" r="30" fill="#10B981"/>
        <text x="910" y="65" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">✓</text>
        <text x="910" y="125" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#1E293B" text-anchor="middle">Buyer Protection</text>
        <text x="910" y="150" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Hassle-free replacement</text>
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

  if (!slide8 || slide8.length === 0) {
    throw new Error("[Composer Error] Slide 8 (Branded Closing) generated a 0-byte buffer");
  }
  console.log(`[Composer] Slide 8 (Branded Closing) composited: ${slide8.length} bytes`);

  results.push({ buffer: slide8, name: "8_Branded_Seller_Trust.jpg" });

  return results;
}

function createAutoSizedCallout(
  text: string,
  isRightSide: boolean,
  yCenter: number
): { boxSvg: string; lineSvg: string } {
  const CANVAS_SIZE = 1200;
  const maxLineLength = 22;

  let lines: string[] = [];
  if (text.length > maxLineLength) {
    const words = text.trim().split(/\s+/);
    let line1 = "";
    let line2 = "";
    for (const w of words) {
      if ((line1 + " " + w).trim().length <= maxLineLength) {
        line1 = (line1 + " " + w).trim();
      } else {
        line2 = (line2 + " " + w).trim();
      }
    }
    lines = line2 ? [line1, line2] : [text];
  } else {
    lines = [text];
  }

  const maxLen = Math.max(...lines.map((l) => l.length));
  const boxWidth = Math.min(390, Math.max(240, maxLen * 13 + 70));
  const boxHeight = lines.length > 1 ? 105 : 75;

  let posX = 50;
  let lineX1 = posX + boxWidth;
  let lineX2 = 380;

  if (isRightSide) {
    posX = CANVAS_SIZE - 50 - boxWidth;
    lineX1 = posX;
    lineX2 = 820;
  }

  const circleY = boxHeight / 2;

  const textLinesSvg = lines
    .map((line, i) => {
      const lineY = lines.length > 1 ? (i === 0 ? 36 : 70) : 46;
      return `<text x="50" y="${lineY}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#1E293B">${escapeXml(line)}</text>`;
    })
    .join("");

  const boxSvg = `
    <g transform="translate(${posX}, ${yCenter - boxHeight / 2})">
      <rect width="${boxWidth}" height="${boxHeight}" rx="14" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
      <circle cx="24" cy="${circleY}" r="12" fill="#F57224"/>
      <text x="24" y="${circleY + 5}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓</text>
      ${textLinesSvg}
    </g>
  `;

  const targetPhotoY = Math.min(780, Math.max(380, yCenter));
  const lineSvg = `
    <line x1="${lineX1}" y1="${yCenter}" x2="${lineX2}" y2="${targetPhotoY}" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>
  `;

  return { boxSvg, lineSvg };
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
