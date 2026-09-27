import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkSessionService } from "@/services/WorkSessionService";

export async function GET() {
  try {
    const session = await requireAuth();
    const state = await WorkSessionService.getCurrentState(session.userId);
    return NextResponse.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get session state";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
