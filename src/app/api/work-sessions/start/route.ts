import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkSessionService } from "@/services/WorkSessionService";
import { startSessionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = startSessionSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const workSession = await WorkSessionService.startSession(session.userId, notes);
    return NextResponse.json({ success: true, workSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
