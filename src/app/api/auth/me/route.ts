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
      notificationPref: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { timezone, workLocation, name, jobTitle, department, notificationPreferences } = body;

    const dataToUpdate: any = {};
    if (timezone) dataToUpdate.timezone = timezone;
    if (workLocation) dataToUpdate.workLocation = workLocation;
    if (name) dataToUpdate.name = name;
    if (jobTitle) dataToUpdate.jobTitle = jobTitle;
    if (department) dataToUpdate.department = department;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: dataToUpdate,
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

    let updatedPref = null;
    if (notificationPreferences) {
      updatedPref = await prisma.notificationPreference.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          sessionReminders: notificationPreferences.sessionReminders ?? true,
          deadlineAlerts: notificationPreferences.deadlineAlerts ?? true,
          blockerAlerts: notificationPreferences.blockerAlerts ?? true,
          weeklyReportReminders: notificationPreferences.weeklyReportReminders ?? true,
          emailAlerts: notificationPreferences.emailAlerts ?? true,
        },
        update: {
          ...(notificationPreferences.sessionReminders !== undefined ? { sessionReminders: notificationPreferences.sessionReminders } : {}),
          ...(notificationPreferences.deadlineAlerts !== undefined ? { deadlineAlerts: notificationPreferences.deadlineAlerts } : {}),
          ...(notificationPreferences.blockerAlerts !== undefined ? { blockerAlerts: notificationPreferences.blockerAlerts } : {}),
          ...(notificationPreferences.weeklyReportReminders !== undefined ? { weeklyReportReminders: notificationPreferences.weeklyReportReminders } : {}),
          ...(notificationPreferences.emailAlerts !== undefined ? { emailAlerts: notificationPreferences.emailAlerts } : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        notificationPref: updatedPref,
      },
    });
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
