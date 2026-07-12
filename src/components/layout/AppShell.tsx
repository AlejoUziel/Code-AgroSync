"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize(); // Run on mount to detect initial size

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="pro-shell min-h-screen bg-[var(--background)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <Topbar
          title={pageTitle}
          subtitle={pageSubtitle}
          onMenuToggle={() => setCollapsed((c) => !c)}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 animate-fade-up">{children}</main>
        <footer className="border-t border-[var(--border)] bg-white/45 px-5 py-3 text-center text-[11px] text-muted-foreground backdrop-blur lg:px-6">
          {APP_COPYRIGHT} · Version {APP_VERSION}
        </footer>
      </div>
    </div>
  );
}
