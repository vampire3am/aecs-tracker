"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  User,
  Folder,
  X,
  ShieldAlert,
} from "lucide-react";

export default function BlockersPage() {
  const [blockers, setBlockers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New blocker modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [waitingFor, setWaitingFor] = useState("");
  const [impact, setImpact] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [projectId, setProjectId] = useState("");

  // Resolve modal
  const [resolvingBlocker, setResolvingBlocker] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchData = async () => {
    try {
      const [blockersRes, projRes] = await Promise.all([
        fetch("/api/blockers"),
        fetch("/api/projects"),
      ]);

      if (blockersRes.ok) {
        const bData = await blockersRes.json();
        setBlockers(bData.blockers || []);
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          waitingFor: waitingFor || undefined,
          impact: impact || undefined,
          priority,
          projectId: projectId || null,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        setWaitingFor("");
        setImpact("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingBlocker) return;
    try {
      const res = await fetch(`/api/blockers/${resolvingBlocker.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes }),
      });
      if (res.ok) {
        setResolvingBlocker(null);
        setResolutionNotes("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Dependency &amp; Blocker Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Make external dependencies, credential delays, and team blockers visible and reportable
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Blocker
          </button>
        </div>

        {/* Blocker list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockers.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              No active blockers! All dependencies are currently clear.
            </div>
          ) : (
            blockers.map((b) => (
              <div
                key={b.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {b.status}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        b.priority === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {b.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {b.description}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Waiting For:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {b.waitingFor || "External Dependency"}
                      </span>
                    </div>
                    {b.impact && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Impact:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">
                          {b.impact}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Logged: {new Date(b.startedAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => setResolvingBlocker(b)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Blocker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Work Blocker</h3>
            <p className="text-xs text-slate-500 mt-1">
              Document what is blocking you so it appears in daily standups and reports.
            </p>

            <form onSubmit={handleCreateBlocker} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Waiting for staging AWS credentials"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Details *</label>
                <textarea
                  rows={2}
                  placeholder="Explain why work cannot proceed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Waiting For</label>
                <input
                  type="text"
                  placeholder="e.g. DevOps Team / Security Review / External Vendor"
                  value={waitingFor}
                  onChange={(e) => setWaitingFor(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Save Blocker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Blocker Modal */}
      {resolvingBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Resolve Blocker</h3>
            <p className="text-xs text-slate-500 mt-1">
              Document how this dependency or blocker was unblocked.
            </p>

            <form onSubmit={handleResolveBlocker} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resolution Notes *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Credentials received from DevOps and integration tests now passing"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingBlocker(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
