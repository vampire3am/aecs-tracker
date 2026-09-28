"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Square,
  Coffee,
  PlusCircle,
  Clock,
  ShieldCheck,
  Pause,
  AlertCircle,
} from "lucide-react";
import { formatDurationTimer, formatDurationHuman } from "@/lib/time";

interface SessionState {
  status: "NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED";
  activeSession: any | null;
  activeBreak: any | null;
  todaySessions: any[];
}

interface WorkSessionWidgetProps {
  onAddWorkLogClick: () => void;
  onSessionChange?: () => void;
}

export function WorkSessionWidget({ onAddWorkLogClick, onSessionChange }: WorkSessionWidgetProps) {
  const [state, setState] = useState<SessionState>({
    status: "NOT_STARTED",
    activeSession: null,
    activeBreak: null,
    todaySessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live timer states (in seconds)
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [currentBreakSeconds, setCurrentBreakSeconds] = useState(0);

  // Break modal state
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState("LUNCH");
  const [breakNotes, setBreakNotes] = useState("");

  // End Session modal state
  const [showEndModal, setShowEndModal] = useState(false);
  const [endNotes, setEndNotes] = useState("");

  const fetchState = async () => {
    try {
      const res = await fetch("/api/work-sessions/current");
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg("Failed to connect to session service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Timer interval for real-time natural ticker
  useEffect(() => {
    if (state.status === "NOT_STARTED" || state.status === "COMPLETED") {
      return;
    }

    const interval = setInterval(() => {
      if (state.activeSession) {
        const start = new Date(state.activeSession.startedAt).getTime();
        const now = Date.now();
        const total = Math.max(0, Math.floor((now - start) / 1000));
        setSessionSeconds(total);

        // Calculate past completed breaks duration
        const pastBreaks = (state.activeSession.breaks || [])
          .filter((b: any) => b.endedAt)
          .reduce((sum: number, b: any) => sum + (b.durationSec || 0), 0);

        if (state.activeBreak) {
          const bStart = new Date(state.activeBreak.startedAt).getTime();
          const bNow = Math.max(0, Math.floor((now - bStart) / 1000));
          setCurrentBreakSeconds(bNow);
          setBreakSeconds(pastBreaks + bNow);
        } else {
          setCurrentBreakSeconds(0);
          setBreakSeconds(pastBreaks);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  const handleStartWork = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/work-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start work");
      await fetchState();
      onSessionChange?.();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/breaks/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakType, notes: breakNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start break");
      setShowBreakModal(false);
      setBreakNotes("");
      await fetchState();
      onSessionChange?.();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/breaks/end", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end break");
      await fetchState();
      onSessionChange?.();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndWork = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/work-sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: endNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end session");
      setShowEndModal(false);
      setEndNotes("");
      await fetchState();
      onSessionChange?.();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const netWorkSeconds = Math.max(0, sessionSeconds - breakSeconds);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status badge & Title */}
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Work Session Status
            </span>
            {/* Status indicator */}
            {state.status === "NOT_STARTED" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Not Started
              </span>
            )}
            {state.status === "WORKING" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Working
              </span>
            )}
            {state.status === "ON_BREAK" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                <Coffee className="w-3 h-3 text-amber-600 animate-bounce" />
                On Break ({state.activeBreak?.breakType || "Break"})
              </span>
            )}
            {state.status === "COMPLETED" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Session Completed
              </span>
            )}
          </div>

          {/* Time display */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6">
            <div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Net Work Duration
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight mt-0.5">
                {state.status === "WORKING" || state.status === "ON_BREAK"
                  ? formatDurationTimer(netWorkSeconds)
                  : state.status === "COMPLETED" && state.todaySessions[0]
                  ? formatDurationHuman(state.todaySessions[0].netWorkDurationSec)
                  : "00:00:00"}
              </div>
            </div>

            {(state.status === "WORKING" || state.status === "ON_BREAK") && (
              <div className="sm:border-l border-slate-200 dark:border-slate-800 sm:pl-6 space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-20">Total Session:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatDurationTimer(sessionSeconds)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-20">Total Breaks:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatDurationTimer(breakSeconds)}
                  </span>
                </div>
                {state.status === "ON_BREAK" && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
                    <span className="w-20">This Break:</span>
                    <span className="font-mono">{formatDurationTimer(currentBreakSeconds)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: State-dependent action buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          {/* NOT STARTED STATE */}
          {state.status === "NOT_STARTED" && (
            <button
              onClick={handleStartWork}
              disabled={actionLoading || loading}
              className="col-span-2 sm:col-auto px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Work
            </button>
          )}

          {/* WORKING STATE */}
          {state.status === "WORKING" && (
            <>
              <button
                onClick={onAddWorkLogClick}
                className="col-span-2 sm:col-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                Add Work Log
              </button>

              <button
                onClick={() => setShowBreakModal(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
              >
                <Coffee className="w-4 h-4" />
                Start Break
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                End Work
              </button>
            </>
          )}

          {/* ON BREAK STATE */}
          {state.status === "ON_BREAK" && (
            <>
              <button
                onClick={handleEndBreak}
                disabled={actionLoading}
                className="col-span-2 sm:col-auto px-5 py-3 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 animate-pulse min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-white" />
                Resume Work
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                disabled={actionLoading}
                className="col-span-2 sm:col-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-xs rounded-lg transition disabled:opacity-50 min-h-[44px]"
              >
                End Work Anyway
              </button>
            </>
          )}

          {/* COMPLETED STATE */}
          {state.status === "COMPLETED" && (
            <div className="col-span-2 sm:col-auto flex flex-col sm:flex-row items-center gap-2 w-full">
              <span className="text-xs text-slate-500">Day finalized.</span>
              <button
                onClick={handleStartWork}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition min-h-[44px]"
              >
                Start Another Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Start Break Dialog */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Start Break</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select break type. Break duration is automatically deducted from net working time.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Break Type</label>
                <select
                  value={breakType}
                  onChange={(e) => setBreakType(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LUNCH">Lunch</option>
                  <option value="SHORT_BREAK">Short Break (Coffee / Stretch)</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="MEETING">Internal Break</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Taking 45m lunch"
                  value={breakNotes}
                  onChange={(e) => setBreakNotes(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBreak}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
              >
                {actionLoading ? "Starting..." : "Start Break"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Work Confirmation Dialog */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">End Work Session</h3>
            <p className="text-xs text-slate-500 mt-1">
              Finalizing your work session will calculate total hours, break duration, and net work time.
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Elapsed:</span>
                <span className="font-mono font-medium">{formatDurationHuman(sessionSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Break Deductions:</span>
                <span className="font-mono font-medium">{formatDurationHuman(breakSeconds)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Net Work Recorded:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatDurationHuman(netWorkSeconds)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End of day notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Brief summary of your day..."
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndWork}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {actionLoading ? "Finalizing..." : "Confirm & End Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
