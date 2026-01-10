import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./_helpers/auth";

/**
 * Bid Package Functions
 *
 * Handles purchasable bid packages for penny auctions.
 * Users buy bid packages to get bids they can use in penny auctions.
 */

// ============================================
// QUERIES
// ============================================

// Get all active bid packages
export const getBidPackages = query({
  args: { featuredOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let packages = await ctx.db
      .query("bidPackages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (args.featuredOnly) {
      packages = packages.filter((p) => p.featured);
    }

    // Sort by price
    packages.sort((a, b) => a.price - b.price);

    // Calculate value per bid
    return packages.map((pkg) => ({
      ...pkg,
      pricePerBid: (pkg.price / pkg.bidCount).toFixed(2),
      savings: pkg.discountPercentage > 0
        ? `${pkg.discountPercentage}% off`
        : null,
    }));
  },
});

// Get user's bid balance
export const getUserBidBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const balance = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!balance) {
      return {
        bidBalance: 0,
        totalBidsPurchased: 0,
        totalBidsUsed: 0,
        lastPurchaseDate: null,
      };
    }

    return balance;
  },
});

// Get user's transaction history
export const getUserTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const transactions = await ctx.db
      .query("bidTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// ============================================
// MUTATIONS
// ============================================

// Purchase a bid package (creates pending transaction)
export const initiatePurchase = mutation({
  args: { packageId: v.id("bidPackages") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const pkg = await ctx.db.get(args.packageId);
    if (!pkg || !pkg.isActive) {
      throw new Error("Bid package not available");
    }

    // Create pending transaction
    const transactionId = await ctx.db.insert("bidTransactions", {
      userId,
      bidPackageId: args.packageId,
      transactionType: "purchase",
      bidCount: pkg.bidCount,
      amount: pkg.price,
      paymentStatus: "pending",
      description: `Purchase of ${pkg.name} (${pkg.bidCount} bids)`,
    });

    // Return transaction ID for Stripe checkout
    return {
      transactionId,
      packageName: pkg.name,
      bidCount: pkg.bidCount,
      amount: pkg.price,
    };
  },
});

// Complete purchase (called after Stripe webhook)
export const completePurchase = mutation({
  args: {
    transactionId: v.id("bidTransactions"),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.paymentStatus !== "pending") {
      throw new Error("Transaction already processed");
    }

    // Update transaction
    await ctx.db.patch(args.transactionId, {
      paymentStatus: "completed",
      stripeSessionId: args.stripeSessionId,
    });

    // Update or create user bid balance
    const existingBalance = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", transaction.userId))
      .first();

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        bidBalance: existingBalance.bidBalance + transaction.bidCount,
        totalBidsPurchased: existingBalance.totalBidsPurchased + transaction.bidCount,
        lastPurchaseDate: Date.now(),
      });
    } else {
      await ctx.db.insert("userBidBalances", {
        userId: transaction.userId,
        bidBalance: transaction.bidCount,
        totalBidsPurchased: transaction.bidCount,
        totalBidsUsed: 0,
        lastPurchaseDate: Date.now(),
      });
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      title: "Bids Added!",
      message: `${transaction.bidCount} bids have been added to your account.`,
      type: "payment",
      isRead: false,
    });

    return { success: true, bidsAdded: transaction.bidCount };
  },
});

// Refund purchase
export const refundPurchase = mutation({
  args: { transactionId: v.id("bidTransactions") },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.paymentStatus !== "completed") {
      throw new Error("Can only refund completed transactions");
    }

    // Check if user has enough bids to refund
    const balance = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", transaction.userId))
      .first();

    if (!balance || balance.bidBalance < transaction.bidCount) {
      throw new Error("User has already used some of these bids");
    }

    // Update transaction
    await ctx.db.patch(args.transactionId, {
      paymentStatus: "refunded",
    });

    // Deduct bids from balance
    await ctx.db.patch(balance._id, {
      bidBalance: balance.bidBalance - transaction.bidCount,
      totalBidsPurchased: balance.totalBidsPurchased - transaction.bidCount,
    });

    // Create refund transaction record
    await ctx.db.insert("bidTransactions", {
      userId: transaction.userId,
      bidPackageId: transaction.bidPackageId,
      transactionType: "refund",
      bidCount: -transaction.bidCount,
      amount: -transaction.amount,
      paymentStatus: "completed",
      description: `Refund of ${transaction.bidCount} bids`,
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      title: "Purchase Refunded",
      message: `Your purchase of ${transaction.bidCount} bids has been refunded.`,
      type: "payment",
      isRead: false,
    });

    return { success: true };
  },
});

// Add bonus bids (admin)
export const addBonusBids = mutation({
  args: {
    userId: v.id("users"),
    bidCount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Update or create balance
    const existingBalance = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        bidBalance: existingBalance.bidBalance + args.bidCount,
        totalBidsPurchased: existingBalance.totalBidsPurchased + args.bidCount,
      });
    } else {
      await ctx.db.insert("userBidBalances", {
        userId: args.userId,
        bidBalance: args.bidCount,
        totalBidsPurchased: args.bidCount,
        totalBidsUsed: 0,
      });
    }

    // Record transaction
    await ctx.db.insert("bidTransactions", {
      userId: args.userId,
      transactionType: "bonus",
      bidCount: args.bidCount,
      amount: 0,
      paymentStatus: "completed",
      description: `Bonus: ${args.reason}`,
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Bonus Bids!",
      message: `You received ${args.bidCount} bonus bids: ${args.reason}`,
      type: "payment",
      isRead: false,
    });

    return { success: true };
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

// Create bid package
export const createBidPackage = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    bidCount: v.number(),
    price: v.number(),
    discountPercentage: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return await ctx.db.insert("bidPackages", {
      name: args.name,
      description: args.description,
      bidCount: args.bidCount,
      price: args.price,
      isActive: true,
      discountPercentage: args.discountPercentage ?? 0,
      imageUrl: args.imageUrl,
      featured: args.featured ?? false,
    });
  },
});

// Update bid package
export const updateBidPackage = mutation({
  args: {
    packageId: v.id("bidPackages"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    bidCount: v.optional(v.number()),
    price: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    discountPercentage: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { packageId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(packageId, filteredUpdates);
    return { success: true };
  },
});

// Delete bid package
export const deleteBidPackage = mutation({
  args: { packageId: v.id("bidPackages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Soft delete by deactivating
    await ctx.db.patch(args.packageId, { isActive: false });
    return { success: true };
  },
});
