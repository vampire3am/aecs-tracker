import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { TaskService } from "@/services/TaskService";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const task = await TaskService.getTaskDetails(id);
    return NextResponse.json({ task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Task not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const updated = await TaskService.updateTask(id, session.userId, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    return NextResponse.json({ success: true, task: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await TaskService.deleteTask(id, session.userId);
    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
