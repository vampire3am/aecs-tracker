import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DeterministicReportService } from "@/services/DeterministicReportService";
import { startOfWeek, format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("startDate");

    const weekStartDate = startParam || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const weekly = await DeterministicReportService.generateWeeklyReport(session.userId, weekStartDate);
    return NextResponse.json({ report: weekly });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load weekly report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
