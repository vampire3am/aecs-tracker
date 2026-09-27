import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkSessionService } from "@/services/WorkSessionService";
import { endBreakSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = endBreakSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const endedBreak = await WorkSessionService.endBreak(session.userId, notes);
    return NextResponse.json({ success: true, break: endedBreak });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to end break";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
