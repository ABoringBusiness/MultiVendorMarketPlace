/**
 * Order Data Migration Utility
 * 
 * This utility migrates order data from PostgreSQL to Convex.
 * 
 * Note: This is a placeholder for Phase 2 implementation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a single order with its items from PostgreSQL
 */
export const migrateOrder = mutation({
  args: {
    userId: v.id("users"),
    total: v.number(),
    status: v.string(),
    shippingAddress: v.optional(v.string()),
    paymentStatus: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(`User ${args.userId} not found`);
    }

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      total: args.total,
      status: args.status,
      shippingAddress: args.shippingAddress,
      paymentStatus: args.paymentStatus,
    });

    // Create order items
    for (const item of args.items) {
      // Validate product exists
      const product = await ctx.db.get(item.productId);
      if (!product) {
        console.warn(`Product ${item.productId} not found, skipping order item`);
        continue;
      }

      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }

    return {
      orderId,
      itemCount: args.items.length,
      message: "Order migrated successfully",
    };
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const orderItems = await ctx.db.query("orderItems").collect();

    const statusCounts: Record<string, number> = {};
    const paymentCounts: Record<string, number> = {};

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      paymentCounts[order.paymentStatus] = (paymentCounts[order.paymentStatus] || 0) + 1;
    }

    return {
      totalOrders: orders.length,
      totalOrderItems: orderItems.length,
      statusCounts,
      paymentCounts,
    };
  },
});

/**
 * Example usage from Node.js:
 * 
 * ```javascript
 * const { ConvexHttpClient } = require("convex/browser");
 * const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT);
 * 
 * // First, create mappings of PostgreSQL IDs to Convex IDs
 * const userMapping = {}; // { pgId: convexId }
 * const productMapping = {};
 * 
 * // Fetch orders from PostgreSQL
 * const orders = await sequelize.query(`
 *   SELECT o.*, array_agg(oi.*) as items
 *   FROM orders o
 *   LEFT JOIN order_items oi ON oi.order_id = o.id
 *   GROUP BY o.id
 * `);
 * 
 * // Migrate each order
 * for (const order of orders) {
 *   const items = order.items.map(item => ({
 *     productId: productMapping[item.product_id],
 *     quantity: item.quantity,
 *     unitPrice: parseFloat(item.unit_price),
 *     totalPrice: parseFloat(item.total_price),
 *   }));
 * 
 *   await client.mutation("_migration/migrateOrders:migrateOrder", {
 *     userId: userMapping[order.user_id],
 *     total: parseFloat(order.total),
 *     status: order.status,
 *     shippingAddress: order.shipping_address,
 *     paymentStatus: order.payment_status,
 *     items,
 *   });
 * }
 * ```
 */
