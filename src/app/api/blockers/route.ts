import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { BlockerService } from "@/services/BlockerService";
import { createBlockerSchema } from "@/lib/validations";
import { Priority } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireAuth();
    const blockers = await BlockerService.listOpenBlockers(session.userId);
    return NextResponse.json({ blockers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch blockers";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createBlockerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const blocker = await BlockerService.createBlocker({
      userId: session.userId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      taskId: data.taskId,
      waitingFor: data.waitingFor,
      impact: data.impact,
      priority: data.priority as Priority,
    });

    return NextResponse.json({ success: true, blocker });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create blocker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
