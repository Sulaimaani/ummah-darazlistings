import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { galleries } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { getPresignedUrlIfNeeded } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true, galleries: [] });
    }

    try {
      const result = await db
        .select()
        .from(galleries)
        .where(eq(galleries.userId, userId))
        .orderBy(desc(galleries.createdAt));

      // Resolve presigned URLs for preview rendering
      const signedGalleries = await Promise.all(
        result.map(async (g) => {
          const generatedUrls = await Promise.all(
            (g.generatedImageKeys || []).map((k) => getPresignedUrlIfNeeded(k))
          );
          return {
            ...g,
            generatedImageKeys: generatedUrls,
          };
        })
      );

      return NextResponse.json({ success: true, galleries: signedGalleries });
    } catch (dbErr) {
      console.warn("Database fetch warning for galleries:", dbErr);
      return NextResponse.json({ success: true, galleries: [] });
    }
  } catch (error: any) {
    console.error("GET galleries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved galleries." },
      { status: 500 }
    );
  }
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const validation = deleteSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid gallery ID format" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true });
    }

    await db
      .delete(galleries)
      .where(and(eq(galleries.id, validation.data.id), eq(galleries.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE gallery error:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery." },
      { status: 500 }
    );
  }
}
