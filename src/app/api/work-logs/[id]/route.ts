import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkLogService } from "@/services/WorkLogService";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const updated = await WorkLogService.updateLog(id, session.userId, body);
    return NextResponse.json({ success: true, workLog: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update work log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await WorkLogService.deleteLog(id, session.userId);
    return NextResponse.json({ success: true, message: "Work log deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete work log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
