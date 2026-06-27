"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { APP_COPYRIGHT, APP_VERSION } from "@/lib/app-info";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}

export default function AppShell({
  children,
  pageTitle,
  pageSubtitle,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          collapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        <Topbar
          title={pageTitle}
          subtitle={pageSubtitle}
          onMenuToggle={() => setCollapsed((c) => !c)}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 p-5 lg:p-6 animate-fade-up">{children}</main>
        <footer className="border-t border-[var(--border)] px-5 py-3 text-center text-[11px] text-muted-foreground lg:px-6">
          {APP_COPYRIGHT} · Version {APP_VERSION}
        </footer>
      </div>
    </div>
  );
}
