import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AchievementService } from "@/services/AchievementService";
import { createAchievementSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireAuth();
    const achievements = await AchievementService.listUserAchievements(session.userId);
    return NextResponse.json({ achievements });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch achievements";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createAchievementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const achievement = await AchievementService.createAchievement({
      userId: session.userId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      category: data.category,
      notes: data.notes,
    });

    return NextResponse.json({ success: true, achievement });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create achievement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
