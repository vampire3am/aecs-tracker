"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
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

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInfo | null;
}

export function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onClose();
      router.push("/login");
      router.refresh();
    } catch {
      onClose();
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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                A
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                  AECS TRACKER
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                  Enterprise Mobile
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile card */}
          {user && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {user.employeeId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="py-3 px-3 space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {adminNavItems.length > 0 && (
              <>
                <div className="pt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Management
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 pb-safe">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
