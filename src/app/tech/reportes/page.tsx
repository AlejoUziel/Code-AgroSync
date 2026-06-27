"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function ReportesPage() {
  return (
    <AppShell pageTitle="Reportes" pageSubtitle="Tecnologico · Buscar, crear, editar, eliminar, PDF y correo">
      <CrudModule resourceKey="reportes" />
    </AppShell>
  );
}
