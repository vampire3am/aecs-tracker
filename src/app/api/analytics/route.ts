import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AnalyticsService } from "@/services/AnalyticsService";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "14", 10);

    const data = await AnalyticsService.getUserAnalytics(session.userId, days);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
