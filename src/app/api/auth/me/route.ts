import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      employeeId: true,
      jobTitle: true,
      department: true,
      workLocation: true,
      role: true,
      timezone: true,
      workingHoursPerDay: true,
      avatarUrl: true,
      joiningDate: true,
      team: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
