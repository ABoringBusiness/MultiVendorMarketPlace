import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin, canModifyOrder } from "./_helpers/auth";
import { isValidOrderStatus, isValidPaymentStatus } from "./_helpers/validators";
import { calculateOrderTotal, formatPrice } from "./_helpers/utils";

/**
 * Order Management Functions
 * 
 * Create, update, and retrieve orders.
 */

/**
 * Create order from cart
 */
export const createOrder = mutation({
  args: {
    shippingAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Find user's cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!cart) {
      throw new Error("Cart is empty");
    }

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate products and calculate total
    const orderItemsData = [];
    let total = 0;

    for (const cartItem of cartItems) {
      const product = await ctx.db.get(cartItem.productId);
      if (!product || product.isDisabled) {
        throw new Error(`Product ${cartItem.productId} is not available`);
      }

      const itemTotal = product.price * cartItem.quantity;
      total += itemTotal;

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
      });
    }

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      total: formatPrice(total),
      status: "pending",
      shippingAddress: args.shippingAddress,
      paymentStatus: "unpaid",
    });

    // Create order items
    for (const itemData of orderItemsData) {
      await ctx.db.insert("orderItems", {
        orderId,
        ...itemData,
      });
    }

    // Clear cart
    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return {
      orderId,
      total: formatPrice(total),
      message: "Order created successfully",
    };
  },
});

/**
 * Update order status (seller/admin only)
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!isValidOrderStatus(args.status)) {
      throw new Error("Invalid order status");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check permission
    const canModify = await canModifyOrder(ctx, user._id, args.orderId);
    if (!canModify) {
      throw new Error("You do not have permission to update this order");
    }

    // Update status
    await ctx.db.patch(args.orderId, {
      status: args.status,
    });

    return {
      message: "Order status updated successfully",
    };
  },
});

/**
 * Update payment status (admin only)
 */
export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (!isValidPaymentStatus(args.paymentStatus)) {
      throw new Error("Invalid payment status");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Update payment status
    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
    });

    return {
      message: "Payment status updated successfully",
    };
  },
});

/**
 * Cancel order
 */
export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only the buyer can cancel their own order
    if (order.userId !== user._id && user.role !== "admin") {
      throw new Error("You do not have permission to cancel this order");
    }

    // Can only cancel pending or processing orders
    if (!["pending", "processing"].includes(order.status)) {
      throw new Error("Cannot cancel order with current status");
    }

    // Update status to cancelled
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
    });

    return {
      message: "Order cancelled successfully",
    };
  },
});

/**
 * Get user's orders
 */
export const getUserOrders = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    let orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by status if provided
    if (args.status) {
      orders = orders.filter((order) => order.status === args.status);
    }

    // Sort by creation time (newest first)
    orders.sort((a, b) => b._creationTime - a._creationTime);

    return orders;
  },
});

/**
 * Get order by ID with items
 */
export const getOrderById = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check permission - user must own the order, be a seller with products in the order, or be admin
    const canView = await canModifyOrder(ctx, user._id, args.orderId);
    if (!canView) {
      throw new Error("You do not have permission to view this order");
    }

    // Get order items with product details
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    const enrichedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product: product
            ? {
                _id: product._id,
                title: product.title,
                imageUrl: product.imageUrl,
              }
            : null,
        };
      })
    );

    return {
      ...order,
      items: enrichedItems,
    };
  },
});

/**
 * Get seller's orders (orders containing their products)
 */
export const getSellerOrders = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can view seller orders");
    }

    // Get all orders
    let allOrders = await ctx.db.query("orders").collect();

    // Filter by status if provided
    if (args.status) {
      allOrders = allOrders.filter((order) => order.status === args.status);
    }

    // Filter orders that contain seller's products
    const sellerOrders = [];

    for (const order of allOrders) {
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      let hasSellerProduct = false;
      for (const item of orderItems) {
        const product = await ctx.db.get(item.productId);
        if (product && product.sellerId === user._id) {
          hasSellerProduct = true;
          break;
        }
      }

      if (hasSellerProduct) {
        sellerOrders.push(order);
      }
    }

    // Sort by creation time (newest first)
    sellerOrders.sort((a, b) => b._creationTime - a._creationTime);

    return sellerOrders;
  },
});

/**
 * Get all orders (admin only)
 */
export const getAllOrders = query({
  args: {
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let orders = await ctx.db.query("orders").collect();

    // Filter by status if provided
    if (args.status) {
      orders = orders.filter((order) => order.status === args.status);
    }

    // Filter by payment status if provided
    if (args.paymentStatus) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus);
    }

    // Sort by creation time (newest first)
    orders.sort((a, b) => b._creationTime - a._creationTime);

    return orders;
  },
});

/**
 * Get order statistics for seller
 */
export const getSellerOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can view order statistics");
    }

    // Get all orders containing seller's products
    const allOrders = await ctx.db.query("orders").collect();

    let totalRevenue = 0;
    let orderCount = 0;
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of allOrders) {
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      let sellerRevenue = 0;
      let hasSellerProduct = false;

      for (const item of orderItems) {
        const product = await ctx.db.get(item.productId);
        if (product && product.sellerId === user._id) {
          hasSellerProduct = true;
          sellerRevenue += item.totalPrice;
        }
      }

      if (hasSellerProduct) {
        totalRevenue += sellerRevenue;
        orderCount++;
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
    }

    return {
      totalRevenue: formatPrice(totalRevenue),
      orderCount,
      statusCounts,
    };
  },
});
