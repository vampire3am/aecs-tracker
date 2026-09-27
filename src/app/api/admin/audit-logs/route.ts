import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { AuditLogService } from "@/services/AuditLogService";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER]);
    const logs = await AuditLogService.getRecentLogs(100);
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
