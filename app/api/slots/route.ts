import { NextResponse } from "next/server";
import { listAvailableSlots } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

// Public: open consultation slots for the booking horizon. Contains no personal data.
export async function GET() {
  try {
    const days = await listAvailableSlots();
    return NextResponse.json({ days });
  } catch (error) {
    console.error("[slots] listing failed", error);
    return NextResponse.json({ error: "We couldn't load available times. Please try again." }, { status: 503 });
  }
}
