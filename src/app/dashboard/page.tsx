"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkSessionWidget } from "@/components/work/WorkSessionWidget";
import { AddWorkLogModal } from "@/components/work/AddWorkLogModal";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Video,
  Plus,
  Play,
  FileText,
  Calendar,
  ChevronRight,
  TrendingUp,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { formatDurationHuman } from "@/lib/time";

export default function DashboardPage() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    netWorkSec: 0,
    completedTasksToday: 0,
    pendingTasksCount: 0,
    meetingsTodayCount: 0,
    openBlockersCount: 0,
  });
  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);
  const [dailyReportPreview, setDailyReportPreview] = useState<any | null>(null);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) return;
      const userData = await userRes.json();
      setUser(userData.user);

      // 2. Fetch today's work logs
      const logsRes = await fetch("/api/work-logs");
      const logsData = await logsRes.json();

      // 3. Fetch tasks
      const tasksRes = await fetch("/api/tasks?myTasks=true");
      const tasksData = await tasksRes.json();

      // 4. Fetch meetings
      const meetingsRes = await fetch("/api/meetings");
      const meetingsData = await meetingsRes.json();

      // 5. Fetch blockers
      const blockersRes = await fetch("/api/blockers");
      const blockersData = await blockersRes.json();

      // 6. Fetch daily report draft
      const reportRes = await fetch("/api/reports/daily");
      const reportData = await reportRes.json();

      const tasksList = tasksData.tasks || [];
      const pendingCount = tasksList.filter((t: any) => t.status !== "COMPLETED").length;
      const completedToday = tasksList.filter((t: any) => t.status === "COMPLETED").length;

      setStats({
        completedTasksToday: completedToday,
        pendingTasksCount: pendingCount,
        meetingsTodayCount: meetingsData.meetings?.length || 0,
        openBlockersCount: blockersData.blockers?.length || 0,
      });

      if (reportData?.report) {
        setDailyReportPreview(reportData.report);
      }

      // Build chronological activity timeline
      const timeline: any[] = [];

      (logsData.workLogs || []).forEach((l: any) => {
        timeline.push({
          id: `log-${l.id}`,
          type: "WORK_LOG",
          title: l.description,
          subtitle: `${l.project.name} • ${formatDurationHuman(l.durationSec)}`,
          category: l.category,
          timestamp: new Date(l.startedAt),
        });
      });

      (meetingsData.meetings || []).forEach((m: any) => {
        timeline.push({
          id: `meeting-${m.id}`,
          type: "MEETING",
          title: m.title,
          subtitle: `Meeting • ${formatDurationHuman(m.durationSec)}`,
          timestamp: new Date(m.startedAt),
        });
      });

      (blockersData.blockers || []).forEach((b: any) => {
        timeline.push({
          id: `blocker-${b.id}`,
          type: "BLOCKER",
          title: `Blocker: ${b.title}`,
          subtitle: `Waiting for: ${b.waitingFor || "External"}`,
          priority: b.priority,
          timestamp: new Date(b.startedAt),
        });
      });

      timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivityTimeline(timeline);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleLogAdded = () => fetchDashboardData();
    window.addEventListener("work-log-added", handleLogAdded);
    return () => window.removeEventListener("work-log-added", handleLogAdded);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Greeting & Today Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {getGreeting()}, {user?.name ? user.name.split(" ")[0] : "there"} 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Today is {todayFormatted} &bull; Timezone: {user?.timezone || "UTC"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddLogOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Work Log
            </button>
            <Link
              href="/reports"
              className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              View Today&apos;s Report
            </Link>
          </div>
        </div>

        {/* 1. Core Work Session Control Widget */}
        <WorkSessionWidget
          onAddWorkLogClick={() => setIsAddLogOpen(true)}
          onSessionChange={fetchDashboardData}
        />

        {/* 2. Key Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Completed Tasks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Completed
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.completedTasksToday}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Tasks
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.pendingTasksCount}
              </div>
            </div>
          </div>

          {/* Meetings */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Meetings
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.meetingsTodayCount}
              </div>
            </div>
          </div>

          {/* Open Blockers */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Open Blockers
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.openBlockersCount}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Dashboard Grid: Activity Timeline + Daily Report Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Chronological Activity Timeline */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today&apos;s Activity Timeline</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chronological trail of work logs, meetings, and blocker events
                </p>
              </div>
              <Link
                href="/work"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                View all logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {activityTimeline.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No activity recorded yet today. Click &quot;Add Work Log&quot; or start a task timer to begin!
                </div>
              ) : (
                activityTimeline.slice(0, 7).map((item, idx) => (
                  <div key={item.id} className="relative flex items-start gap-4">
                    {/* Connecting line */}
                    {idx < Math.min(activityTimeline.length - 1, 6) && (
                      <span
                        className="absolute left-3.5 top-6 bottom-[-16px] w-[1px] bg-slate-200 dark:bg-slate-800"
                        aria-hidden="true"
                      />
                    )}

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold ${
                        item.type === "WORK_LOG"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 ring-4 ring-white dark:ring-slate-900"
                          : item.type === "MEETING"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 ring-4 ring-white dark:ring-slate-900"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 ring-4 ring-white dark:ring-slate-900"
                      }`}
                    >
                      {item.type === "WORK_LOG" && <Clock className="w-3.5 h-3.5" />}
                      {item.type === "MEETING" && <Video className="w-3.5 h-3.5" />}
                      {item.type === "BLOCKER" && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{item.subtitle}</span>
                        {item.category && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-medium text-slate-600 dark:text-slate-400">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column (1 span): Live Report Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Report Preview</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {dailyReportPreview?.status || "DRAFT"}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Net Working Time
                  </div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {dailyReportPreview
                      ? formatDurationHuman(dailyReportPreview.netWorkSec)
                      : "0m"}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                    Recommended Next Steps:
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 whitespace-pre-line text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {dailyReportPreview?.recommendedNextSteps || "Continue working on sprint deliverables."}
                  </div>
                </div>

                {dailyReportPreview?.notes && (
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">Notes:</div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {dailyReportPreview.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/reports"
                className="w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Review &amp; Submit Full Report
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AddWorkLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </AppLayout>
  );
}
