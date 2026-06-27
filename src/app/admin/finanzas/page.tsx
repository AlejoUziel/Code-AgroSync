"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function FinanzasPage() {
  return (
    <AppShell pageTitle="Finanzas" pageSubtitle="Administrativo · Transacciones guardadas automaticamente">
      <CrudModule resourceKey="finanzas" />
    </AppShell>
  );
}
