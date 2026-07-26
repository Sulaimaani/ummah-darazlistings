import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { galleries, users } from "@/lib/db/schema";
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

      // Resolve presigned URLs and format into { name, url } objects for clean rendering & ZIP download
      const signedGalleries = await Promise.all(
        result.map(async (g) => {
          const generatedUrls = await Promise.all(
            (g.generatedImageKeys || []).map(async (k, idx) => {
              const url = await getPresignedUrlIfNeeded(k);
              // Extract filename from URL or key, or fallback to Slide_X.jpg
              let name = `Slide_${idx + 1}.jpg`;
              try {
                const urlObj = new URL(k.startsWith("http") ? k : `https://dummy.com/${k}`);
                const pathname = urlObj.pathname;
                const basename = pathname.split("/").pop();
                if (basename && basename.includes(".")) {
                  name = decodeURIComponent(basename);
                }
              } catch (e) {
                // Ignore URL parse fallback
              }
              return { name, url };
            })
          );
          return {
            ...g,
            generatedUrls,
            generatedImageKeys: generatedUrls.map((gu) => gu.url),
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

const saveSchema = z.object({
  productName: z.string().optional(),
  generatedImages: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = saveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid gallery payload." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true });
    }

    const { productName, generatedImages } = validation.data;
    const generatedKeys = generatedImages.map((img) => img.url);

    // Ensure user record exists in users table
    const userRow = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userRow.length === 0) {
      try {
        await db
          .insert(users)
          .values({
            clerkId: userId,
            email: "seller@daraz.com",
          })
          .onConflictDoNothing();
      } catch (userErr) {
        console.warn("User auto-creation notice:", userErr);
      }
    }

    const [inserted] = await db
      .insert(galleries)
      .values({
        userId,
        productName: productName || "Product Gallery",
        sourceImageKeys: [],
        generatedImageKeys: generatedKeys,
      })
      .returning();

    return NextResponse.json({ success: true, gallery: inserted });
  } catch (error: any) {
    console.error("POST save gallery error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save gallery." },
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
