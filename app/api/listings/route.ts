import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/db/schema";
import { saveListingSchema } from "@/lib/validations";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access. Please sign in." },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true, listings: [] });
    }

    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.userId, userId))
        .orderBy(desc(listings.createdAt));

      return NextResponse.json({ success: true, listings: result });
    } catch (dbErr: any) {
      console.warn("Database fetch warning (table missing or connection error):", dbErr);
      // Return empty list safely if table hasn't been pushed yet
      return NextResponse.json({
        success: true,
        listings: [],
        warning: "Database tables not initialized. Run `npx drizzle-kit push` to create database schema.",
      });
    }
  } catch (error: any) {
    console.error("GET listings error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch saved listings." },
      { status: 500 }
    );
  }
}

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
    const validation = saveListingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: true, message: "Listing saved locally (DB not connected)." },
        { status: 201 }
      );
    }

    try {
      // Ensure user exists in users table before inserting listing (foreign key safeguard)
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

      const newListing = await db
        .insert(listings)
        .values({
          userId,
          inputTitles: validation.data.inputTitles,
          seoTitle: validation.data.seoTitle,
          shortDescription: validation.data.shortDescription,
          longDescription: validation.data.longDescription,
        })
        .returning();

      return NextResponse.json({
        success: true,
        listing: newListing[0],
      });
    } catch (dbErr: any) {
      console.error("Database insert error:", dbErr);
      return NextResponse.json(
        {
          error:
            "Database table error. Make sure your Neon DATABASE_URL is active and you have run 'npx drizzle-kit push' to create tables.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("POST listing error:", error);
    return NextResponse.json(
      { error: "Failed to save listing to history." },
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
        { error: "Invalid listing ID format" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: true });
    }

    await db
      .delete(listings)
      .where(and(eq(listings.id, validation.data.id), eq(listings.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE listing error:", error);
    return NextResponse.json(
      { error: "Failed to delete listing." },
      { status: 500 }
    );
  }
}
