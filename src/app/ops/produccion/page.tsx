"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function ProduccionPage() {
  return (
    <AppShell pageTitle="Produccion y Cosecha" pageSubtitle="Operativo · Registros editables de cosecha">
      <CrudModule resourceKey="cosechas" />
    </AppShell>
  );
}
