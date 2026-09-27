import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkLogService } from "@/services/WorkLogService";
import { createWorkLogSchema } from "@/lib/validations";
import { WorkCategory } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const whereClause: Record<string, unknown> = {
      userId: session.userId,
    };

    if (projectId) whereClause.projectId = projectId;
    if (taskId) whereClause.taskId = taskId;
    if (category) whereClause.category = category as WorkCategory;
    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }
    if (startDate && endDate) {
      whereClause.startedAt = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const workLogs = await prisma.workLog.findMany({
      where: whereClause,
      orderBy: { startedAt: "desc" },
      include: {
        project: { select: { id: true, name: true, projectKey: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
      },
    });

    return NextResponse.json({ workLogs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch work logs";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createWorkLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const workLog = await WorkLogService.createLog({
      userId: session.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      category: data.category as WorkCategory,
      description: data.description,
      durationSec: data.durationSec,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      status: data.status,
      notes: data.notes,
      externalRef: data.externalRef,
    });

    return NextResponse.json({ success: true, workLog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create work log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
