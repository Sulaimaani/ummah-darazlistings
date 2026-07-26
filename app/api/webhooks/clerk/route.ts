import { NextResponse } from "next/server";
import { syncUser } from "@/lib/db/sync-user";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload?.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses } = payload.data;
      const primaryEmail = email_addresses?.[0]?.email_address || "";
      if (id) {
        await syncUser(id, primaryEmail);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Clerk Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
