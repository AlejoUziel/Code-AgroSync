import { createHash } from "crypto";
import type Stripe from "stripe";
import { getStripe, planForStripePrice } from "@/lib/stripe";
import { withTransaction, type ResultSetHeader } from "@/lib/db";
import { captureOperationalError } from "@/lib/observability";

async function subscriptionFromEvent(event: Stripe.Event) {
  const object = event.data.object;
  if (object.object === "subscription") return object as Stripe.Subscription;
  if (object.object === "checkout.session") {
    const session = object as Stripe.Checkout.Session;
    const id = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    return id ? getStripe().subscriptions.retrieve(id) : null;
  }
  return null;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return Response.json({ message: "Webhook no configurado." }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ message: "Firma Stripe invalida." }, { status: 400 });
  }

  try {
    const subscription = await subscriptionFromEvent(event);
    if (!subscription) return Response.json({ received: true, ignored: true });
    const empresaId = subscription.metadata.empresaId;
    if (!/^[0-9a-f-]{36}$/i.test(empresaId ?? "")) throw new Error("Suscripcion Stripe sin empresaId valido.");
    const item = subscription.items.data[0];
    const priceId = item?.price.id ?? null;
    const plan = subscription.metadata.plan || planForStripePrice(priceId) || "starter";
    await withTransaction(async (execute) => {
      const inserted = await execute<ResultSetHeader>(
        `INSERT INTO billing_eventos (proveedor, evento_id, tipo, payload_hash)
         VALUES ('stripe', :eventId, :type, :payloadHash)
         ON CONFLICT (proveedor, evento_id) DO NOTHING`,
        { eventId: event.id, type: event.type, payloadHash: createHash("sha256").update(payload).digest("hex") },
      );
      if (!inserted.affectedRows) return;
      await execute("SELECT set_config('app.current_empresa_id', :empresaId, true)", { empresaId });
      await execute<ResultSetHeader>(
        `INSERT INTO suscripciones (
           empresa_id, plan_id, proveedor, proveedor_cliente_id, proveedor_suscripcion_id,
           proveedor_price_id, estado, cancelar_fin_periodo, periodo_inicia_en,
           periodo_finaliza_en, trial_finaliza_en, actualizada_en
         ) VALUES (
           :empresaId, :plan, 'stripe', :customerId, :subscriptionId,
           :priceId, :status, :cancelAtPeriodEnd, :periodStart,
           :periodEnd, :trialEnd, CURRENT_TIMESTAMP
         ) ON CONFLICT (empresa_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id, proveedor = 'stripe',
           proveedor_cliente_id = EXCLUDED.proveedor_cliente_id,
           proveedor_suscripcion_id = EXCLUDED.proveedor_suscripcion_id,
           proveedor_price_id = EXCLUDED.proveedor_price_id, estado = EXCLUDED.estado,
           cancelar_fin_periodo = EXCLUDED.cancelar_fin_periodo,
           periodo_inicia_en = EXCLUDED.periodo_inicia_en,
           periodo_finaliza_en = EXCLUDED.periodo_finaliza_en,
           trial_finaliza_en = EXCLUDED.trial_finaliza_en,
           actualizada_en = CURRENT_TIMESTAMP`,
        {
          empresaId,
          plan,
          customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          subscriptionId: subscription.id,
          priceId,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          periodStart: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
          periodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        },
      );
      await execute<ResultSetHeader>("UPDATE empresas SET plan = :plan WHERE id = :empresaId", { empresaId, plan: plan[0].toUpperCase() + plan.slice(1) });
    });
    return Response.json({ received: true });
  } catch (error) {
    const traceId = captureOperationalError(error, "billing.webhook.failed", { stripeEventId: event.id, stripeEventType: event.type });
    return Response.json({ message: "No se pudo procesar el evento.", traceId }, { status: 500 });
  }
}

