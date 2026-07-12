"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserSquare2,
  Wallet,
  MapPin,
  Sprout,
  Package,
  WarehouseIcon,
  Map,
  FileBarChart2,
  Bell,
  Leaf,
  LogOut,
  Settings,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logout, updateSessionProfile, type SettingsState } from "@/app/actions/auth";
import { departamentoHome, departamentos } from "@/lib/departments";
import { useSessionUser } from "@/hooks/useSessionUser";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    category: "Administrativo",
    items: [
      {
        label: "Usuarios y Empresas",
        href: "/admin/usuarios",
        icon: <Users size={15} />,
      },
      {
        label: "Gestión de Empleados",
        href: "/admin/empleados",
        icon: <UserSquare2 size={15} />,
      },
      {
        label: "Finanzas",
        href: "/admin/finanzas",
        icon: <Wallet size={15} />,
      },
    ],
  },
  {
    category: "Operativo",
    items: [
      {
        label: "Gestión de Parcelas",
        href: "/ops/parcelas",
        icon: <MapPin size={15} />,
      },
      {
        label: "Gestión de Cultivos",
        href: "/ops/cultivos",
        icon: <Sprout size={15} />,
      },
      {
        label: "Producción y Cosecha",
        href: "/ops/produccion",
        icon: <Package size={15} />,
      },
      {
        label: "Inventario Agrícola",
        href: "/ops/inventario",
        icon: <WarehouseIcon size={15} />,
      },
    ],
  },
  {
    category: "Tecnológico",
    items: [
      {
        label: "Mapa Interactivo",
        href: "/tech/mapa",
        icon: <Map size={15} />,
      },
      {
        label: "Reportes",
        href: "/tech/reportes",
        icon: <FileBarChart2 size={15} />,
      },
      {
        label: "Notificaciones y Alertas",
        href: "/tech/alertas",
        icon: <Bell size={15} />,
        badge: 3,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarTooltip({ children, label, enabled }: { children: React.ReactElement; label: string; enabled: boolean }) {
  if (!enabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" className="bg-[#1E1E1E] text-white border border-white/10 text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const user = useSessionUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsState, settingsAction, settingsPending] = useActionState<SettingsState, FormData>(
    updateSessionProfile,
    {}
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Administrativo: true,
    Operativo: true,
    Tecnológico: true,
  });

  const toggleGroup = (category: string) => {
    setOpenGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const isActive = (href: string) => pathname === href;
  useEffect(() => {
    if (settingsState.ok) {
      window.setTimeout(() => window.location.reload(), 700);
    }
  }, [settingsState.ok]);

  const visibleGroups = navGroups.filter((group) => {
    if (!user) return true;
    if (user.departamento === "AdministradorIT") return true;
    if (user.departamento === "Tecnologico") return group.category === "Tecnológico";
    return group.category === user.departamento;
  });
  const homeHref = departamentoHome(user?.departamento);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-screen flex flex-col transition-all duration-300 ease-in-out",
          "bg-[linear-gradient(180deg,#171A16_0%,#1E241A_54%,#141713_100%)] border-r border-white/8 shadow-[18px_0_48px_rgba(20,23,19,0.14)]",
          collapsed ? "w-[64px]" : "w-[256px]"
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            "flex items-center border-b border-white/6 shrink-0",
            collapsed ? "h-16 px-4 justify-center" : "h-16 px-5 gap-3"
          )}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-[0_10px_28px_rgba(142,191,36,0.28)] shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-heading text-[var(--background)] text-base tracking-normal truncate block">
                AgroSync
              </span>
              <span className="text-[10px] font-medium-body uppercase tracking-widest text-white/35">
                Pro Console
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onToggle}
              className="ml-auto text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <X size={15} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={onToggle}
              className="text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              aria-label="Expand sidebar"
            >
              <Menu size={15} />
            </button>
          )}
        </div>

        {/* Dashboard quick link */}
        <div className="px-3 pt-3 shrink-0">
          <SidebarTooltip label="Inicio" enabled={collapsed}>
            <Link
              href={homeHref}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                collapsed ? "justify-center" : "",
                pathname === homeHref
                  ? "bg-primary/16 text-accent ring-1 ring-primary/20 shadow-[0_10px_24px_rgba(142,191,36,0.08)]"
                  : "text-white/62 hover:text-white/90 hover:bg-white/6"
              )}
            >
              <LayoutDashboard size={15} className="shrink-0" />
              {!collapsed && (
                <span className="font-medium-body text-xs truncate">Inicio</span>
              )}
            </Link>
          </SidebarTooltip>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
          {visibleGroups.map((group) => (
            <div key={group.category} className="mb-1">
              {/* Category header */}
              <SidebarTooltip label={group.category} enabled={collapsed}>
                <button
                  onClick={() => toggleGroup(group.category)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
                    "text-white/30 hover:text-white/60",
                    collapsed ? "justify-center" : "justify-between"
                  )}
                >
                  {!collapsed && (
                    <span className="font-heading text-[10px] uppercase tracking-widest truncate">
                      {group.category}
                    </span>
                  )}
                  {collapsed ? (
                    <div className="w-4 h-px bg-card/20" />
                  ) : (
                    <span className="transition-transform duration-200">
                      {openGroups[group.category] ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </span>
                  )}
                </button>
              </SidebarTooltip>

              {/* Nav items */}
              {(collapsed || openGroups[group.category]) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => (
                    <SidebarTooltip key={item.href} label={item.label} enabled={collapsed}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group relative",
                          collapsed ? "justify-center" : "",
                          isActive(item.href)
                            ? "bg-primary/14 text-accent ring-1 ring-primary/18 shadow-[0_10px_24px_rgba(142,191,36,0.07)]"
                            : "text-white/56 hover:text-white/88 hover:bg-white/6"
                        )}
                      >
                        <span className={cn("shrink-0", isActive(item.href) ? "text-accent" : "")}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="font-body text-xs truncate">{item.label}</span>
                        )}
                        {!collapsed && item.badge && (
                          <Badge className="ml-auto bg-primary/20 text-accent border-0 text-[10px] px-1.5 py-0 h-4">
                            {item.badge}
                          </Badge>
                        )}
                        {collapsed && item.badge && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarTooltip>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom user area */}
        <div className="shrink-0 border-t border-white/8 p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
              <ShieldCheck size={14} className="text-accent" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium-body uppercase tracking-widest text-white/36">Version</p>
                <p className="text-xs font-medium-body text-white/78">Pro Operativa</p>
              </div>
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/20 text-accent text-[10px] font-heading">
                {user?.initials ?? "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium-body text-white/80 truncate">
                  {user?.nombre ?? "Usuario"}
                </p>
                <p className="text-[10px] font-body text-white/40 truncate">
                  {user ? `${user.departamentoLabel} · ${user.rol}` : "Cargando..."}
                </p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-card/5 transition-colors"
                  title="Configuración"
                >
                  <Settings size={13} />
                </button>
                <form action={logout}>
                  <button
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-card/5 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={13} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md border-[var(--border)] bg-card p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
            <DialogTitle>Configuracion de Usuario</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Editar o cambiar usuario requiere validacion de Administrador General.
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
            <label className="block">
              <span className="text-xs font-medium-body text-[#1E1E1E]">Departamento o acceso</span>
              <select
                name="departamento"
                defaultValue={user?.departamento ?? "Administrativo"}
                className="mt-1 h-9 w-full rounded-lg border border-[var(--border)] bg-card px-3 text-sm outline-none focus:border-[var(--primary)]"
              >
                {departamentos.map((departamento) => (
                  <option key={departamento.value} value={departamento.value}>
                    {departamento.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium-body text-[#1E1E1E]">Clave Administrador General</span>
              <input
                name="adminPassword"
                type="password"
                required
                placeholder="Clave requerida"
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
                {settingsPending ? "Validando..." : "Guardar cambios"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
