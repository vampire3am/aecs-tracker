"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BarChart3,
  PieChart,
  Clock,
  Video,
  AlertTriangle,
  FolderKanban,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time";

export default function AnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${days}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Performance &amp; Work Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Meaningful server-side metrics aggregated directly from your work sessions and logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Range:</span>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  days === d
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Logged Work</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {data?.totalWorkHours || 0} hrs
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Past {days} days</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Meeting Time</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono mt-1">
              {data?.totalMeetingHours || 0} hrs
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Standups &amp; syncs</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Resolved Blockers</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {data?.blockerStats?.resolved || 0} / {data?.blockerStats?.total || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Obstacles overcome</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Active Blockers</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
              {data?.blockerStats?.unresolved || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Currently waiting</div>
          </div>
        </div>

        {/* Working Hours by Day Bar Visualization */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Working Hours by Day</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Net work hours vs break time per calendar date</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2 h-44 overflow-x-auto pb-2">
            {data?.hoursByDay?.map((day: any) => {
              const maxHours = 10;
              const netHeight = Math.min(100, (day.netHours / maxHours) * 100);
              const breakHeight = Math.min(100, (day.breakHours / maxHours) * 100);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-[36px]">
                  <div className="text-[10px] font-mono text-slate-500 font-bold">
                    {day.netHours > 0 ? `${day.netHours}h` : ""}
                  </div>
                  <div className="w-full flex items-end justify-center gap-0.5 h-32 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-1">
                    <div
                      style={{ height: `${netHeight}%` }}
                      className="w-1/2 bg-indigo-600 rounded-t transition-all hover:bg-indigo-500"
                      title={`${day.date}: ${day.netHours}h net work`}
                    />
                    {day.breakHours > 0 && (
                      <div
                        style={{ height: `${breakHeight}%` }}
                        className="w-1/2 bg-amber-400 rounded-t transition-all"
                        title={`${day.date}: ${day.breakHours}h breaks`}
                      />
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                    {day.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" /> Net Work Time
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Break Time
            </span>
          </div>
        </div>

        {/* Category & Project Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Category Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Time spent across engineering disciplines</p>

            <div className="space-y-3">
              {data?.categoryDistribution?.map((cat: any) => {
                const total = data.totalWorkHours || 1;
                const pct = Math.round((cat.hours / total) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {cat.hours}h ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Time */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Project Time Investment</h3>
            <p className="text-[11px] text-slate-500 mb-4">Hours dedicated to each project area</p>

            <div className="space-y-3">
              {data?.projectTime?.map((proj: any) => {
                const total = data.totalWorkHours || 1;
                const pct = Math.round((proj.hours / total) * 100);
                return (
                  <div key={proj.projectName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                        {proj.projectName}
                      </span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {proj.hours}h ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
