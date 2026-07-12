import type { ResourceRecord } from "@/lib/resource-definitions";

type PdfColor = [number, number, number];

const colors = {
  primary: [0.557, 0.749, 0.141] as PdfColor,
  accent: [0.745, 0.91, 0.42] as PdfColor,
  dark: [0.118, 0.118, 0.118] as PdfColor,
  muted: [0.42, 0.45, 0.5] as PdfColor,
  surface: [0.976, 0.984, 0.965] as PdfColor,
  border: [0.886, 0.929, 0.839] as PdfColor,
  white: [1, 1, 1] as PdfColor,
  red: [0.92, 0.18, 0.18] as PdfColor,
  amber: [0.96, 0.62, 0.04] as PdfColor,
  blue: [0.22, 0.52, 0.92] as PdfColor,
};

function escapePdf(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function rgb(color: PdfColor) {
  return color.map((part) => part.toFixed(3)).join(" ");
}

function setFill(color: PdfColor) {
  return `${rgb(color)} rg`;
}

function setStroke(color: PdfColor) {
  return `${rgb(color)} RG`;
}

function text(value: string, x: number, y: number, size = 10, color: PdfColor = colors.dark, font = "F1") {
  return [
    "BT",
    `/${font} ${size} Tf`,
    setFill(color),
    `${x} ${y} Td`,
    `(${escapePdf(value)}) Tj`,
    "ET",
  ].join("\n");
}

function rect(x: number, y: number, width: number, height: number, fill: PdfColor, stroke?: PdfColor) {
  const ops = [setFill(fill)];
  if (stroke) ops.push(setStroke(stroke));
  ops.push(`${x} ${y} ${width} ${height} re`);
  ops.push(stroke ? "B" : "f");
  return ops.join("\n");
}

function line(x1: number, y1: number, x2: number, y2: number, color: PdfColor = colors.border, width = 1) {
  return [setStroke(color), `${width} w`, `${x1} ${y1} m`, `${x2} ${y2} l`, "S"].join("\n");
}

function statusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("alta") || normalized.includes("plaga") || normalized.includes("alerta")) return colors.red;
  if (normalized.includes("media") || normalized.includes("proceso") || normalized.includes("progreso") || normalized.includes("nuevo")) return colors.amber;
  if (normalized.includes("baja") || normalized.includes("completada") || normalized.includes("cosechado") || normalized.includes("activa")) return colors.primary;
  return colors.blue;
}

function statusLabel(status: unknown) {
  return String(status ?? "Pendiente");
}

function countBy(records: ResourceRecord[], key: string) {
  return records.reduce<Record<string, number>>((acc, record) => {
    const value = String(record[key] ?? "Sin estado");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function barChart(title: string, counts: Record<string, number>, x: number, y: number, width: number, height: number) {
  const entries = Object.entries(counts).slice(0, 5);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  const barHeight = 14;
  const gap = 10;
  const ops = [
    text(title, x, y + height - 14, 10, colors.dark, "F2"),
    line(x, y + height - 22, x + width, y + height - 22, colors.border),
  ];
  entries.forEach(([label, value], index) => {
    const rowY = y + height - 46 - index * (barHeight + gap);
    const barWidth = Math.max(8, (value / max) * (width - 120));
    ops.push(text(label.slice(0, 18), x, rowY + 3, 8, colors.muted));
    ops.push(rect(x + 100, rowY, barWidth, barHeight, statusColor(label)));
    ops.push(text(String(value), x + 108 + barWidth, rowY + 3, 8, colors.dark, "F2"));
  });
  return ops.join("\n");
}

function table(headers: string[], rows: string[][], x: number, y: number, widths: number[]) {
  const rowHeight = 22;
  const ops = [rect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight, colors.surface, colors.border)];
  let cursor = x;
  headers.forEach((header, index) => {
    ops.push(text(header, cursor + 6, y + 7, 8, colors.dark, "F2"));
    cursor += widths[index];
  });
  rows.slice(0, 5).forEach((row, rowIndex) => {
    const rowY = y - (rowIndex + 1) * rowHeight;
    ops.push(rect(x, rowY, widths.reduce((a, b) => a + b, 0), rowHeight, colors.white, colors.border));
    cursor = x;
    row.forEach((cell, index) => {
      if (index === row.length - 1) {
        ops.push(rect(cursor + 6, rowY + 7, 8, 8, statusColor(cell)));
        ops.push(text(cell.slice(0, 16), cursor + 18, rowY + 5, 8, colors.dark));
      } else {
        ops.push(text(cell.slice(0, 22), cursor + 6, rowY + 5, 8, colors.dark));
      }
      cursor += widths[index];
    });
  });
  return ops.join("\n");
}

function metricCard(label: string, value: string, note: string, x: number, y: number, width: number, color: PdfColor) {
  return [
    rect(x, y, width, 64, colors.white, colors.border),
    rect(x, y + 56, width, 8, color),
    text(label, x + 12, y + 42, 8, colors.muted, "F2"),
    text(value, x + 12, y + 22, 18, colors.dark, "F2"),
    text(note, x + 12, y + 9, 8, colors.muted),
  ].join("\n");
}

export function agroReportPdf(input: {
  id: string;
  title: string;
  cultivos: ResourceRecord[];
  cosechas: ResourceRecord[];
  alertas: ResourceRecord[];
}) {
  const plagas = input.alertas.filter((alerta) => String(alerta.tipo ?? "").toLowerCase().includes("plaga"));
  const totalToneladas = input.cosechas.reduce((sum, cosecha) => sum + Number(cosecha.toneladas ?? 0), 0);
  const cultivosEnRiesgo = input.cultivos.filter((cultivo) => ["Alerta", "Nuevo"].includes(String(cultivo.estado))).length;
  const alertasAltas = input.alertas.filter((alerta) => String(alerta.severidad) === "Alta").length;

  const cultivoRows = input.cultivos.map((cultivo) => [
    String(cultivo.nombre ?? ""),
    String(cultivo.parcela ?? ""),
    String(cultivo.etapa ?? ""),
    statusLabel(cultivo.estado),
  ]);
  const cosechaRows = input.cosechas.map((cosecha) => [
    String(cosecha.cultivo ?? ""),
    String(cosecha.fecha ?? ""),
    `${Number(cosecha.toneladas ?? 0).toLocaleString("es-HN")} ton`,
    statusLabel(cosecha.estado ?? cosecha.calidad),
  ]);
  const plagaRows = (plagas.length ? plagas : input.alertas).map((alerta) => [
    String(alerta.tipo ?? ""),
    String(alerta.zona ?? "Honduras"),
    String(alerta.mensaje ?? ""),
    statusLabel(alerta.severidad),
  ]);

  const content = [
    rect(0, 0, 612, 792, colors.surface),
    rect(0, 704, 612, 88, colors.dark),
    rect(42, 730, 38, 38, colors.primary),
    text("AS", 52, 742, 16, colors.white, "F2"),
    text("AgroSync", 92, 750, 22, colors.white, "F2"),
    text("Gestion Agricola Conectada A Datos Reales", 92, 733, 9, colors.accent),
    text(input.title, 42, 674, 22, colors.dark, "F2"),
    text(`Reporte ID: ${input.id}   |   Fecha: ${new Date().toLocaleDateString("es-HN")}   |   Honduras`, 42, 656, 9, colors.muted),
    metricCard("SIEMBRAS", String(input.cultivos.length), `${cultivosEnRiesgo} requieren seguimiento`, 42, 574, 160, cultivosEnRiesgo > 0 ? colors.amber : colors.primary),
    metricCard("COSECHA", totalToneladas.toLocaleString("es-HN"), "toneladas registradas", 226, 574, 160, colors.primary),
    metricCard("PLAGAS / ALERTAS", String(plagas.length || input.alertas.length), `${alertasAltas} alertas altas`, 410, 574, 160, alertasAltas > 0 ? colors.red : colors.primary),
    barChart("Grafica: estado de siembras", countBy(input.cultivos, "estado"), 42, 408, 245, 130),
    barChart("Grafica: severidad de plagas", countBy(plagas.length ? plagas : input.alertas, "severidad"), 325, 408, 245, 130),
    text("Detalle de siembra", 42, 382, 13, colors.dark, "F2"),
    table(["Cultivo", "Parcela", "Etapa", "Estado"], cultivoRows, 42, 350, [145, 120, 110, 150]),
    text("Detalle de cosecha", 42, 220, 13, colors.dark, "F2"),
    table(["Cultivo", "Fecha", "Toneladas", "Estado"], cosechaRows, 42, 188, [175, 95, 95, 160]),
    text("Plagas y alertas", 42, 96, 13, colors.dark, "F2"),
    table(["Tipo", "Zona", "Mensaje", "Semaforo"], plagaRows.slice(0, 2), 42, 68, [80, 90, 245, 110]),
    text("Semaforo: verde = controlado/bajo, amarillo = seguimiento, rojo = riesgo alto.", 42, 8, 8, colors.muted),
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let offset = 9;
  const body = objects.map((object, index) => {
    const rendered = `${index + 1} 0 obj\n${object}\nendobj\n`;
    const current = offset;
    offset += Buffer.byteLength(rendered, "utf8");
    return { rendered, offset: current };
  });

  const xrefStart = offset;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...body.map((entry) => `${String(entry.offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");

  return Buffer.from(`%PDF-1.4\n${body.map((entry) => entry.rendered).join("")}${xref}`, "utf8");
}
