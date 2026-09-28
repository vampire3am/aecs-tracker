"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, CheckSquare, FileText, Menu } from "lucide-react";

interface BottomNavProps {
  onOpenMenu: () => void;
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Work", href: "/work", icon: Clock },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
                active
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More / Menu Drawer button */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5 stroke-[1.75]" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
