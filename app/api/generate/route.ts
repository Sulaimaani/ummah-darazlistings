import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateListingSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateDarazListing } from "@/lib/ai";
import { syncUser } from "@/lib/db/sync-user";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access. Please sign in." },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses[0]?.emailAddress || "seller@daraz.com";
    await syncUser(userId, primaryEmail);

    // Rate Limiting Check
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Hourly rate limit reached (15 listings/hr). Try again in ${Math.ceil(
            rateLimit.resetInSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = generateListingSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { titles } = validation.data;
    const result = await generateDarazListing(titles);

    return NextResponse.json({
      success: true,
      data: result,
      remainingCredits: rateLimit.remaining,
    });
  } catch (error: any) {
    console.error("API Generate Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate Daraz listing. Please try again." },
      { status: 500 }
    );
  }
}
