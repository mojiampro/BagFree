import type { NextRequest } from "next/server";
import { activateBooking, setPaymentStatus } from "@/lib/booking-server";
import { getStripe } from "@/lib/stripe";

/** Stripe webhook: the only place a booking becomes "paid". The signature is verified on the raw body. */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });
  if (!signature) return new Response("Missing signature", { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;
        // PromptPay may complete the session before funds arrive ("unpaid"); wait for async_payment_succeeded.
        if (bookingId && session.payment_status === "paid") await activateBooking(bookingId, "paid");
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const bookingId = event.data.object.metadata?.booking_id;
        if (bookingId) await activateBooking(bookingId, "paid");
        break;
      }
      case "checkout.session.async_payment_failed": {
        const bookingId = event.data.object.metadata?.booking_id;
        if (bookingId) await setPaymentStatus(bookingId, "failed");
        break;
      }
      case "checkout.session.expired": {
        const bookingId = event.data.object.metadata?.booking_id;
        if (bookingId) await setPaymentStatus(bookingId, "expired");
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // A non-2xx response makes Stripe retry the event later.
    const message = error instanceof Error ? error.message : "Handler failed";
    return new Response(`Webhook handler error: ${message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
