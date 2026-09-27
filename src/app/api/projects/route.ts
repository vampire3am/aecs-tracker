import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ProjectService } from "@/services/ProjectService";
import { createProjectSchema } from "@/lib/validations";
import { ProjectStatus, Priority } from "@prisma/client";

export async function GET() {
  try {
    await requireAuth();
    const projects = await ProjectService.listProjects();
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch projects";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const project = await ProjectService.createProject(
      {
        name: data.name,
        projectKey: data.projectKey,
        description: data.description,
        status: data.status as ProjectStatus,
        priority: data.priority as Priority,
        ownerId: session.userId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
      },
      session.userId
    );

    return NextResponse.json({ success: true, project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
