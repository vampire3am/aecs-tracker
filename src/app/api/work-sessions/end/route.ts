import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkSessionService } from "@/services/WorkSessionService";
import { endSessionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = endSessionSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const completedSession = await WorkSessionService.endSession(session.userId, notes);
    return NextResponse.json({ success: true, session: completedSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
