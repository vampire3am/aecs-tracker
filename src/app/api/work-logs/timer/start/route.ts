import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkLogService } from "@/services/WorkLogService";
import { WorkCategory } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { taskId, category } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const timerLog = await WorkLogService.startTaskTimer(
      session.userId,
      taskId,
      (category as WorkCategory) || WorkCategory.DEVELOPMENT
    );

    return NextResponse.json({ success: true, timerLog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start timer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
