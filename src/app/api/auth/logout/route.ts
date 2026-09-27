import { NextResponse } from "next/server";
import { getSessionCookieName, getCurrentUser } from "@/lib/auth";
import { AuditLogService } from "@/services/AuditLogService";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await AuditLogService.log({
      userId: user.userId,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: user.userId,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(getSessionCookieName());
  return response;
}
