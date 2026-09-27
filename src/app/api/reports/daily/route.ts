import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ReportService } from "@/services/ReportService";
import { getLocalDateString } from "@/lib/time";
import { updateDailyReportSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const refresh = searchParams.get("refresh") === "true";

    const workDate = dateParam || getLocalDateString(new Date(), session.timezone);

    const report = refresh
      ? await ReportService.refreshDailyReport(session.userId, workDate)
      : await ReportService.getOrCreateDailyReport(session.userId, workDate);

    return NextResponse.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load daily report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || body.workDate;
    const workDate = dateParam || getLocalDateString(new Date(), session.timezone);

    const parsed = updateDailyReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await ReportService.submitDailyReport(session.userId, workDate, parsed.data);
    return NextResponse.json({ success: true, report: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit daily report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
