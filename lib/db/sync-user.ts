import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function syncUser(clerkId: string, email: string) {
  if (!db) {
    console.warn("Database connection skipped (DATABASE_URL not configured).");
    return null;
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].email !== email) {
        await db
          .update(users)
          .set({ email })
          .where(eq(users.clerkId, clerkId));
      }
      return existing[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        clerkId,
        email: email || "user@example.com",
      })
      .returning();

    return inserted[0] || null;
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return null;
  }
}
