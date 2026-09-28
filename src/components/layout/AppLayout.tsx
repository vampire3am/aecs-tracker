"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";
import { BottomNav } from "./BottomNav";
import { AddWorkLogModal } from "../work/AddWorkLogModal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // not logged in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleSettingsUpdated = () => {
      fetchUser();
    };

    window.addEventListener("user-settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("user-settings-updated", handleSettingsUpdated);
  }, []);

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar user={user} />

      {/* Mobile Slide-Over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-safe">
        {/* Header with mobile menu button */}
        <Header
          userTimezone={user?.timezone || "UTC"}
          onMenuClick={() => setIsMobileDrawerOpen(true)}
        />

        {/* Main Content Area: padded for mobile bottom dock */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* iPhone Bottom Navigation Dock */}
      <BottomNav onOpenMenu={() => setIsMobileDrawerOpen(true)} />

      {/* Global Add Work Log Modal */}
      <AddWorkLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("work-log-added"));
        }}
      />
    </div>
  );
}
