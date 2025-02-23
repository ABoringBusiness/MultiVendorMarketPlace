import { OrderModel } from "../models/supabase/orderModel.js";
import { ProductModel } from "../models/supabase/productModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a new order
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const { product_id } = req.body;
  const product = await ProductModel.findById(product_id);

  if (!product) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  if (product.status !== 'active') {
    return next(new ErrorHandler("Product is not available for purchase.", 400));
  }

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(product.price * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      product_id,
      buyer_id: req.user.id,
      seller_id: product.seller_id
    },
    transfer_data: {
      // Transfer payment directly to seller's Stripe account
      destination: product.seller_id,
    },
  });

  // Create order record
  const order = await OrderModel.create({
    product_id,
    buyer_id: req.user.id,
    seller_id: product.seller_id,
    amount: product.price,
    stripe_payment_id: paymentIntent.id
  });

  res.status(201).json({
    success: true,
    order,
    client_secret: paymentIntent.client_secret
  });
});

// Get buyer's orders
export const getBuyerOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await OrderModel.findByBuyer(req.user.id);
  res.status(200).json({
    success: true,
    orders
  });
});

// Get order details
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const order = await OrderModel.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  // Check if user is buyer or seller
  if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
    return next(new ErrorHandler("Not authorized to view this order.", 403));
  }

  res.status(200).json({
    success: true,
    order
  });
});

// Update order status (Seller/Admin only)
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await OrderModel.findById(id);
  if (!order) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  // Check if user is seller or admin
  if (order.seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Not authorized to update this order.", 403));
  }

  // Validate status transition
  const validStatuses = ['completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status.", 400));
  }

  if (order.status !== 'paid') {
    return next(new ErrorHandler("Can only update paid orders.", 400));
  }

  const updatedOrder = await OrderModel.updateStatus(id, status);

  res.status(200).json({
    success: true,
    message: `Order ${status} successfully.`,
    order: updatedOrder
  });
});

// Handle Stripe webhook
export const handleStripeWebhook = catchAsyncErrors(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle payment events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await OrderModel.updateStatus(paymentIntent.metadata.order_id, 'paid');
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await OrderModel.updateStatus(failedPayment.metadata.order_id, 'cancelled');
      break;
  }

  res.json({ received: true });
});
