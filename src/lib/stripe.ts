import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_STARTER &&
    process.env.STRIPE_PRICE_PRO &&
    process.env.STRIPE_PRICE_ENTERPRISE,
  );
}

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error("STRIPE_SECRET_KEY no esta configurada.");
  stripeClient ??= new Stripe(secret);
  return stripeClient;
}

export function stripePriceForPlan(plan: string) {
  const prices: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  const price = prices[plan.toLowerCase()];
  if (!price) throw new Error(`No existe un Price ID configurado para ${plan}.`);
  return price;
}

export function planForStripePrice(priceId?: string | null) {
  const entries = [
    ["starter", process.env.STRIPE_PRICE_STARTER],
    ["pro", process.env.STRIPE_PRICE_PRO],
    ["enterprise", process.env.STRIPE_PRICE_ENTERPRISE],
  ] as const;
  return entries.find(([, configured]) => configured && configured === priceId)?.[0] ?? null;
}

