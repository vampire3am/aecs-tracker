"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AddWorkLogModal } from "@/components/work/AddWorkLogModal";
import {
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Folder,
  Tag,
  Play,
  Square,
  CheckCircle,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time";

export default function WorkPage() {
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Edit log modal
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editDurationMinutes, setEditDurationMinutes] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedProject) params.append("projectId", selectedProject);
      if (selectedCategory) params.append("category", selectedCategory);

      const [logsRes, projRes] = await Promise.all([
        fetch(`/api/work-logs?${params.toString()}`),
        fetch("/api/projects"),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setWorkLogs(data.workLogs || []);
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
  }, [selectedProject, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work log?")) return;
    try {
      const res = await fetch(`/api/work-logs/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    const durSec = Math.max(0, parseInt(editDurationMinutes || "0", 10) * 60);
    try {
      const res = await fetch(`/api/work-logs/${editingLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSec: durSec,
          description: editDescription,
        }),
      });
      if (res.ok) {
        setEditingLog(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalSeconds = workLogs.reduce((sum, l) => sum + (l.durationSec || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Daily Work Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive record of development, bug fixes, reviews, and architecture activities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            <a
              href="/api/reports/export/csv?type=worklogs"
              download
              className="min-h-[42px] px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:bg-slate-100 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export CSV
            </a>
            <button
              onClick={() => setIsAddLogOpen(true)}
              className="min-h-[42px] px-3.5 py-2 bg-indigo-600 active:bg-indigo-700 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Work Log
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search work logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </form>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="BUG_FIX">Bug Fix</option>
              <option value="DEBUGGING">Debugging</option>
              <option value="TESTING">Testing</option>
              <option value="CODE_REVIEW">Code Review</option>
              <option value="DOCUMENTATION">Documentation</option>
              <option value="DEPLOYMENT">Deployment</option>
              <option value="RESEARCH">Research</option>
              <option value="MEETING">Meeting</option>
              <option value="ARCHITECTURE">Architecture</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-center whitespace-nowrap">
            Total: {formatDurationHuman(totalSeconds)}
          </div>
        </div>

        {/* Mobile View: Touch-Friendly Card List (md:hidden) */}
        <div className="md:hidden space-y-3">
          {workLogs.length === 0 ? (
            <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs px-4">
              No work logs found. Tap &quot;Add Work Log&quot; above to log your work!
            </div>
          ) : (
            workLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                      <Folder className="w-3 h-3" />
                      {log.project?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {log.category}
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-lg">
                    {formatDurationHuman(log.durationSec)}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug">
                  {log.description}
                </div>

                {log.task && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="font-semibold text-slate-400">Task:</span>
                    <span className="truncate">{log.task.title}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <div>
                    {new Date(log.startedAt).toLocaleDateString([], { month: "short", day: "numeric" })} &bull;{" "}
                    {new Date(log.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLog(log);
                        setEditDurationMinutes((log.durationSec / 60).toString());
                        setEditDescription(log.description);
                      }}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-slate-500 hover:text-indigo-600 active:bg-slate-100 dark:active:bg-slate-800 rounded-lg touch-manipulation"
                      title="Edit log"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-slate-500 hover:text-red-600 active:bg-slate-100 dark:active:bg-slate-800 rounded-lg touch-manipulation"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden on mobile) */}
        <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Project & Task</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {workLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No work logs found. Add your first log above!
                  </td>
                </tr>
              ) : (
                workLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.startedAt).toLocaleDateString([], { month: "short", day: "numeric" })} &bull;{" "}
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-indigo-500" />
                        {log.project?.name}
                      </div>
                      {log.task && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {log.task.title}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                        {log.description}
                      </div>
                      {log.externalRef && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                          {log.externalRef}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {formatDurationHuman(log.durationSec)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingLog(log);
                            setEditDurationMinutes((log.durationSec / 60).toString());
                            setEditDescription(log.description);
                          }}
                          title="Edit duration & description"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          title="Delete log"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Work Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Work Log</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust duration or description. Never silently modified.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={editDurationMinutes}
                  onChange={(e) => setEditDurationMinutes(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <AddWorkLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        onSuccess={fetchData}
      />
    </AppLayout>
  );
}
