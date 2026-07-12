import { resourceDefinitions } from "@/lib/resource-definitions";
import { agroReportPdf } from "@/lib/pdf";
import { listResource } from "@/lib/resource-store";

async function resourceOrSeed(resource: "cultivos" | "cosechas" | "alertas" | "reportes") {
  try {
    const result = await listResource(resource);
    return result.dbConfigured ? result.items : resourceDefinitions[resource].seed;
  } catch {
    return resourceDefinitions[resource].seed;
  }
}

export async function GET(_request: Request, context: RouteContext<"/api/reports/[id]/pdf">) {
  const { id } = await context.params;
  const reports = await resourceOrSeed("reportes");
  const report = reports.find((item) => item.id === id);
  const title = String(report?.titulo ?? `Reporte ${id}`);
  const [cultivos, cosechas, alertas] = await Promise.all([
    resourceOrSeed("cultivos"),
    resourceOrSeed("cosechas"),
    resourceOrSeed("alertas"),
  ]);
  const pdf = agroReportPdf({ id, title, cultivos, cosechas, alertas });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}.pdf"`,
    },
  });
}
