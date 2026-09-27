import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { BlockerService } from "@/services/BlockerService";
import { resolveBlockerSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = resolveBlockerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const resolved = await BlockerService.resolveBlocker(id, session.userId, parsed.data.resolutionNotes);
    return NextResponse.json({ success: true, blocker: resolved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve blocker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
