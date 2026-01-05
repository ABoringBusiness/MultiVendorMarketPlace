/**
 * Reviews Data Migration Utility
 * 
 * This utility migrates review data from PostgreSQL to Convex.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a single review from PostgreSQL
 */
export const migrateReview = mutation({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product ${args.productId} not found`);
    }

    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(`User ${args.userId} not found`);
    }

    // Check if review already exists
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", args.userId)
      )
      .unique();

    if (existingReview) {
      throw new Error(`Review already exists for this product and user`);
    }

    // Insert review
    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: args.userId,
      rating: args.rating,
      comment: args.comment,
    });

    return {
      reviewId,
      message: "Review migrated successfully",
    };
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = mutation({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db.query("reviews").collect();

    const ratingCounts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const review of reviews) {
      ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
    }

    return {
      totalReviews: reviews.length,
      ratingDistribution: ratingCounts,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
    };
  },
});
