import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { uploadImageBuffer } from "@/lib/storage";
import {
  removeBackground,
  compositeProductOnBackground,
  enhanceProductPhoto,
  BackgroundPreset,
} from "@/lib/studio-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const processSchema = z.object({
  mode: z.enum(["bg_replace", "enhance"]),
  preset: z.enum(["white_studio", "soft_gradient", "kitchen_counter", "marble_surface", "wood_surface"]).optional(),
});

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
    const file = formData.get("photo") as File | null;
    const mode = (formData.get("mode") as string) || "bg_replace";
    const preset = (formData.get("preset") as BackgroundPreset) || "white_studio";

    // Validate parameters
    const parsed = processSchema.safeParse({ mode, preset });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid studio parameters provided." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Please upload a product photo." },
        { status: 400 }
      );
    }

    // Validate file size and format
    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds max limit of 8MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `File "${file.name}" must be JPG, PNG, or WebP image format.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    let outputBuffer: Buffer;
    let filenameSuffix = "studio_result.jpg";

    if (mode === "bg_replace") {
      console.log(`[Studio Route] Processing background replacement with preset: ${preset}`);
      // Step 1: Isolate subject via API
      const isolatedPng = await removeBackground(imageBuffer);
      // Step 2: Composite isolated subject onto chosen Sharp preset
      outputBuffer = await compositeProductOnBackground(isolatedPng, preset);
      filenameSuffix = `bg_${preset}_${file.name}`;
    } else {
      console.log(`[Studio Route] Processing photo enhancement for: ${file.name}`);
      outputBuffer = await enhanceProductPhoto(imageBuffer);
      filenameSuffix = `enhanced_${file.name}`;
    }

    // Upload processed studio image buffer to Spaces
    const imageUrl = await uploadImageBuffer(outputBuffer, filenameSuffix, "image/jpeg");

    return NextResponse.json({
      success: true,
      imageUrl,
      mode,
      preset: mode === "bg_replace" ? preset : undefined,
    });
  } catch (error: any) {
    console.error("[Studio API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process photo in AI Product Studio." },
      { status: 500 }
    );
  }
}
