"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { APP_COPYRIGHT, APP_VERSION } from "@/lib/app-info";
import { useSessionState } from "@/hooks/useSessionUser";
import { Loader2 } from "lucide-react";

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
  const { user, loading } = useSessionState();

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

  useEffect(() => {
    if (!loading && !user) window.location.replace("/login");
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]" role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
          Validando sesión segura...
        </div>
      </div>
    );
  }

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
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6 animate-fade-up">{children}</main>
        <footer className="border-t border-[var(--border)] bg-white/45 px-3 py-3 text-center text-[10px] text-muted-foreground backdrop-blur sm:px-5 sm:text-[11px] lg:px-6">
          {APP_COPYRIGHT} · Version {APP_VERSION}
        </footer>
      </div>
    </div>
  );
}
