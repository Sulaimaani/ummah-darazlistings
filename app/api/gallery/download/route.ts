import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "single" or "zip"
    const singleUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "gallery_image.jpg";
    const productName = searchParams.get("productName") || "Daraz-Gallery";

    // Mode 1: Single Image Download Proxy
    if (mode === "single" || singleUrl) {
      if (!singleUrl) {
        return NextResponse.json({ error: "Missing image URL parameter" }, { status: 400 });
      }

      console.log(`[Download Proxy] Fetching single image: ${filename}`);
      const imageRes = await fetch(singleUrl);

      if (!imageRes.ok) {
        throw new Error(`Failed to fetch image from storage (HTTP ${imageRes.status})`);
      }

      const arrayBuffer = await imageRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = imageRes.headers.get("content-type") || "image/jpeg";

      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${cleanFilename}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // Mode 2: Multi-Image ZIP Download Proxy
    if (mode === "zip") {
      const urlsParam = searchParams.get("urls");
      if (!urlsParam) {
        return NextResponse.json({ error: "Missing urls parameter for ZIP generation" }, { status: 400 });
      }

      let items: { name: string; url: string }[] = [];
      try {
        items = JSON.parse(urlsParam);
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON format for urls parameter" }, { status: 400 });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "No image URLs provided for ZIP download" }, { status: 400 });
      }

      console.log(`[ZIP Proxy] Packaging ${items.length} images into ZIP for "${productName}"`);

      const zip = new JSZip();
      const folder = zip.folder("Daraz-Gallery-Slides");

      // Fetch all images server-to-server (bypasses browser CORS)
      const fetchPromises = items.map(async (item, idx) => {
        try {
          const imgRes = await fetch(item.url);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const slideName = item.name || `slide_${idx + 1}.jpg`;
            folder?.file(slideName, buf);
          }
        } catch (err) {
          console.error(`Failed to fetch slide #${idx + 1} for ZIP:`, err);
        }
      });

      await Promise.all(fetchPromises);

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      const cleanZipName = `${productName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Gallery.zip`;

      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${cleanZipName}"`,
          "Content-Length": zipBuffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid download mode specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Download Proxy Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to download image asset." },
      { status: 500 }
    );
  }
}
