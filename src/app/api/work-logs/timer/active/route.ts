import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkLogService } from "@/services/WorkLogService";

export async function GET() {
  try {
    const session = await requireAuth();
    const active = await WorkLogService.getActiveTimer(session.userId);
    return NextResponse.json({ activeTimer: active });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get active timer";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
