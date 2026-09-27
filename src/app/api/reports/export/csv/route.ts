import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDurationHuman } from "@/lib/time";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "worklogs";

    if (type === "worklogs") {
      const logs = await prisma.workLog.findMany({
        where: { userId: session.userId },
        orderBy: { startedAt: "desc" },
        include: {
          project: { select: { name: true, projectKey: true } },
          task: { select: { title: true } },
        },
      });

      const header = ["Date", "Project", "Task", "Category", "Description", "Duration (Human)", "Duration (Sec)", "Status"];
      const rows = logs.map((l) => [
        `"${l.startedAt.toISOString().split("T")[0]}"`,
        `"${l.project.name.replace(/"/g, '""')}"`,
        `"${(l.task?.title || "N/A").replace(/"/g, '""')}"`,
        `"${l.category}"`,
        `"${l.description.replace(/"/g, '""')}"`,
        `"${formatDurationHuman(l.durationSec)}"`,
        l.durationSec.toString(),
        `"${l.status}"`,
      ]);

      const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aecs-tracker-worklogs-${Date.now()}.csv"`,
        },
      });
    } else {
      // Export sessions
      const sessions = await prisma.workSession.findMany({
        where: { userId: session.userId },
        orderBy: { workDate: "desc" },
      });

      const header = ["Date", "Started At", "Ended At", "Status", "Total Duration", "Break Duration", "Net Work Duration"];
      const rows = sessions.map((s) => [
        `"${s.workDate}"`,
        `"${s.startedAt.toISOString()}"`,
        `"${s.endedAt ? s.endedAt.toISOString() : "ACTIVE"}"`,
        `"${s.status}"`,
        `"${formatDurationHuman(s.totalDurationSec)}"`,
        `"${formatDurationHuman(s.breakDurationSec)}"`,
        `"${formatDurationHuman(s.netWorkDurationSec)}"`,
      ]);

      const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aecs-tracker-sessions-${Date.now()}.csv"`,
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export CSV";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
