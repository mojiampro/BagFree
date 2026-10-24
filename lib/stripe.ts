import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY");
  if (!stripe) stripe = new Stripe(key, { appInfo: { name: "Bag Free" } });
  return stripe;
}
