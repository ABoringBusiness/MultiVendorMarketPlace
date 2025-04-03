const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Order, OrderItem, Product, User } = require("../models");

// @desc Create a Stripe checkout session
// @route POST /api/payments/checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    
    // Find the order
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product"
        }]
      }]
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order has already been paid" });
    }
    
    // Create line items for Stripe
    const lineItems = order.items.map(item => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.title,
            images: item.product.imageUrl ? [item.product.imageUrl] : [],
            description: item.product.description || ""
          },
          unit_amount: Math.round(item.unitPrice * 100) // Stripe uses cents
        },
        quantity: item.quantity
      };
    });
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/order/cancel?order_id=${order.id}`,
      metadata: {
        orderId: order.id
      }
    });
    
    // Update order with Stripe session ID
    order.stripeSessionId = session.id;
    await order.save();
    
    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Handle Stripe webhook events
// @route POST /api/payments/webhook
exports.handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      
      // Update order payment status
      if (session.metadata && session.metadata.orderId) {
        const order = await Order.findByPk(session.metadata.orderId);
        
        if (order) {
          order.paymentStatus = "paid";
          order.status = "processing";
          await order.save();
          console.log(`Payment completed for order ${order.id}`);
        }
      }
      break;
      
    case "payment_intent.payment_failed":
      const paymentIntent = event.data.object;
      console.log(`Payment failed: ${paymentIntent.last_payment_error?.message}`);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
};

// @desc Get payment status for an order
// @route GET /api/payments/status/:orderId
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const order = await Order.findOne({
      where: { id: orderId, userId },
      attributes: ["id", "paymentStatus", "stripeSessionId"]
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // If order has a Stripe session ID and payment is not yet marked as paid,
    // check the session status from Stripe
    if (order.stripeSessionId && order.paymentStatus !== "paid") {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        
        if (session.payment_status === "paid" && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.status = "processing";
          await order.save();
        }
        
        return res.json({
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          stripeStatus: session.payment_status
        });
      } catch (stripeError) {
        console.error("Stripe session retrieval error:", stripeError);
        return res.json({
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          stripeStatus: "unknown"
        });
      }
    }
    
    res.json({
      orderId: order.id,
      paymentStatus: order.paymentStatus
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};