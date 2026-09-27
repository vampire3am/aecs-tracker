import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkLogService } from "@/services/WorkLogService";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { workLogId, notes } = body;

    if (!workLogId) {
      return NextResponse.json({ error: "Work log ID is required" }, { status: 400 });
    }

    const stopped = await WorkLogService.stopTaskTimer(workLogId, notes);
    return NextResponse.json({ success: true, workLog: stopped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to stop timer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
