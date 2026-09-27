"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  AlertTriangle,
  CheckSquare,
  X,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time";

export default function CalendarPage() {
  const [view, setView] = useState<"DAY" | "WEEK" | "MONTH">("WEEK");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchCalendarData = async () => {
    try {
      const [logsRes, meetRes, tasksRes, blockRes] = await Promise.all([
        fetch("/api/work-logs"),
        fetch("/api/meetings"),
        fetch("/api/tasks"),
        fetch("/api/blockers"),
      ]);

      const allEvents: any[] = [];

      if (logsRes.ok) {
        const lData = await logsRes.json();
        lData.workLogs?.forEach((l: any) => {
          allEvents.push({
            id: `log-${l.id}`,
            type: "WORK_LOG",
            title: l.description,
            date: new Date(l.startedAt).toISOString().split("T")[0],
            duration: formatDurationHuman(l.durationSec),
            details: `Project: ${l.project.name} • Category: ${l.category}`,
          });
        });
      }

      if (meetRes.ok) {
        const mData = await meetRes.json();
        mData.meetings?.forEach((m: any) => {
          allEvents.push({
            id: `meet-${m.id}`,
            type: "MEETING",
            title: m.title,
            date: new Date(m.startedAt).toISOString().split("T")[0],
            duration: formatDurationHuman(m.durationSec),
            details: `Type: ${m.meetingType} • ${m.notes || "No notes"}`,
          });
        });
      }

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        tData.tasks?.forEach((t: any) => {
          if (t.dueDate) {
            allEvents.push({
              id: `task-${t.id}`,
              type: "DEADLINE",
              title: `Deadline: ${t.title}`,
              date: new Date(t.dueDate).toISOString().split("T")[0],
              details: `Project: ${t.project?.name} • Priority: ${t.priority}`,
            });
          }
        });
      }

      setEvents(allEvents);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Compute 7 days of current week
  const getDaysOfWeek = (baseDate: Date) => {
    const days: Date[] = [];
    const currentDay = baseDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentDate);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (view === "DAY") d.setDate(d.getDate() - 1);
    else if (view === "WEEK") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (view === "DAY") d.setDate(d.getDate() + 1);
    else if (view === "WEEK") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Calendar &amp; Timeline View
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize work sessions, meetings, tasks, and deadlines in your timezone
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              {(["DAY", "WEEK", "MONTH"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    view === v
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <button onClick={prevPeriod} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-300 font-mono">
                {currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button onClick={nextPeriod} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly View Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`py-3 px-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                    isToday ? "bg-indigo-50/60 dark:bg-indigo-950/40" : ""
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-sm font-extrabold mt-0.5 inline-block w-6 h-6 leading-6 rounded-full ${
                      isToday ? "bg-indigo-600 text-white" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 min-h-[500px] divide-x divide-slate-100 dark:divide-slate-800">
            {weekDays.map((d, i) => {
              const dateStr = d.toISOString().split("T")[0];
              const dayEvents = events.filter((e) => e.date === dateStr);
              return (
                <div key={i} className="p-2 space-y-2 bg-transparent hover:bg-slate-50/50 transition">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-2 rounded-lg text-xs cursor-pointer shadow-sm transition hover:scale-[1.02] ${
                        ev.type === "WORK_LOG"
                          ? "bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/80 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                          : ev.type === "MEETING"
                          ? "bg-purple-50 border border-purple-200 dark:bg-purple-950/80 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                          : "bg-red-50 border border-red-200 dark:bg-red-950/80 dark:border-red-800 text-red-900 dark:text-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px] truncate">
                        {ev.type === "WORK_LOG" && <Clock className="w-3 h-3 text-indigo-600" />}
                        {ev.type === "MEETING" && <Video className="w-3 h-3 text-purple-600" />}
                        {ev.type === "DEADLINE" && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        <span className="truncate">{ev.title}</span>
                      </div>
                      {ev.duration && (
                        <div className="text-[10px] font-mono mt-0.5 opacity-80">{ev.duration}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {selectedEvent.type}
              </span>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedEvent.title}</h3>
              <div className="text-slate-500 font-mono">Date: {selectedEvent.date}</div>
              {selectedEvent.duration && (
                <div className="text-slate-500 font-mono">Duration: {selectedEvent.duration}</div>
              )}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 mt-2">
                {selectedEvent.details}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
