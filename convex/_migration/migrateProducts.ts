/**
 * Product Data Migration Utility
 * 
 * This utility migrates product data from PostgreSQL to Convex.
 * 
 * Note: This is a placeholder for Phase 2 implementation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a single product from PostgreSQL
 */
export const migrateProduct = mutation({
  args: {
    sellerId: v.id("users"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    isDisabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate seller exists
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new Error(`Seller ${args.sellerId} not found`);
    }

    // Validate category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error(`Category ${args.categoryId} not found`);
    }

    // Insert product
    const productId = await ctx.db.insert("products", {
      sellerId: args.sellerId,
      categoryId: args.categoryId,
      title: args.title,
      description: args.description,
      price: args.price,
      imageUrl: args.imageUrl,
      isDisabled: args.isDisabled,
    });

    return {
      productId,
      title: args.title,
      message: "Product migrated successfully",
    };
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

    return {
      totalProducts: products.length,
      active: products.filter((p) => !p.isDisabled).length,
      disabled: products.filter((p) => p.isDisabled).length,
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
 * // First, create a mapping of PostgreSQL UUIDs to Convex IDs
 * const userMapping = {}; // { pgUuid: convexId }
 * const categoryMapping = {};
 * 
 * // Fetch products from PostgreSQL
 * const products = await sequelize.query("SELECT * FROM products");
 * 
 * // Migrate each product
 * for (const product of products) {
 *   await client.mutation("_migration/migrateProducts:migrateProduct", {
 *     sellerId: userMapping[product.sellerId],
 *     categoryId: categoryMapping[product.categoryId],
 *     title: product.title,
 *     description: product.description,
 *     price: product.price,
 *     imageUrl: product.imageUrl,
 *     isDisabled: product.isDisabled || false,
 *   });
 * }
 * ```
 */
