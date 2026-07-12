"use client";

import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";

export default function InventarioPage() {
  return (
    <AppShell pageTitle="Inventario Agricola" pageSubtitle="Operativo · Guardado automatico de insumos">
      <CrudModule resourceKey="inventario" />
    </AppShell>
  );
}
