"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function AlertasPage() {
  return (
    <AppShell pageTitle="Notificaciones y Alertas" pageSubtitle="Tecnologico · Alertas editables">
      <CrudModule resourceKey="alertas" />
    </AppShell>
  );
}
