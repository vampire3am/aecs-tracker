import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MeetingService } from "@/services/MeetingService";
import { createMeetingSchema } from "@/lib/validations";
import { MeetingType } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireAuth();
    const meetings = await MeetingService.listUserMeetings(session.userId);
    return NextResponse.json({ meetings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch meetings";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const meeting = await MeetingService.createMeeting({
      userId: session.userId,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(data.endedAt),
      meetingType: data.meetingType as MeetingType,
      notes: data.notes,
      externalUrl: data.externalUrl,
    });

    return NextResponse.json({ success: true, meeting });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create meeting";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
