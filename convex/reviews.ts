import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin } from "./_helpers/auth";
import { isValidRating, sanitizeString } from "./_helpers/validators";
import { calculateAverageRating } from "./_helpers/utils";

/**
 * Review Management Functions
 * 
 * Create, update, delete, and retrieve product reviews.
 */

/**
 * Create a product review
 */
export const createReview = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Validate rating
    if (!isValidRating(args.rating)) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Validate product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", user._id)
      )
      .unique();

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // TODO: Optionally check if user has purchased this product
    // This would require checking order history

    // Create review
    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: user._id,
      rating: args.rating,
      comment: args.comment ? sanitizeString(args.comment) : undefined,
    });

    return {
      reviewId,
      message: "Review created successfully",
    };
  },
});

/**
 * Update a review
 */
export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // User can only update their own review
    if (review.userId !== user._id) {
      throw new Error("You can only update your own reviews");
    }

    const updates: Partial<{
      rating: number;
      comment: string | undefined;
    }> = {};

    if (args.rating !== undefined) {
      if (!isValidRating(args.rating)) {
        throw new Error("Rating must be between 1 and 5");
      }
      updates.rating = args.rating;
    }

    if (args.comment !== undefined) {
      updates.comment = args.comment ? sanitizeString(args.comment) : undefined;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.reviewId, updates);
    }

    return {
      message: "Review updated successfully",
    };
  },
});

/**
 * Delete a review
 */
export const deleteReview = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // User can delete their own review, admin can delete any review
    if (review.userId !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own reviews");
    }

    await ctx.db.delete(args.reviewId);

    return {
      message: "Review deleted successfully",
    };
  },
});

/**
 * Get reviews for a product
 */
export const getProductReviews = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    // Enrich with user info
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          user: user
            ? {
                _id: user._id,
                name: user.name,
              }
            : null,
        };
      })
    );

    // Sort by creation time (newest first)
    enrichedReviews.sort((a, b) => b._creationTime - a._creationTime);

    return enrichedReviews;
  },
});

/**
 * Get user's reviews
 */
export const getUserReviews = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;

    // If no userId provided, get current user's reviews
    if (!userId) {
      const user = await requireAuth(ctx);
      userId = user._id;
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with product info
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const product = await ctx.db.get(review.productId);
        return {
          ...review,
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

    // Sort by creation time (newest first)
    enrichedReviews.sort((a, b) => b._creationTime - a._creationTime);

    return enrichedReviews;
  },
});

/**
 * Get product rating statistics
 */
export const getProductRatingStats = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const ratings = reviews.map((r) => r.rating);
    const averageRating = calculateAverageRating(ratings);

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    for (const review of reviews) {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    }

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  },
});

/**
 * Check if user has reviewed a product
 */
export const hasUserReviewedProduct = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const review = await ctx.db
      .query("reviews")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", user._id)
      )
      .unique();

    return {
      hasReviewed: !!review,
      reviewId: review?._id,
    };
  },
});
