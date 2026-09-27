import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, getSessionCookieName } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { AuditLogService } from "@/services/AuditLogService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      employeeId: user.employeeId,
      role: user.role,
      timezone: user.timezone,
    });

    await AuditLogService.log({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        timezone: user.timezone,
        workLocation: user.workLocation,
        avatarUrl: user.avatarUrl,
      },
    });

    const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") || !process.env.NEXT_PUBLIC_APP_URL;
    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production" && !isLocalhost,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
