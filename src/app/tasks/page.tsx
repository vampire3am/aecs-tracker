"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  CheckSquare,
  Plus,
  Play,
  Square,
  Folder,
  User,
  Clock,
  AlertTriangle,
  GitBranch,
  ExternalLink,
  ChevronRight,
  X,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatDurationHuman, formatDurationTimer } from "@/lib/time";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [activeTimer, setActiveTimer] = useState<any | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // New task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gitBranch, setGitBranch] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterProject, setFilterProject] = useState<string>("");

  const fetchData = async () => {
    try {
      const [tasksRes, projRes, timerRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/work-logs/timer/active"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (!projectId && pData.projects?.length > 0) {
          setProjectId(pData.projects[0].id);
        }
      }
      if (timerRes.ok) {
        const tData = await timerRes.json();
        setActiveTimer(tData.activeTimer || null);
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

  // Timer ticker
  useEffect(() => {
    if (!activeTimer) {
      setTimerSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(activeTimer.startedAt).getTime();
      const now = Date.now();
      setTimerSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async (taskId: string) => {
    try {
      const res = await fetch("/api/work-logs/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, category: "DEVELOPMENT" }),
      });
      if (res.ok) {
        await fetchData();
        if (selectedTask?.id === taskId) {
          loadTaskDetails(taskId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopTimer = async (workLogId: string) => {
    try {
      const res = await fetch("/api/work-logs/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workLogId }),
      });
      if (res.ok) {
        await fetchData();
        if (selectedTask) loadTaskDetails(selectedTask.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        if (selectedTask?.id === taskId) loadTaskDetails(taskId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          projectId,
          priority,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          dueDate: dueDate || undefined,
          gitBranch: gitBranch || undefined,
          externalRef: externalRef || undefined,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        setEstimatedHours("");
        setDueDate("");
        setGitBranch("");
        setExternalRef("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterProject && t.projectId !== filterProject) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Active Timer Banner if running */}
        {activeTimer && (
          <div className="p-4 bg-indigo-900/90 text-white rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Active Task Timer (Backed by Database)
                </div>
                <div className="text-sm font-semibold mt-0.5">
                  {activeTimer.task?.title || activeTimer.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold">{formatDurationTimer(timerSeconds)}</div>
              <button
                onClick={() => handleStopTimer(activeTimer.id)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop Timer
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Task Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track tasks with full working context: work logs, blockers, estimates, and code branches
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-1">
            {["ALL", "TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {st === "ALL" ? "All Tasks" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isTimerOnThis = activeTimer?.taskId === task.id;
            return (
              <div
                key={task.id}
                onClick={() => loadTaskDetails(task.id)}
                className={`p-5 rounded-xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md flex flex-col justify-between ${
                  isTimerOnThis
                    ? "border-indigo-600 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {task.project?.projectKey}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === "CRITICAL"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : task.priority === "HIGH"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {task.actualHours || 0}h / {task.estimatedHours || "--"}h
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTimerOnThis ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopTimer(activeTimer.id);
                        }}
                        className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Square className="w-3 h-3 fill-white" /> Stop
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTimer(task.id);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" /> Timer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Complete Working Context Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  [{selectedTask.project?.projectKey}] Task Details
                </span>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Actions */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                  className="text-xs font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <div className="flex items-center gap-2">
                  {activeTimer?.taskId === selectedTask.id ? (
                    <button
                      onClick={() => handleStopTimer(activeTimer.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" /> Stop Active Timer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTimer(selectedTask.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow hover:bg-indigo-700 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Start Timer
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-4">{selectedTask.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-line">
                {selectedTask.description || "No description provided."}
              </p>

              {/* Working Context Details */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Assignee:</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedTask.assignee?.name || "Unassigned"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Due Date:</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString()
                      : "No deadline"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Estimated / Actual:</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedTask.estimatedHours || 0}h est. / {selectedTask.actualHours || 0}h actual
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Git Branch:</span>
                  <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                    {selectedTask.gitBranch || "None"}
                  </div>
                </div>
              </div>

              {/* Task Work Logs */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Work Logs on this Task ({selectedTask.workLogs?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedTask.workLogs?.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3">No work logged directly on this task yet.</div>
                  ) : (
                    selectedTask.workLogs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{log.description}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(log.startedAt).toLocaleDateString()} &bull; {log.category}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatDurationHuman(log.durationSec)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task Blockers */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Associated Blockers ({selectedTask.blockers?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedTask.blockers?.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">No active blockers on this task.</div>
                  ) : (
                    selectedTask.blockers?.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs"
                      >
                        <div className="font-bold text-red-800 dark:text-red-300">{b.title}</div>
                        <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                          Waiting for: {b.waitingFor || "External Dependency"} &bull; Status: {b.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Task</h3>
            <p className="text-xs text-slate-500 mt-1">Add task to a project with estimates and priority.</p>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project *</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectKey}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title *</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task context & deliverables"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 6.0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Git Branch</label>
                  <input
                    type="text"
                    placeholder="feature/xyz"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
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
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {modalLoading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
