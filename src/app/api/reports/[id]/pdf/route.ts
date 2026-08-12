import { resourceDefinitions } from "@/lib/resource-definitions";
import { agroReportPdf } from "@/lib/pdf";
import { listResource } from "@/lib/resource-store";
import { accessErrorResponse, requireResourceAccess } from "@/lib/authorization";

async function resourceOrSeed(resource: "cultivos" | "cosechas" | "alertas" | "reportes") {
  try {
    const result = await listResource(resource, "reportes");
    if (!result.dbConfigured) throw new Error("PostgreSQL no esta configurado.");
    return result.items;
  } catch {
    if (process.env.NODE_ENV !== "production") return resourceDefinitions[resource].seed;
    throw new Error("No se pudieron cargar los datos compartidos del reporte.");
  }
}

export async function GET(_request: Request, context: RouteContext<"/api/reports/[id]/pdf">) {
  try {
    await requireResourceAccess("reportes");
  } catch (error) {
    return accessErrorResponse(error, "No autorizado.", 401);
  }
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
