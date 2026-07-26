import sharp from "sharp";

export interface GalleryInputAttributes {
  productName?: string;
  sizeWeightLabel?: string;
  dimensionsText?: string;
  featureCallouts?: string[]; // 3 to 5 bullet callouts
  benefitsList?: string[];
  packageContents?: string[];
}

export async function generateGallerySlides(
  sourceBuffers: Buffer[],
  attrs: GalleryInputAttributes
): Promise<{ buffer: Buffer; name: string }[]> {
  const CANVAS_SIZE = 1200;

  const productName = attrs.productName || "Premium Product Edition";
  const sizeWeight = attrs.sizeWeightLabel || "Official Edition";
  const dimensions = attrs.dimensionsText || "Standard Size";
  const callouts =
    attrs.featureCallouts && attrs.featureCallouts.length >= 2
      ? attrs.featureCallouts
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
  // SLIDE 1: Hero (White background, size badge, product name footer)
  // =========================================================================
  const heroPhoto = await prepareMainPhoto(primaryBuf, 850, 850);
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

      <!-- Size / Weight Badge -->
      <g transform="translate(900, 70)">
        <rect width="220" height="60" rx="30" fill="#F57224"/>
        <text x="110" y="38" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(sizeWeight)}</text>
      </g>

      <!-- Top Brand Tag -->
      <g transform="translate(60, 80)">
        <rect width="200" height="40" rx="8" fill="#1E293B"/>
        <text x="100" y="26" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">DARAZ VERIFIED</text>
      </g>

      <!-- Bottom Footer Banner -->
      <rect x="0" y="1050" width="${CANVAS_SIZE}" height="150" fill="#1E293B"/>
      <text x="${CANVAS_SIZE / 2}" y="1120" font-family="sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(truncateText(productName, 40))}</text>
      <text x="${CANVAS_SIZE / 2}" y="1160" font-family="sans-serif" font-size="18" fill="#F57224" text-anchor="middle">PREMIUM QUALITY • ORIGINAL PRODUCT</text>
    </svg>
  `;

  const slide1 = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(heroSvg), top: 0, left: 0 },
      { input: heroPhoto, top: 160, left: (CANVAS_SIZE - 850) / 2 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  if (!slide1 || slide1.length === 0) {
    throw new Error("[Composer Error] Slide 1 (Hero) generated a 0-byte image buffer");
  }
  console.log(`[Composer] Slide 1 (Hero) successfully composited: ${slide1.length} bytes`);

  results.push({ buffer: slide1, name: "1_Hero_Main_Photo.jpg" });

  // =========================================================================
  // SLIDE 2: Feature Callouts
  // =========================================================================
  const calloutPhoto = await prepareMainPhoto(primaryBuf, 620, 620);
  const callout1 = callouts[0] || "Ergonomic Build";
  const callout2 = callouts[1] || "High Performance";
  const callout3 = callouts[2] || "Heavy Duty Finish";
  const callout4 = callouts[3] || "Universal Precision";

  const calloutSvg = `
    <svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#F8FAFC"/>
      
      <!-- Top Title -->
      <rect x="0" y="0" width="${CANVAS_SIZE}" height="100" fill="#F57224"/>
      <text x="${CANVAS_SIZE / 2}" y="62" font-family="sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle">KEY PRODUCT FEATURES</text>

      <!-- Connectors & Callout Boxes -->
      <!-- Callout 1 (Top Left) -->
      <g transform="translate(60, 220)">
        <rect width="320" height="90" rx="12" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
        <circle cx="25" cy="45" r="12" fill="#F57224"/>
        <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1E293B">${escapeXml(truncateText(callout1, 24))}</text>
      </g>
      <line x1="380" y1="265" x2="480" y2="380" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>

      <!-- Callout 2 (Top Right) -->
      <g transform="translate(820, 220)">
        <rect width="320" height="90" rx="12" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
        <circle cx="25" cy="45" r="12" fill="#F57224"/>
        <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1E293B">${escapeXml(truncateText(callout2, 24))}</text>
      </g>
      <line x1="820" y1="265" x2="720" y2="380" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>

      <!-- Callout 3 (Bottom Left) -->
      <g transform="translate(60, 800)">
        <rect width="320" height="90" rx="12" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
        <circle cx="25" cy="45" r="12" fill="#F57224"/>
        <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1E293B">${escapeXml(truncateText(callout3, 24))}</text>
      </g>
      <line x1="380" y1="845" x2="480" y2="720" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>

      <!-- Callout 4 (Bottom Right) -->
      <g transform="translate(820, 800)">
        <rect width="320" height="90" rx="12" fill="#FFFFFF" stroke="#F57224" stroke-width="3"/>
        <circle cx="25" cy="45" r="12" fill="#F57224"/>
        <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1E293B">${escapeXml(truncateText(callout4, 24))}</text>
      </g>
      <line x1="820" y1="845" x2="720" y2="720" stroke="#F57224" stroke-width="3" stroke-dasharray="6,6"/>
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
      { input: calloutPhoto, top: 280, left: 290 },
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
