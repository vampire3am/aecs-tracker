import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, WorkLocation } from "@prisma/client";
import { AuditLogService } from "@/services/AuditLogService";

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        jobTitle: true,
        department: true,
        role: true,
        workLocation: true,
        timezone: true,
        workingHoursPerDay: true,
        createdAt: true,
        team: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const body = await req.json();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email.toLowerCase() }, { employeeId: body.employeeId }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or Employee ID already in use" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.password || "TempPassword123!");

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        employeeId: body.employeeId,
        jobTitle: body.jobTitle || "Engineer",
        department: body.department || "Engineering",
        role: (body.role as Role) || Role.EMPLOYEE,
        workLocation: (body.workLocation as WorkLocation) || WorkLocation.REMOTE,
        timezone: body.timezone || "UTC",
        teamId: body.teamId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
      },
    });

    await AuditLogService.log({
      userId: session.userId,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
