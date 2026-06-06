"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { useLocalDB, generateId } from "@/hooks/useLocalDB";
import { Transaccion, seedTransacciones } from "@/types/models";
import TransaccionForm from "@/components/admin/TransaccionForm";
import {
  ConfirmDeleteDialog,
  EmptyState,
  Toast,
  useToast,
} from "@/components/shared/FormComponents";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  try {
    const date = new Date(iso + "T00:00:00"); // Avoid timezone shifting
    return date.toLocaleDateString("es-HN", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function FinanzasPage() {
  const db = useLocalDB<Transaccion>("transacciones", seedTransacciones);
  const { toast, showToast, hideToast } = useToast();

  // Dialog Modals State
  const [transaccionFormOpen, setTransaccionFormOpen] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState<Transaccion | null>(null);
  const [deletingTransaccion, setDeletingTransaccion] = useState<Transaccion | null>(null);

  // Handlers
  const handleSaveTransaccion = (data: Partial<Transaccion>) => {
    if (editingTransaccion) {
      db.update(editingTransaccion.id, data);
      showToast(`Transacción "${data.concepto}" actualizada con éxito.`);
    } else {
      db.create({
        ...data,
        id: generateId("T"),
      } as Transaccion);
      showToast(`Transacción "${data.concepto}" registrada exitosamente.`);
    }
    setTransaccionFormOpen(false);
    setEditingTransaccion(null);
  };

  const handleDeleteTransaccion = () => {
    if (!deletingTransaccion) return;
    db.remove(deletingTransaccion.id);
    showToast(`Transacción "${deletingTransaccion.concepto}" eliminada.`, "error");
    setDeletingTransaccion(null);
  };

  const handleExport = () => {
    showToast("Reporte financiero exportado como CSV exitosamente.");
  };

  // Sort transactions by date descending
  const sortedTransacciones = useMemo(() => {
    return [...db.records].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [db.records]);

  // Dynamic statistics calculations (comparing June 2026 vs May 2026)
  const stats = useMemo(() => {
    const juneStr = "2026-06";
    const mayStr = "2026-05";

    const transJune = db.records.filter((t) => t.fecha.startsWith(juneStr));
    const transMay = db.records.filter((t) => t.fecha.startsWith(mayStr));

    // June totals
    const incJune = transJune.filter((t) => t.tipo === "Ingreso").reduce((sum, t) => sum + t.monto, 0);
    const expJune = transJune.filter((t) => t.tipo === "Egreso").reduce((sum, t) => sum + t.monto, 0);
    const netJune = incJune - expJune;
    const marginJune = incJune > 0 ? (netJune / incJune) * 100 : 0;

    // May totals
    const incMay = transMay.filter((t) => t.tipo === "Ingreso").reduce((sum, t) => sum + t.monto, 0);
    const expMay = transMay.filter((t) => t.tipo === "Egreso").reduce((sum, t) => sum + t.monto, 0);
    const netMay = incMay - expMay;

    // Computes percentage changes
    const calcPctChange = (current: number, previous: number) => {
      if (previous === 0) return { change: "+0.0%", up: true };
      const pct = ((current - previous) / previous) * 100;
      return {
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
        up: pct >= 0,
      };
    };

    const incChange = calcPctChange(incJune, incMay);
    const expChange = calcPctChange(expJune, expMay);
    
    // Profit percent change (using absolute value for negative profit bases)
    let profitChangeText = "+0.0%";
    let profitUp = true;
    if (netMay !== 0) {
      const pct = ((netJune - netMay) / Math.abs(netMay)) * 100;
      profitChangeText = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      profitUp = pct >= 0;
    }

    const marginDiff = marginJune - (incMay > 0 ? (netMay / incMay) * 100 : 0);
    const marginChangeText = `${marginDiff >= 0 ? "+" : ""}${marginDiff.toFixed(1)}pp`;

    const formatCompact = (val: number) => {
      const prefix = val < 0 ? "-L. " : "L. ";
      const absVal = Math.abs(val);
      if (absVal >= 1000000) return `${prefix}${(absVal / 1000000).toFixed(1)}M`;
      if (absVal >= 1000) return `${prefix}${(absVal / 1000).toFixed(0)}K`;
      return `${prefix}${absVal}`;
    };

    return [
      { label: "Ingresos (Jun)", value: formatCompact(incJune), change: incChange.change, up: incChange.up, icon: <DollarSign size={16} className="text-primary" /> },
      { label: "Gastos (Jun)", value: formatCompact(expJune), change: expChange.change, up: !expChange.up, icon: <CreditCard size={16} className="text-amber-500" /> }, // Expenses down is green (up=false is green)
      { label: "Utilidad Neta (Jun)", value: formatCompact(netJune), change: profitChangeText, up: profitUp, icon: <PiggyBank size={16} className="text-primary" /> },
      { label: "Margen (Jun)", value: `${marginJune.toFixed(1)}%`, change: marginChangeText, up: marginDiff >= 0, icon: <ArrowUpRight size={16} className="text-primary" /> },
    ];
  }, [db.records]);

  // Compute dynamic chart data (Jan - Jun)
  const chartData = useMemo(() => {
    const mesesMap = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    const mesesIndex = ["01", "02", "03", "04", "05", "06"];
    
    return mesesIndex.map((mIdx, i) => {
      const monthTrans = db.records.filter((t) => t.fecha.startsWith(`2026-${mIdx}`));
      const ingresos = monthTrans.filter((t) => t.tipo === "Ingreso").reduce((sum, t) => sum + t.monto, 0);
      const gastos = monthTrans.filter((t) => t.tipo === "Egreso").reduce((sum, t) => sum + t.monto, 0);
      return { mes: mesesMap[i], ingresos, gastos };
    });
  }, [db.records]);

  // Compute dynamic category expenses breakdown
  const gastosDistribucion = useMemo(() => {
    const totalEgreso = db.records.filter((t) => t.tipo === "Egreso").reduce((sum, t) => sum + t.monto, 0);
    const categorias = [
      { key: "Nómina", label: "Nómina", color: "bg-primary" },
      { key: "Insumos", label: "Insumos y Agroquímicos", color: "bg-accent" },
      { key: "Operación", label: "Maquinaria y Operación", color: "bg-amber-400" },
      { key: "Logística", label: "Logística y Transporte", color: "bg-blue-400" },
      { key: "Administrativos", label: "Administrativos y Seguros", color: "bg-[#D4EE9A]" },
      { key: "Otro", label: "Otros Gastos", color: "bg-gray-300" },
    ];

    if (totalEgreso === 0) {
      return categorias.map((c) => ({ categoria: c.label, pct: 0, monto: "L. 0", color: c.color }));
    }

    return categorias
      .map((c) => {
        const montoCat = db.records
          .filter((t) => t.tipo === "Egreso" && t.categoria === c.key)
          .reduce((sum, t) => sum + t.monto, 0);
        const pct = Math.round((montoCat / totalEgreso) * 100);
        return {
          categoria: c.label,
          pct,
          monto: `L. ${montoCat.toLocaleString("en-HN")}`,
          color: c.color,
        };
      })
      .filter((c) => c.pct > 0 || db.records.some((t) => t.tipo === "Egreso" && t.categoria === c.categoria))
      .sort((a, b) => b.pct - a.pct);
  }, [db.records]);

  const formatTick = (val: number) => {
    if (val >= 1000000) return `L. ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `L. ${(val / 1000).toFixed(0)}K`;
    return `L. ${val}`;
  };

  return (
    <AppShell pageTitle="Finanzas" pageSubtitle={`Administrativo · Estado financiero agrícola en Lempiras`}>
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">{s.icon}</div>
                <div className={cn("flex items-center gap-1 text-[11px] font-body", s.up ? "text-primary" : "text-red-500")}>
                  {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {s.change}
                </div>
              </div>
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ingresos vs Gastos */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-sm text-[#1E1E1E]">Ingresos vs Gastos</h2>
                <p className="font-body text-xs text-[#9CA3AF]">Enero – Junio 2026 (HNL)</p>
              </div>
              <div className="flex items-center gap-3">
                {[{ label: "Ingresos", color: "var(--primary)" }, { label: "Gastos", color: "var(--accent)" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="font-body text-[11px] text-[#6B7280]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={4} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} tickFormatter={formatTick} />
                  <Tooltip
                    contentStyle={{ background: "#1E1E1E", border: "none", borderRadius: 10, fontFamily: "Outfit", fontSize: 11, color: "var(--background)" }}
                    formatter={(v) => [`L. ${(v as number).toLocaleString("en-US")}`]}
                    cursor={{ fill: "rgba(142,191,36,0.06)" }}
                  />
                  <Bar dataKey="ingresos" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gastos" fill="#D4EE9A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gastos by category */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading text-sm text-[#1E1E1E] mb-4">Distribución de Gastos</h2>
            <div className="space-y-3 max-h-[176px] overflow-y-auto pr-1">
              {gastosDistribucion.map((c) => (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", c.color)} />
                      <span className="font-body text-xs text-[#6B7280]">{c.categoria}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-xs text-[#9CA3AF]">{c.monto}</span>
                      <span className="font-medium-body text-xs text-[#1E1E1E] w-8 text-right">{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-card rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", c.color)} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
              {gastosDistribucion.length === 0 && (
                <p className="font-body text-xs text-[#9CA3AF] py-6 text-center">No hay registros de egresos para desglosar.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Transacciones Recientes</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { db.reset(); showToast("Datos de demostración restaurados."); }}
                title="Restaurar datos de demo"
                className="p-2 rounded-lg border border-border text-[#9CA3AF] hover:text-primary hover:border-primary/40 transition-all"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-body text-[#6B7280] hover:border-primary/40 transition-all"
              >
                <Download size={12} /> Exportar
              </button>
              <button
                onClick={() => { setEditingTransaccion(null); setTransaccionFormOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium-body hover:bg-primary-dark transition-colors"
              >
                <Plus size={12} /> Registrar Transacción
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {sortedTransacciones.length === 0 ? (
              <EmptyState
                icon={<DollarSign size={24} />}
                title="No hay transacciones"
                desc="No se registran movimientos financieros. Agrega un ingreso o egreso."
                action={
                  <button
                    onClick={() => { setEditingTransaccion(null); setTransaccionFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium-body hover:bg-primary-dark transition-colors"
                  >
                    <Plus size={12} /> Crear transacción
                  </button>
                }
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Concepto", "Categoría", "Tipo", "Monto", "Fecha", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransacciones.map((t) => (
                    <tr key={t.id} className="border-b border-secondary hover:bg-background transition-colors group">
                      <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{t.id}</td>
                      <td className="px-4 py-3 font-body text-xs text-[#1E1E1E] max-w-56 truncate">{t.concepto}</td>
                      <td className="px-4 py-3">
                        <Badge className="text-[10px] px-2 border-0 bg-secondary text-primary">{t.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] px-2 border-0", t.tipo === "Ingreso" ? "bg-secondary text-primary" : "bg-red-50 text-red-500")}>
                          {t.tipo}
                        </Badge>
                      </td>
                      <td className={cn("px-4 py-3 font-heading text-xs", t.tipo === "Ingreso" ? "text-primary" : "text-red-500")}>
                        {t.tipo === "Ingreso" ? "+ " : "- "}L. {t.monto.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[#9CA3AF]">{formatDate(t.fecha)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Editar"
                            onClick={() => { setEditingTransaccion(t); setTransaccionFormOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-secondary text-[#9CA3AF] hover:text-primary transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => setDeletingTransaccion(t)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Forms & Dialog Modals */}
      <TransaccionForm
        open={transaccionFormOpen}
        onClose={() => { setTransaccionFormOpen(false); setEditingTransaccion(null); }}
        onSave={handleSaveTransaccion}
        transaccion={editingTransaccion}
      />

      <ConfirmDeleteDialog
        open={!!deletingTransaccion}
        onClose={() => setDeletingTransaccion(null)}
        onConfirm={handleDeleteTransaccion}
        itemName={deletingTransaccion ? deletingTransaccion.concepto : ""}
        entityType="transacción"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </AppShell>
  );
}
