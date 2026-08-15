"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Search, ChevronDown, Menu, LogOut, Settings, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logout, updateSessionProfile, type SettingsState } from "@/app/actions/auth";
import { departamentoHome } from "@/lib/departments";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/hooks/useSessionUser";
import { subscribeToRealtime } from "@/lib/realtime-client";

// Exclusively the colors shared by the user at the start
const brandColors = [
  { name: "Verde AgroSync (Primary)", hex: "#8EBF24" },
  { name: "Verde Limón (Accent)", hex: "#BEE86B" },
  { name: "Negro Premium (Dark)", hex: "#1E1E1E" },
  { name: "Fondo AgroSync (Surface)", hex: "#F9FBF6" },
  { name: "Gris Suave (Secondary)", hex: "#F0F5EA" },
];

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

type NotificationItem = {
  id: string;
  tipo: string;
  severidad: string;
  mensaje: string;
  resuelta: boolean;
  creadaEn: string;
};

export default function Topbar({
  title,
  subtitle,
  onMenuToggle,
  sidebarCollapsed,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activePrimary, setActivePrimary] = useState("#8EBF24");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [settingsState, settingsAction, settingsPending] = useActionState<SettingsState, FormData>(
    updateSessionProfile,
    {}
  );
  const user = useSessionUser();

  const homeHref = departamentoHome(user?.departamento);
  const showBackButton = pathname !== homeHref && pathname !== "/";
  
  const applyTheme = useCallback((colorHex: string) => {
    const root = document.documentElement;
    
    if (colorHex === "#8EBF24") {
      // 🟢 Verde AgroSync Theme (Light, Original)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F9FBF6");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#E2EDD6");
      root.style.setProperty("--input", "#E2EDD6");
      root.style.setProperty("--secondary", "#F0F5EA");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#BEE86B") {
      // 🟡 Verde Limón Theme (Light Citrus)
      root.style.setProperty("--primary", "#BEE86B");
      root.style.setProperty("--primary-dark", "#A5D152");
      root.style.setProperty("--primary-darker", "#8CB839");
      root.style.setProperty("--background", "#FCFDF9");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#EDF7DB");
      root.style.setProperty("--input", "#EDF7DB");
      root.style.setProperty("--secondary", "#F5FAEB");
      root.style.setProperty("--accent", "#8EBF24");
      root.style.setProperty("--accent-foreground", "#ffffff");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#1E1E1E") {
      // ⚫ Negro Premium Theme (Full Dark Mode!)
      root.style.setProperty("--primary", "#8EBF24"); // High-contrast green primary
      root.style.setProperty("--primary-dark", "#BEE86B");
      root.style.setProperty("--primary-darker", "#D4EE9A");
      root.style.setProperty("--background", "#121212"); // Pitch Black background
      root.style.setProperty("--foreground", "#F9FBF6");
      root.style.setProperty("--card", "#1E1E1E"); // Dark grey panels/cards
      root.style.setProperty("--card-foreground", "#F9FBF6");
      root.style.setProperty("--border", "#2D2D2D");
      root.style.setProperty("--input", "#2D2D2D");
      root.style.setProperty("--secondary", "#2A2A2A");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#161616");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#F9FBF6") {
      // ⚪ Fondo AgroSync Theme (Soft Green Panels)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F9FBF6");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#F0F5EA"); // Theme shifts card panels to secondary green
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#E2EDD6");
      root.style.setProperty("--input", "#E2EDD6");
      root.style.setProperty("--secondary", "#E2EDD6");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#F0F5EA") {
      // 🔘 Gris Suave Theme (Calm Muted Background)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F0F5EA"); // Background becomes soft grey-green
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#FAFBF8"); // White cards stand out on soft background
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#D7E2CD");
      root.style.setProperty("--input", "#D7E2CD");
      root.style.setProperty("--secondary", "#E2EDD6");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    }

    // Standard properties
    root.style.setProperty("--ring", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
    root.style.setProperty("--chart-1", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
    root.style.setProperty("--sidebar-primary", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("agrosync-active-primary");
    if (saved) {
      setTimeout(() => {
        setActivePrimary(saved);
        applyTheme(saved);
      }, 0);
    }
  }, [applyTheme]);

  useEffect(() => {
    let active = true;
    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items: NotificationItem[]; unread: number };
        if (!active) return;
        setNotifications(data.items);
        setUnread(data.unread);
      } catch {
        if (active) {
          setNotifications([]);
          setUnread(0);
        }
      }
    }

    void loadNotifications();
    const unsubscribe = subscribeToRealtime(() => void loadNotifications());
    const interval = window.setInterval(loadNotifications, 15000);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (settingsState.ok) {
      window.setTimeout(() => window.location.reload(), 700);
    }
  }, [settingsState.ok]);

  const handleSelectColor = (colorHex: string) => {
    setActivePrimary(colorHex);
    applyTheme(colorHex);
    localStorage.setItem("agrosync-active-primary", colorHex);
  };

  return (
    <>
      <header
        className="sticky top-0 z-10 flex h-16 min-w-0 items-center gap-2 border-b border-[var(--border)] bg-white/78 px-3 shadow-[0_10px_30px_rgba(30,30,30,0.045)] backdrop-blur-xl sm:gap-4 sm:px-5"
      >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="grid h-11 w-11 place-items-center rounded-lg text-foreground/50 hover:bg-[var(--secondary)] hover:text-foreground transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Desktop toggle for collapsed sidebar */}
      {sidebarCollapsed && (
        <button
          onClick={onMenuToggle}
          className="hidden h-11 w-11 place-items-center rounded-lg text-foreground/40 hover:bg-[var(--secondary)] hover:text-foreground transition-colors lg:grid"
          aria-label="Expand sidebar"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {showBackButton && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-foreground/50 hover:text-foreground hover:bg-[var(--secondary)] transition-all shrink-0 cursor-pointer"
            title="Volver"
            aria-label="Volver a la página anterior"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-heading text-[15px] leading-tight text-foreground sm:text-[17px]">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden truncate font-body text-xs text-muted-foreground sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="pro-focus hidden md:flex items-center gap-2 rounded-xl border border-border bg-[var(--surface-2)] px-3 py-2 w-56 group">
        <Search size={13} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-xs font-body text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        <span className="text-[10px] font-body text-[#C4C4C4] shrink-0">⌘K</span>
      </div>

      {/* Color Customizer Circles directly in the Topbar */}
      <div className="hidden items-center gap-1.5 rounded-full border border-border bg-white/75 px-2.5 py-1.5 shadow-[var(--shadow-xs)] lg:flex">
        {brandColors.map((color) => (
          <button
            key={color.hex}
            onClick={() => handleSelectColor(color.hex)}
            className={cn(
              "w-4 h-4 rounded-full border border-black/10 transition-all hover:scale-115 cursor-pointer",
              activePrimary === color.hex ? "ring-2 ring-primary ring-offset-1 scale-110" : ""
            )}
            style={{ backgroundColor: color.hex }}
            title={color.name}
            aria-label={`Usar tema ${color.name}`}
          />
        ))}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setUserOpen(false);
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="Notificaciones"
          aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
        >
          <Bell size={16} />
          {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />}
        </button>
        {notificationsOpen && (
          <div className="fixed left-2 right-2 top-16 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-md)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-heading text-sm text-foreground">Notificaciones</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{unread} nuevas</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">Sin notificaciones pendientes.</p>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="border-b border-border px-4 py-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium-body text-foreground">{item.tipo}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        item.severidad === "Alta"
                          ? "bg-red-50 text-red-600"
                          : item.severidad === "Media"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-blue-600"
                      )}>
                        {item.severidad}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.mensaje}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User chip */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => {
            setUserOpen((open) => !open);
            setNotificationsOpen(false);
          }}
          className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 hover:border-border hover:bg-secondary transition-colors group"
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-heading">
              {user?.initials ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-44 truncate text-xs font-body text-muted-foreground group-hover:text-foreground transition-colors">
            {user?.nombre ?? "Usuario"}
          </span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
        {userOpen && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-md)]">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-xs font-medium-body text-foreground">{user?.nombre ?? "Usuario"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user ? `${user.departamentoLabel} · ${user.rol}` : "Cargando..."}</p>
            </div>
            <button
              onClick={() => {
                setSettingsOpen(true);
                setUserOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Settings size={13} />
              Configuracion
            </button>
            <form action={logout}>
              <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                <LogOut size={13} />
                Cerrar sesion
              </button>
            </form>
          </div>
        )}
      </div>
      </header>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md border-[var(--border)] bg-card p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
            <DialogTitle>Configuracion de Usuario</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Actualiza tu nombre visible. Los permisos se administran desde el directorio autorizado.
            </p>
          </DialogHeader>
          <form action={settingsAction} className="space-y-4 px-5 py-4">
            <label className="block">
              <span className="text-xs font-medium-body text-[#1E1E1E]">Nombre visible</span>
              <input
                name="nombre"
                defaultValue={user?.nombre ?? ""}
                className="mt-1 h-9 w-full rounded-lg border border-[var(--border)] bg-card px-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </label>
            {settingsState.message && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${settingsState.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                {settingsState.message}
              </div>
            )}
            <DialogFooter className="px-0 py-0 border-0 bg-transparent">
              <button
                type="submit"
                formAction={logout}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs text-[#6B7280] hover:text-[#1E1E1E]"
              >
                Cambiar usuario
              </button>
              <button
                type="submit"
                disabled={settingsPending}
                className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] disabled:opacity-60"
              >
                {settingsPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
