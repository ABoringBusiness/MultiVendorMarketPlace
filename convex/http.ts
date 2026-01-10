import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * HTTP Router for Convex
 *
 * This allows external services (like Stripe webhooks) to call Convex
 * without going through the Express API.
 */

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Stripe webhook endpoint for order payments
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Process the webhook - in production, verify the signature
      const event = JSON.parse(body);

      switch (event.type) {
        case "checkout.session.completed":
          // Update order payment status
          const session = event.data.object;
          if (session.metadata?.orderId) {
            await ctx.runMutation(api.orders.updatePaymentStatus, {
              orderId: session.metadata.orderId as any,
              paymentStatus: "paid",
            });
          }
          break;

        case "payment_intent.payment_failed":
          // Handle failed payment
          console.log("Payment failed:", event.data.object.id);
          break;
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Stripe webhook for bid package purchases
http.route({
  path: "/webhooks/stripe/bids",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const event = JSON.parse(body);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        // Process bid package purchase
        // This will be handled by the bidPackages module when implemented
        console.log("Bid package purchase completed:", session.id);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Bid webhook error:", error);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
