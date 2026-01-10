import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Auction Migration Utilities
 *
 * Migrates auction data from PostgreSQL to Convex:
 * - Traditional auctions
 * - Bids
 * - Penny auctions
 * - Penny bids
 * - Bid packages
 * - User bid balances
 * - Bid transactions
 * - Auto-bid configs
 */

// Migrate a traditional auction
export const migrateAuction = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    condition: v.optional(v.string()),
    startingBid: v.number(),
    currentBid: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    imageUrl: v.optional(v.string()),
    sellerId: v.id("users"),
    highestBidderId: v.optional(v.id("users")),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    isDisabled: v.boolean(),
    reservePrice: v.optional(v.number()),
    buyNowPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auctions", args);
  },
});

// Migrate a bid
export const migrateBid = internalMutation({
  args: {
    auctionId: v.id("auctions"),
    bidderId: v.id("users"),
    amount: v.number(),
    isWinning: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bids", args);
  },
});

// Migrate a penny auction
export const migratePennyAuction = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    imageUrl: v.optional(v.string()),
    retailPrice: v.number(),
    startingPrice: v.number(),
    currentPrice: v.number(),
    bidIncrement: v.number(),
    bidCost: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    timerSeconds: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    highestBidderId: v.optional(v.id("users")),
    totalBids: v.number(),
    isDisabled: v.boolean(),
    sellerId: v.id("users"),
    featured: v.boolean(),
    winnerId: v.optional(v.id("users")),
    finalPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pennyAuctions", args);
  },
});

// Migrate a penny bid
export const migratePennyBid = internalMutation({
  args: {
    pennyAuctionId: v.id("pennyAuctions"),
    bidderId: v.id("users"),
    bidAmount: v.number(),
    bidCost: v.number(),
    newPrice: v.number(),
    timerExtended: v.boolean(),
    isAutoBid: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pennyBids", args);
  },
});

// Migrate a bid package
export const migrateBidPackage = internalMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    bidCount: v.number(),
    price: v.number(),
    isActive: v.boolean(),
    discountPercentage: v.number(),
    imageUrl: v.optional(v.string()),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if package with same name exists
    const existing = await ctx.db
      .query("bidPackages")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("bidPackages", args);
  },
});

// Migrate user bid balance
export const migrateUserBidBalance = internalMutation({
  args: {
    userId: v.id("users"),
    bidBalance: v.number(),
    totalBidsPurchased: v.number(),
    totalBidsUsed: v.number(),
    lastPurchaseDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if balance exists
    const existing = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bidBalance: args.bidBalance,
        totalBidsPurchased: args.totalBidsPurchased,
        totalBidsUsed: args.totalBidsUsed,
        lastPurchaseDate: args.lastPurchaseDate,
      });
      return existing._id;
    }

    return await ctx.db.insert("userBidBalances", args);
  },
});

// Migrate bid transaction
export const migrateBidTransaction = internalMutation({
  args: {
    userId: v.id("users"),
    bidPackageId: v.optional(v.id("bidPackages")),
    transactionType: v.union(
      v.literal("purchase"),
      v.literal("use"),
      v.literal("refund"),
      v.literal("bonus"),
      v.literal("expiry")
    ),
    bidCount: v.number(),
    amount: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    stripeSessionId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bidTransactions", args);
  },
});

// Migrate auto-bid config
export const migrateAutoBidConfig = internalMutation({
  args: {
    userId: v.id("users"),
    pennyAuctionId: v.id("pennyAuctions"),
    maxBids: v.number(),
    bidsUsed: v.number(),
    isActive: v.boolean(),
    stopWhenOutbid: v.boolean(),
    bidDelaySec: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("autoBidConfigs", args);
  },
});

// Get migration statistics
export const getAuctionMigrationStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const auctions = await ctx.db.query("auctions").collect();
    const bids = await ctx.db.query("bids").collect();
    const pennyAuctions = await ctx.db.query("pennyAuctions").collect();
    const pennyBids = await ctx.db.query("pennyBids").collect();
    const bidPackages = await ctx.db.query("bidPackages").collect();
    const userBalances = await ctx.db.query("userBidBalances").collect();
    const transactions = await ctx.db.query("bidTransactions").collect();

    return {
      auctions: auctions.length,
      bids: bids.length,
      pennyAuctions: pennyAuctions.length,
      pennyBids: pennyBids.length,
      bidPackages: bidPackages.length,
      userBalances: userBalances.length,
      transactions: transactions.length,
    };
  },
});
