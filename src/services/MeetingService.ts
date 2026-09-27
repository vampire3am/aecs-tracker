import { prisma } from "@/lib/prisma";
import { MeetingType } from "@prisma/client";
import { diffInSeconds } from "@/lib/time";
import { AuditLogService } from "./AuditLogService";

export interface CreateMeetingInput {
  userId: string;
  projectId?: string | null;
  title: string;
  description?: string;
  startedAt: Date;
  endedAt: Date;
  meetingType: MeetingType;
  notes?: string;
  externalUrl?: string;
}

export class MeetingService {
  static async createMeeting(input: CreateMeetingInput) {
    if (input.endedAt < input.startedAt) {
      throw new Error("Meeting end time cannot be before start time.");
    }

    const durationSec = diffInSeconds(input.startedAt, input.endedAt);

    const meeting = await prisma.meeting.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        durationSec,
        meetingType: input.meetingType,
        notes: input.notes,
        externalUrl: input.externalUrl,
      },
      include: {
        project: true,
      },
    });

    await AuditLogService.log({
      userId: input.userId,
      action: "MEETING_CREATE",
      entity: "Meeting",
      entityId: meeting.id,
      metadata: { title: meeting.title, durationSec },
    });

    return meeting;
  }

  static async listUserMeetings(userId: string) {
    return prisma.meeting.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        project: true,
      },
    });
  }
}
