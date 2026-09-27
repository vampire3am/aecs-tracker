import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DeterministicReportService } from "@/services/DeterministicReportService";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);

    const monthly = await DeterministicReportService.generateMonthlyReport(session.userId, year, month);
    return NextResponse.json({ report: monthly });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load monthly report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
