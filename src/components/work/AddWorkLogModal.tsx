"use client";

import { useState, useEffect } from "react";
import { X, Clock, Folder, CheckSquare, Tag, FileText } from "lucide-react";

interface AddWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
  defaultTaskId?: string;
}

export function AddWorkLogModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultTaskId,
}: AddWorkLogModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId || "");
  const [selectedTask, setSelectedTask] = useState(defaultTaskId || "");
  const [category, setCategory] = useState("DEVELOPMENT");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("30");
  const [status, setStatus] = useState("COMPLETED");
  const [notes, setNotes] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch projects
      fetch("/api/projects")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.projects) {
            setProjects(data.projects);
            if (!selectedProject && data.projects.length > 0) {
              setSelectedProject(data.projects[0].id);
            }
          }
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject) {
      // Fetch tasks for project
      fetch(`/api/tasks?projectId=${selectedProject}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.tasks) setTasks(data.tasks);
        });
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Description is required");
      return;
    }
    if (!selectedProject) {
      setErrorMsg("Project is required");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const totalSec = h * 3600 + m * 60;

    try {
      const res = await fetch("/api/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          taskId: selectedTask || null,
          category,
          description: description.trim(),
          durationSec: totalSec,
          status,
          notes: notes.trim() || undefined,
          externalRef: externalRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create work log");

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Work Log</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Project & Task */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-slate-400" /> Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedTask("");
                }}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectKey}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> Task (Optional)
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">No Task / General</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="DEBUGGING">Debugging</option>
                <option value="TESTING">Testing</option>
                <option value="CODE_REVIEW">Code Review</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="DEPLOYMENT">Deployment</option>
                <option value="RESEARCH">Research</option>
                <option value="MEETING">Meeting</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ARCHITECTURE">Architecture</option>
                <option value="LEARNING">Learning</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">Still In Progress</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono"
                />
                <span className="text-xs text-slate-500 font-medium">hrs</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono"
                />
                <span className="text-xs text-slate-500 font-medium">mins</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> What did you work on? *
            </label>
            <input
              type="text"
              placeholder="e.g. Implemented JWT refresh-token rotation and updated middleware"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Notes & External Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                External Ref (PR / Issue)
              </label>
              <input
                type="text"
                placeholder="e.g. PR #284 or JIRA-104"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Additional context"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Work Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
