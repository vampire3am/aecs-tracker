import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AECS TRACKER — Enterprise Work Tracking & Management",
  description: "Professional employee work-tracking, attendance, task-management, developer activity, and work-reporting platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
