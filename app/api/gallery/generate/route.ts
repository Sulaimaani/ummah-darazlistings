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

    if (files.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 product photos allowed." },
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

    const productName = (formData.get("productName") as string) || "Premium Daraz Item";
    const sizeWeightLabel = (formData.get("sizeWeightLabel") as string) || "Standard Pack";
    const topLeftBadgeText = (formData.get("topLeftBadgeText") as string) || "";
    const topRightBadgeText = (formData.get("topRightBadgeText") as string) || sizeWeightLabel;
    const featureCalloutsTitle = (formData.get("featureCalloutsTitle") as string) || "Key Product Features";
    const dimensionsText = (formData.get("dimensionsText") as string) || "Standard Size";
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

    let benefitsList: string[] = [];
    try {
      const benefitsRaw = formData.get("benefitsList") as string;
      if (benefitsRaw) benefitsList = JSON.parse(benefitsRaw);
    } catch (e) {
      benefitsList = [];
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

    // Generate 8 composited gallery slides using sharp engine
    const slides = await generateGallerySlides(sourceBuffers, {
      productName,
      sizeWeightLabel,
      topLeftBadgeText,
      topRightBadgeText,
      featureCalloutsTitle,
      dimensionsText,
      featureCallouts,
      benefitsList,
      logoBuffer,
      logoPosition,
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
