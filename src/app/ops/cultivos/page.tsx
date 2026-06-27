"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function CultivosPage() {
  return (
    <AppShell pageTitle="Gestion de Cultivos" pageSubtitle="Operativo · Busqueda, creacion, edicion y eliminacion">
      <CrudModule resourceKey="cultivos" />
    </AppShell>
  );
}
