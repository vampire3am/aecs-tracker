import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkSessionService } from "@/services/WorkSessionService";
import { startBreakSchema } from "@/lib/validations";
import { BreakType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = startBreakSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { breakType, notes } = parsed.data;
    const newBreak = await WorkSessionService.startBreak(session.userId, breakType as BreakType, notes);
    return NextResponse.json({ success: true, break: newBreak });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start break";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
