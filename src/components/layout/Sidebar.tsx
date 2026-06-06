"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Administrativo: true,
    Operativo: true,
    Tecnológico: true,
  });

  const toggleGroup = (category: string) => {
    setOpenGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const isActive = (href: string) => pathname === href;

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
          "bg-[#1E1E1E] border-r border-white/6",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            "flex items-center border-b border-white/6 shrink-0",
            collapsed ? "h-14 px-4 justify-center" : "h-14 px-5 gap-3"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-heading text-[var(--background)] text-base tracking-tight truncate">
              AgroSync
            </span>
          )}
          {!collapsed && (
            <button
              onClick={onToggle}
              className="ml-auto text-white/40 hover:text-white/80 transition-colors"
              aria-label="Collapse sidebar"
            >
              <X size={15} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={onToggle}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu size={15} />
            </button>
          )}
        </div>

        {/* Dashboard quick link */}
        <div className="px-3 pt-3 shrink-0">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group",
              collapsed ? "justify-center" : "",
              pathname === "/"
                ? "bg-primary/15 text-accent border-l-2 border-primary"
                : "text-white/60 hover:text-white/90 hover:bg-card/5"
            )}
            title={collapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard size={15} className="shrink-0" />
            {!collapsed && (
              <span className="font-medium-body text-xs truncate">Dashboard</span>
            )}
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
          {navGroups.map((group) => (
            <div key={group.category} className="mb-1">
              {/* Category header */}
              <button
                onClick={() => toggleGroup(group.category)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                  "text-white/30 hover:text-white/60",
                  collapsed ? "justify-center" : "justify-between"
                )}
                title={collapsed ? group.category : undefined}
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

              {/* Nav items */}
              {(collapsed || openGroups[group.category]) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-2.5 py-2 rounded-md text-xs transition-all duration-150 group relative",
                        collapsed ? "justify-center" : "",
                        isActive(item.href)
                          ? "bg-primary/12 text-accent border-l-2 border-primary pl-[9px]"
                          : "text-white/55 hover:text-white/85 hover:bg-card/5"
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
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom user area */}
        <div className="shrink-0 border-t border-white/6 p-3">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/20 text-accent text-[10px] font-heading">
                JM
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium-body text-white/80 truncate">
                  Juan Martínez
                </p>
                <p className="text-[10px] font-body text-white/40 truncate">
                  Administrador
                </p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-card/5 transition-colors"
                  title="Configuración"
                >
                  <Settings size={13} />
                </button>
                <button
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-card/5 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

