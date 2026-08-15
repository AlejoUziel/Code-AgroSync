import { accessErrorResponse, assertSameOrigin, requireOrganizationAdmin } from "@/lib/authorization";
import { withTenantTransaction, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { getStripe, stripePriceForPlan } from "@/lib/stripe";
import { recordSecurityEvent } from "@/lib/security-events";

function appUrl(request: Request) {
  return (process.env.APP_URL?.replace(/\/$/, "") || new URL(request.url).origin);
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireOrganizationAdmin();
    const body = (await request.json()) as { plan?: string };
    const plan = String(body.plan ?? "").toLowerCase();
    if (!["starter", "pro", "enterprise"].includes(plan)) return Response.json({ message: "Plan invalido." }, { status: 400 });
    const price = stripePriceForPlan(plan);
    const stripe = getStripe();
    const rows = await withTenantTransaction(session.empresaId, (execute) => execute<(RowDataPacket & {
      nombre: string; email: string; proveedor_cliente_id: string | null;
    })[]>(
      `SELECT e.nombre, e.email, s.proveedor_cliente_id
       FROM empresas e JOIN suscripciones s ON s.empresa_id = e.id
       WHERE e.id = :empresaId LIMIT 1`,
      { empresaId: session.empresaId },
    ));
    const company = rows[0];
    if (!company) return Response.json({ message: "Organizacion no encontrada." }, { status: 404 });
    let customerId = company.proveedor_cliente_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.nombre,
        metadata: { empresaId: session.empresaId },
      }, { idempotencyKey: `agrosync-customer-${session.empresaId}` });
      customerId = customer.id;
      await withTenantTransaction(session.empresaId, (execute) => execute<ResultSetHeader>(
        `UPDATE suscripciones SET proveedor = 'stripe', proveedor_cliente_id = :customerId,
         actualizada_en = CURRENT_TIMESTAMP WHERE empresa_id = :empresaId`,
        { empresaId: session.empresaId, customerId },
      ));
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: session.empresaId,
      metadata: { empresaId: session.empresaId, plan },
      subscription_data: { metadata: { empresaId: session.empresaId, plan } },
      success_url: `${appUrl(request)}/admin/facturacion?checkout=success`,
      cancel_url: `${appUrl(request)}/admin/facturacion?checkout=cancelled`,
    }, { idempotencyKey: `agrosync-checkout-${session.empresaId}-${plan}-${Date.now()}` });
    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "billing.checkout.created",
      targetType: "empresa",
      targetId: session.empresaId,
      result: "exito",
      metadata: { plan },
    });
    return Response.json({ url: checkout.url });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo iniciar Stripe Checkout.", 500);
  }
}

