"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FileText,
  Calendar,
  Save,
  CheckCircle,
  RefreshCw,
  Download,
  Clock,
  AlertTriangle,
  Video,
  Award,
  Sparkles,
  Edit3,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<any | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable fields for daily report
  const [notes, setNotes] = useState("");
  const [recommendedNextSteps, setRecommendedNextSteps] = useState("");

  const fetchDailyReport = async (refresh: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${date}&refresh=${refresh}`);
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data.report);
        setNotes(data.report.notes || "");
        setRecommendedNextSteps(data.report.recommendedNextSteps || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/weekly?startDate=${date}`);
      if (res.ok) {
        const data = await res.json();
        setWeeklyReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const [y, m] = date.split("-");
      const res = await fetch(`/api/reports/monthly?year=${y}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === "DAILY") fetchDailyReport();
    else if (reportType === "WEEKLY") fetchWeeklyReport();
    else fetchMonthlyReport();
  }, [reportType, date]);

  const handleSubmitDaily = async (status: "DRAFT" | "SUBMITTED") => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          recommendedNextSteps,
          status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data.report);
        setSuccessMsg(
          status === "SUBMITTED"
            ? "Daily Report submitted successfully to your manager!"
            : "Draft saved successfully!"
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Safe JSON parsers
  const parseJsonSafe = (str: string, fallback: any = []) => {
    try {
      return JSON.parse(str || "[]");
    } catch {
      return fallback;
    }
  };

  const completedWork = parseJsonSafe(dailyReport?.completedWorkJson, []);
  const inProgressWork = parseJsonSafe(dailyReport?.inProgressJson, []);
  const pendingTasks = parseJsonSafe(dailyReport?.pendingTasksJson, []);
  const meetings = parseJsonSafe(dailyReport?.meetingsJson, []);
  const blockers = parseJsonSafe(dailyReport?.blockersJson, []);
  const achievements = parseJsonSafe(dailyReport?.achievementsJson, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Structured Work Reporting</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic, zero-hallucination reporting compiled directly from database records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    reportType === t
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* DAILY REPORT VIEW */}
        {reportType === "DAILY" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-8 max-w-4xl mx-auto">
            {/* Report Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AECS TRACKER &bull; Daily Work Report
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchDailyReport(true)}
                  disabled={loading}
                  title="Re-aggregate from latest live records"
                  className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Sync Live Records
                </button>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    dailyReport?.status === "SUBMITTED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {dailyReport?.status || "DRAFT"}
                </span>
                {dailyReport?.isUserEdited && (
                  <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                    User Edited
                  </span>
                )}
              </div>
            </div>

            {/* Time Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Working Hours</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  {dailyReport?.startedAt
                    ? `${new Date(dailyReport.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} – ${
                        dailyReport.endedAt
                          ? new Date(dailyReport.endedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Active"
                      }`
                    : "--"}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Session</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  {formatDurationHuman(dailyReport?.totalSessionSec || 0)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Break Duration</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  {formatDurationHuman(dailyReport?.totalBreakSec || 0)}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Net Work</div>
                <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                  {formatDurationHuman(dailyReport?.netWorkSec || 0)}
                </div>
              </div>
            </div>

            {/* Completed Work */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Completed Work ({completedWork.length})
              </h3>
              {completedWork.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No completed work recorded for this day.</div>
              ) : (
                <ul className="space-y-2">
                  {completedWork.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.description}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.projectName} &bull; {item.category}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {formatDurationHuman(item.durationSec)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* In Progress */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                Work in Progress ({inProgressWork.length})
              </h3>
              {inProgressWork.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No in-progress work logged for this day.</div>
              ) : (
                <ul className="space-y-2">
                  {inProgressWork.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900 text-xs flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">{item.description}</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-xs">
                        {formatDurationHuman(item.durationSec)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Meetings */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-purple-500" />
                Meetings ({meetings.length})
              </h3>
              {meetings.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No meetings attended on this date.</div>
              ) : (
                <ul className="space-y-2">
                  {meetings.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900 text-xs flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">{item.title}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 text-xs">
                        {formatDurationHuman(item.durationSec)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Blockers */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Blockers ({blockers.length})
              </h3>
              {blockers.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No blockers logged for this date.</div>
              ) : (
                <ul className="space-y-2">
                  {blockers.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-amber-900 dark:text-amber-200">{item.title}</div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Waiting for: {item.waitingFor || "External"} &bull; Priority: {item.priority}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Key Achievements ({achievements.length})
                </h3>
                <ul className="space-y-2">
                  {achievements.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900 text-xs"
                    >
                      <div className="font-bold text-indigo-900 dark:text-indigo-200">{item.title}</div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{item.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editable Next Steps & Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Recommended Next Steps (Editable)
                </label>
                <textarea
                  rows={3}
                  value={recommendedNextSteps}
                  onChange={(e) => setRecommendedNextSteps(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Employee Daily Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or notes for manager..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submission Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleSubmitDaily("DRAFT")}
                disabled={saving}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDaily("SUBMITTED")}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Submitting..." : "Submit Daily Report"}
              </button>
            </div>
          </div>
        )}

        {/* WEEKLY REPORT VIEW */}
        {reportType === "WEEKLY" && weeklyReport && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AECS TRACKER &bull; Weekly Aggregated Report
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Week of {weeklyReport.weekStartDate} to {weeklyReport.weekEndDate}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Working Days</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {weeklyReport.workingDaysCount} Days
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl">
                <div className="text-[11px] font-bold text-indigo-600 uppercase">Total Net Work</div>
                <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                  {formatDurationHuman(weeklyReport.netWorkSec)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Completed Tasks</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {weeklyReport.completedTasksCount}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Pending Tasks</div>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {weeklyReport.pendingTasksCount}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Accomplishments Summary
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">{weeklyReport.accomplishments}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Planned Next Week Work
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">{weeklyReport.plannedNextWeek}</p>
            </div>
          </div>
        )}

        {/* MONTHLY REPORT VIEW */}
        {reportType === "MONTHLY" && monthlyReport && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AECS TRACKER &bull; Monthly Aggregated Report
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Month: {monthlyReport.month} / {monthlyReport.year}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Active Days</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {monthlyReport.workingDaysCount} Days
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl">
                <div className="text-[11px] font-bold text-indigo-600 uppercase">Total Working Hours</div>
                <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                  {formatDurationHuman(monthlyReport.totalWorkingSec)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Daily Average</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  {monthlyReport.avgDailyHours} hrs/day
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Tasks Closed</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {monthlyReport.completedTasksCount}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Monthly Accomplishments
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">{monthlyReport.accomplishments}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
