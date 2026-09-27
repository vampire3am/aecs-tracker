"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Shield,
  Coffee,
  Play,
  TrendingUp,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time";

export default function TeamPage() {
  const [teamStatusList, setTeamStatusList] = useState<any[]>([]);
  const [managedTeams, setManagedTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or forbidden");
        return res.json();
      })
      .then((data) => {
        setTeamStatusList(data.teamStatusList || []);
        setManagedTeams(data.managedTeams || []);
      })
      .catch((err) => {
        setErrorMsg("Access restricted to Managers and Administrators.");
      })
      .finally(() => setLoading(false));
  }, []);

  const totalTeamHours = teamStatusList.reduce((sum, item) => sum + item.todayHours, 0);
  const workingCount = teamStatusList.filter((item) => item.status === "WORKING").length;
  const breakCount = teamStatusList.filter((item) => item.status === "ON_BREAK").length;
  const totalOpenBlockers = teamStatusList.reduce((sum, item) => sum + item.openBlockers.length, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Team Management Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, daily work hours, task throughput, and blocker visibility across your team
            </p>
          </div>
        </div>

        {errorMsg ? (
          <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-center text-xs text-amber-800 dark:text-amber-200">
            {errorMsg}
          </div>
        ) : (
          <>
            {/* Team Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Team Members</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {teamStatusList.length}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Currently Working</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {workingCount} {breakCount > 0 && <span className="text-xs text-amber-500 font-normal">({breakCount} on break)</span>}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Today&apos;s Team Hours</div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  {Math.round(totalTeamHours * 10) / 10} hrs
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Team Blockers</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {totalOpenBlockers}
                </div>
              </div>
            </div>

            {/* Team Members Live Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized Team Roster</h3>
                <span className="text-xs text-slate-400">Live operational status</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamStatusList.map((item) => (
                  <div
                    key={item.member.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {item.member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.member.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.member.jobTitle} &bull; <span className="font-mono">{item.member.employeeId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="flex items-center gap-2">
                      {item.status === "WORKING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Working
                        </span>
                      )}
                      {item.status === "ON_BREAK" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Coffee className="w-3.5 h-3.5" />
                          On Break
                        </span>
                      )}
                      {item.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          Completed Today
                        </span>
                      )}
                      {item.status === "NOT_STARTED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Not Started
                        </span>
                      )}
                    </div>

                    {/* Today Hours */}
                    <div className="text-center min-w-[90px]">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Today Hours</div>
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {item.todayHours}h
                      </div>
                    </div>

                    {/* Current Project / Task */}
                    <div className="min-w-[180px] max-w-xs text-xs">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Current Focus</div>
                      <div className="font-medium text-slate-900 dark:text-white truncate">
                        {item.currentTask || item.currentProject || "No active timer"}
                      </div>
                    </div>

                    {/* Blockers */}
                    <div className="min-w-[120px] text-right">
                      {item.openBlockers.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          {item.openBlockers.length} Blocked
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No blockers</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
