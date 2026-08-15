import { accessErrorResponse, requireOrganizationAdmin } from "@/lib/authorization";
import { withTenantTransaction, type RowDataPacket } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await requireOrganizationAdmin();
    const rows = await withTenantTransaction(session.empresaId, (execute) => execute<(RowDataPacket & {
      plan_id: string; estado: string; proveedor: string | null; proveedor_cliente_id: string | null;
      proveedor_suscripcion_id: string | null; cancelar_fin_periodo: boolean;
      periodo_finaliza_en: Date | string | null; trial_finaliza_en: Date | string | null;
    })[]>(
      `SELECT plan_id, estado, proveedor, proveedor_cliente_id, proveedor_suscripcion_id,
              cancelar_fin_periodo, periodo_finaliza_en, trial_finaliza_en
       FROM suscripciones WHERE empresa_id = :empresaId LIMIT 1`,
      { empresaId: session.empresaId },
    ));
    return Response.json({ configured: isStripeConfigured(), subscription: rows[0] ?? null });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo consultar la facturacion.", 500);
  }
}

