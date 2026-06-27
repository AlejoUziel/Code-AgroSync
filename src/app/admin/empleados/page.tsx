"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function EmpleadosPage() {
  return (
    <AppShell pageTitle="Gestion de Empleados" pageSubtitle="Administrativo · Busqueda, creacion, edicion y eliminacion">
      <CrudModule resourceKey="empleados" />
    </AppShell>
  );
}
