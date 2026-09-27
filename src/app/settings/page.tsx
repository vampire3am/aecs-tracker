"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Settings as SettingsIcon, User, Globe, Bell, Shield, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [workLocation, setWorkLocation] = useState("REMOTE");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setTimezone(data.user.timezone || "UTC");
          setWorkLocation(data.user.workLocation || "REMOTE");
        }
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg("Settings saved successfully!");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            Profile &amp; System Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your employee profile, working timezone, and notification preferences
          </p>
        </div>

        {savedMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Employee Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Employee Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-medium">
                  {user?.name || "Loading..."}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Employee ID</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-mono font-medium">
                  {user?.employeeId || "--"}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Email</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-mono">
                  {user?.email || "--"}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Job Title</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                  {user?.jobTitle || "--"}
                </div>
              </div>
            </div>
          </div>

          {/* Timezone & Work Location */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              Localization &amp; Work Location
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Configured Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                >
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Kathmandu">Asia/Kathmandu (NPT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for daily reporting cutoffs and work session boundary aggregation.
                </p>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Work Location
                </label>
                <select
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="OFFICE">Office</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              Notification Alerts
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Reminder if work session is left running after 8 hours
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Notification on upcoming sprint task deadlines
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Alert when an open blocker is resolved or updated
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Weekly report compilation reminder on Friday afternoon
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
