import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { galleries, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateGallerySlides } from "@/lib/gallery-composer";
import { uploadImageBuffer } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access. Please sign in." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least 1 product photo." },
        { status: 400 }
      );
    }

    if (files.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 product photos allowed." },
        { status: 400 }
      );
    }

    // Validate file sizes and types
    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum size limit of 8MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: `File "${file.name}" must be JPG, PNG, or WebP image format.` },
          { status: 400 }
        );
      }
    }

    const productName = (formData.get("productName") as string) || "";
    const sizeWeightLabel = (formData.get("sizeWeightLabel") as string) || "";
    const topLeftBadgeText = (formData.get("topLeftBadgeText") as string) || "";
    const topRightBadgeText = (formData.get("topRightBadgeText") as string) || sizeWeightLabel;
    const featureCalloutsTitle = (formData.get("featureCalloutsTitle") as string) || "";
    const dimensionsText = (formData.get("dimensionsText") as string) || "";
    const heightText = (formData.get("heightText") as string) || "";
    const widthText = (formData.get("widthText") as string) || "";
    const depthText = (formData.get("depthText") as string) || "";
    const dimensionsTitle = (formData.get("dimensionsTitle") as string) || "";
    const multiAngleTitle = (formData.get("multiAngleTitle") as string) || "";

    const versatilityTitle = (formData.get("versatilityTitle") as string) || "";
    const versatilityPill = (formData.get("versatilityPill") as string) || "";
    const versatilitySubheadline = (formData.get("versatilitySubheadline") as string) || "";

    const benefitsTitle = (formData.get("benefitsTitle") as string) || "";
    const packageTitle = (formData.get("packageTitle") as string) || "";
    const packageListTitle = (formData.get("packageListTitle") as string) || "";
    const closingTitle = (formData.get("closingTitle") as string) || "";

    const logoPosition = (formData.get("logoPosition") as any) || "None";

    // Validate and process optional Logo upload (max 2MB)
    const logoFile = formData.get("logo") as File | null;
    let logoBuffer: Buffer | undefined = undefined;
    let logoImageKey: string | null = null;

    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Logo file "${logoFile.name}" exceeds maximum size limit of 2MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(logoFile.type.toLowerCase())) {
        return NextResponse.json(
          { error: `Logo file "${logoFile.name}" must be JPG, PNG, or WebP format.` },
          { status: 400 }
        );
      }

      const logoArrayBuf = await logoFile.arrayBuffer();
      logoBuffer = Buffer.from(logoArrayBuf);
      logoImageKey = await uploadImageBuffer(logoBuffer, `logo_${logoFile.name}`, logoFile.type);
      console.log(`[Generate Route] Uploaded logo to storage: ${logoImageKey}`);
    }

    let featureCallouts: string[] = [];
    try {
      const calloutsRaw = formData.get("featureCallouts") as string;
      if (calloutsRaw) featureCallouts = JSON.parse(calloutsRaw);
    } catch (e) {
      featureCallouts = [];
    }

    let versatilityBullets: string[] = [];
    try {
      const vBulletsRaw = formData.get("versatilityBullets") as string;
      if (vBulletsRaw) versatilityBullets = JSON.parse(vBulletsRaw);
    } catch (e) {
      versatilityBullets = [];
    }

    let benefitsList: any[] = [];
    try {
      const benefitsRaw = formData.get("benefitsList") as string;
      if (benefitsRaw) benefitsList = JSON.parse(benefitsRaw);
    } catch (e) {
      benefitsList = [];
    }

    let packageContents: string[] = [];
    try {
      const pkgRaw = formData.get("packageContents") as string;
      if (pkgRaw) packageContents = JSON.parse(pkgRaw);
    } catch (e) {
      packageContents = [];
    }

    // Read source files into buffers
    const sourceBuffers: Buffer[] = [];
    const sourceKeys: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      sourceBuffers.push(buffer);

      const uploadedUrl = await uploadImageBuffer(buffer, file.name, file.type);
      sourceKeys.push(uploadedUrl);
    }

    // Parse per-slide image overrides
    const SINGLE_IMAGE_SLIDE_KEYS = ["hero", "callouts", "dimensions", "versatility", "benefits", "package", "trust"];
    const slideBuffers: Record<string, Buffer> = {};

    for (const slideKey of SINGLE_IMAGE_SLIDE_KEYS) {
      // Check for a custom uploaded file for this slide
      const customFile = formData.get(`slideImage_${slideKey}`) as File | null;
      if (customFile && customFile.size > 0) {
        const customBuf = Buffer.from(await customFile.arrayBuffer());
        slideBuffers[slideKey] = customBuf;

        // Upload the custom slide image to Spaces too
        const customUrl = await uploadImageBuffer(customBuf, `slide_${slideKey}_${customFile.name}`, customFile.type);
        console.log(`[Generate Route] Uploaded custom slide image for ${slideKey}: ${customUrl}`);
        continue;
      }

      // Check for a pool index override
      const poolIndexStr = formData.get(`slideImagePool_${slideKey}`) as string | null;
      if (poolIndexStr !== null && poolIndexStr !== "") {
        const poolIndex = parseInt(poolIndexStr, 10);
        if (!isNaN(poolIndex) && poolIndex >= 0 && poolIndex < sourceBuffers.length) {
          slideBuffers[slideKey] = sourceBuffers[poolIndex];
        }
      }
    }

    // Generate 8 composited gallery slides using sharp engine
    const slides = await generateGallerySlides(sourceBuffers, {
      productName,
      sizeWeightLabel,
      topLeftBadgeText,
      topRightBadgeText,
      featureCalloutsTitle,
      dimensionsText,
      heightText,
      widthText,
      depthText,
      dimensionsTitle,
      multiAngleTitle,
      versatilityTitle,
      versatilityPill,
      versatilitySubheadline,
      versatilityBullets,
      benefitsTitle,
      benefitsList,
      packageTitle,
      packageListTitle,
      packageContents,
      closingTitle,
      featureCallouts,
      logoBuffer,
      logoPosition,
      slideBuffers: Object.keys(slideBuffers).length > 0 ? slideBuffers : undefined,
    });

    // Upload generated slides to storage
    const generatedUrls: { name: string; url: string }[] = [];
    const generatedKeys: string[] = [];

    for (const slide of slides) {
      const slideUrl = await uploadImageBuffer(slide.buffer, slide.name, "image/jpeg");
      generatedUrls.push({ name: slide.name, url: slideUrl });
      generatedKeys.push(slideUrl);
    }

    // Persist into database if connected
    if (db) {
      try {
        const userRow = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);

        if (userRow.length === 0) {
          await db.insert(users).values({
            clerkId: userId,
            email: "seller@daraz.com",
          });
        }

        await db.insert(galleries).values({
          userId,
          productName,
          sourceImageKeys: sourceKeys,
          generatedImageKeys: generatedKeys,
          logoImageKey: logoImageKey,
        });
      } catch (dbErr) {
        console.warn("DB gallery record save warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      productName,
      generatedImages: generatedUrls,
    });
  } catch (error: any) {
    console.error("Gallery Generation Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate gallery images." },
      { status: 500 }
    );
  }
}
