/**
 * Cart Data Migration Utility
 * 
 * This utility migrates cart and cart item data from PostgreSQL to Convex.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a cart with its items from PostgreSQL
 */
export const migrateCart = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(`User ${args.userId} not found`);
    }

    // Check if cart already exists for this user
    const existingCart = await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingCart) {
      throw new Error(`Cart already exists for user ${args.userId}`);
    }

    // Create cart
    const cartId = await ctx.db.insert("carts", {
      userId: args.userId,
    });

    // Create cart items
    let itemsCreated = 0;
    for (const item of args.items) {
      // Validate product exists
      const product = await ctx.db.get(item.productId);
      if (!product) {
        console.warn(`Product ${item.productId} not found, skipping cart item`);
        continue;
      }

      await ctx.db.insert("cartItems", {
        cartId,
        productId: item.productId,
        quantity: item.quantity,
      });
      itemsCreated++;
    }

    return {
      cartId,
      itemsCreated,
      message: "Cart migrated successfully",
    };
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = mutation({
  args: {},
  handler: async (ctx) => {
    const carts = await ctx.db.query("carts").collect();
    const cartItems = await ctx.db.query("cartItems").collect();

    return {
      totalCarts: carts.length,
      totalCartItems: cartItems.length,
      averageItemsPerCart:
        carts.length > 0 ? cartItems.length / carts.length : 0,
    };
  },
});
