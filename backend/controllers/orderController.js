import { OrderModel } from "../models/supabase/orderModel.js";
import { supabase } from "../database/connection.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import Stripe from 'stripe';
import { ROLES } from "../constants/roles.js";

// Allow dependency injection for testing
let stripe;
if (process.env.NODE_ENV === 'test') {
  stripe = {
    paymentIntents: {
      create: async () => ({
        id: 'pi_test',
        client_secret: 'test_secret'
      })
    },
    webhooks: {
      constructEvent: () => ({
        type: 'payment_intent.succeeded',
        data: { object: { metadata: { order_id: 'test_order' } } }
      })
    }
  };
} else {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Create a new order
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const { product_id, quantity = 1 } = req.body;
  
  try {
    // Check authentication first (401)
    if (!req.user || !req.user.role) {
      return next(new ErrorHandler("Authentication required.", 401));
    }

    // Validate input first
    if (!product_id) {
      return next(new ErrorHandler("Product ID is required.", 400));
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return next(new ErrorHandler("Quantity must be at least 1.", 400));
    }

    // Check if user is a seller trying to buy (400) - business rule check must come first
    if (req.user.role.toUpperCase() === ROLES.SELLER.toUpperCase()) {
      return next(new ErrorHandler("You cannot buy your own product.", 400));
    }

    // Find product first
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return next(new ErrorHandler("Product not found.", 404));
      }
      console.error('Error finding product:', findError);
      return next(new ErrorHandler("Failed to find product", 500));
    }

    if (!product) {
      return next(new ErrorHandler("Product not found.", 404));
    }

    // Check if trying to buy own product (400) - business rule check must come first
    if (product.seller_id === req.user.id) {
      return next(new ErrorHandler("You cannot buy your own product.", 400));
    }

    // Check product status (400)
    if (product.status !== 'active') {
      return next(new ErrorHandler("Product is not available for purchase.", 400));
    }

    // Check if user is a buyer (403) - role check comes last
    if (req.user.role.toUpperCase() !== ROLES.BUYER.toUpperCase()) {
      return next(new ErrorHandler("Only buyers can create orders.", 403));
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(product.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        product_id,
        buyer_id: req.user.id,
        seller_id: product.seller_id
      }
    });

    // Create order record
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert([{
        product_id,
        buyer_id: req.user.id,
        seller_id: product.seller_id,
        amount: product.price,
        status: 'pending',
        stripe_payment_id: paymentIntent.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating order:', createError);
      return next(new ErrorHandler("Failed to create order", 500));
    }

    res.status(201).json({
      success: true,
      order,
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to create order", 500));
  }
});

// Get buyer's orders
export const getBuyerOrders = catchAsyncErrors(async (req, res, next) => {
  // Check authentication first (401)
  if (!req.user || !req.user.role) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', req.user.id);

  if (error) {
    console.error('Error fetching orders:', error);
    return next(new ErrorHandler("Failed to fetch orders", 500));
  }

  res.status(200).json({
    success: true,
    orders
  });
});

// Get order details
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check authentication first (401)
  if (!req.user || !req.user.role) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return next(new ErrorHandler("Order not found.", 404));
    }
    console.error('Error finding order:', error);
    return next(new ErrorHandler("Failed to find order", 500));
  }

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

  // Check authentication first (401)
  if (!req.user || !req.user.role) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !order) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  // Check if user is seller or admin
  if (order.seller_id !== req.user.id && req.user.role.toUpperCase() !== ROLES.ADMIN.toUpperCase()) {
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

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating order:', updateError);
    return next(new ErrorHandler("Failed to update order", 500));
  }

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
