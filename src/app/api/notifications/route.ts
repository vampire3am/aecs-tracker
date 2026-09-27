import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, read: false },
    });
    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load notifications";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH() {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true, message: "Marked all as read" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark notifications read";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
