import { accessErrorResponse, assertSameOrigin, requireOrganizationAdmin } from "@/lib/authorization";
import { withTenantTransaction, type RowDataPacket } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireOrganizationAdmin();
    const rows = await withTenantTransaction(session.empresaId, (execute) => execute<(RowDataPacket & { proveedor_cliente_id: string | null })[]>(
      "SELECT proveedor_cliente_id FROM suscripciones WHERE empresa_id = :empresaId LIMIT 1",
      { empresaId: session.empresaId },
    ));
    const customerId = rows[0]?.proveedor_cliente_id;
    if (!customerId) return Response.json({ message: "La organizacion aun no tiene cliente Stripe." }, { status: 409 });
    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL?.replace(/\/$/, "") || new URL(request.url).origin}/admin/facturacion`,
    });
    return Response.json({ url: portal.url });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo abrir el portal de facturacion.", 500);
  }
}

