"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  BarChart3,
  AlertTriangle,
  Users,
  Shield,
  Settings,
  LogOut,
  Video,
  ListOrdered,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  employeeId: string;
  jobTitle: string;
}

export function Sidebar({ user }: { user: UserInfo | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Work Logs", href: "/work", icon: Clock },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Blockers", href: "/blockers", icon: AlertTriangle },
    { label: "Meetings", href: "/meetings", icon: Video },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const adminNavItems = [
    ...(isManagerOrAdmin ? [{ label: "Team Dashboard", href: "/team", icon: Users }] : []),
    ...(isAdmin ? [{ label: "Employees & Roles", href: "/admin/users", icon: Shield }] : []),
    ...(isManagerOrAdmin ? [{ label: "Audit Logs", href: "/admin/audit-logs", icon: ListOrdered }] : []),
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-200 dark:shadow-none">
            A
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              AECS TRACKER
            </div>
            <div className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-1">
              Enterprise Platform
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="py-4 px-3 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}

          {adminNavItems.length > 0 && (
            <>
              <div className="pt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Management
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* User info & logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || "Employee"}
              </div>
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                  {user?.role || "EMPLOYEE"}
                </span>
                <span className="truncate">{user?.employeeId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
