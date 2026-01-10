import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireSeller, requireAdmin } from "./_helpers/auth";

/**
 * Penny Auction Functions
 *
 * Timer-based auctions where each bid:
 * - Costs the bidder a bid from their balance
 * - Increases the price by a small increment (e.g., $0.01)
 * - Extends the timer by a few seconds
 * - Makes the bidder the current winner
 */

// ============================================
// QUERIES
// ============================================

// Get active penny auctions
export const getActivePennyAuctions = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let auctions = await ctx.db
      .query("pennyAuctions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter
    auctions = auctions.filter((a) => !a.isDisabled && a.endTime > now);

    if (args.categoryId) {
      auctions = auctions.filter((a) => a.categoryId === args.categoryId);
    }

    if (args.featured !== undefined) {
      auctions = auctions.filter((a) => a.featured === args.featured);
    }

    // Sort by end time
    auctions.sort((a, b) => a.endTime - b.endTime);

    if (args.limit) {
      auctions = auctions.slice(0, args.limit);
    }

    // Enrich with additional data
    return Promise.all(
      auctions.map(async (auction) => {
        const category = await ctx.db.get(auction.categoryId);
        const highestBidder = auction.highestBidderId
          ? await ctx.db.get(auction.highestBidderId)
          : null;

        return {
          ...auction,
          categoryName: category?.name || "Unknown",
          highestBidderName: highestBidder?.name || null,
          timeRemaining: Math.max(0, auction.endTime - now),
          savings: auction.retailPrice - auction.currentPrice,
          savingsPercent: Math.round(
            ((auction.retailPrice - auction.currentPrice) / auction.retailPrice) * 100
          ),
        };
      })
    );
  },
});

// Get penny auction by ID
export const getPennyAuctionById = query({
  args: { auctionId: v.id("pennyAuctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return null;

    const category = await ctx.db.get(auction.categoryId);
    const seller = await ctx.db.get(auction.sellerId);
    const highestBidder = auction.highestBidderId
      ? await ctx.db.get(auction.highestBidderId)
      : null;

    // Get recent bids
    const recentBids = await ctx.db
      .query("pennyBids")
      .withIndex("by_auction", (q) => q.eq("pennyAuctionId", args.auctionId))
      .order("desc")
      .take(20);

    const bidsWithUsers = await Promise.all(
      recentBids.map(async (bid) => {
        const bidder = await ctx.db.get(bid.bidderId);
        return {
          ...bid,
          bidderName: bidder?.name || "Anonymous",
        };
      })
    );

    const now = Date.now();

    return {
      ...auction,
      categoryName: category?.name || "Unknown",
      sellerName: seller?.name || "Unknown",
      highestBidderName: highestBidder?.name || null,
      recentBids: bidsWithUsers,
      timeRemaining: Math.max(0, auction.endTime - now),
      savings: auction.retailPrice - auction.currentPrice,
    };
  },
});

// Get user's penny auction activity
export const getUserPennyActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // Get user's bids
    const bids = await ctx.db
      .query("pennyBids")
      .withIndex("by_bidder", (q) => q.eq("bidderId", userId))
      .order("desc")
      .take(100);

    // Get unique auctions
    const auctionIds = [...new Set(bids.map((b) => b.pennyAuctionId))];
    const auctions = await Promise.all(
      auctionIds.map((id) => ctx.db.get(id))
    );

    // Get user's auto-bid configs
    const autoBids = await ctx.db
      .query("autoBidConfigs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      totalBidsPlaced: bids.length,
      auctionsParticipated: auctionIds.length,
      recentBids: bids.slice(0, 20),
      activeAutoBids: autoBids.filter((a) => a.isActive),
      wonAuctions: auctions.filter((a) => a?.winnerId === userId),
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Place a penny bid
export const placePennyBid = mutation({
  args: {
    auctionId: v.id("pennyAuctions"),
    isAutoBid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const bidderId = await requireAuth(ctx);

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    if (auction.status !== "active") {
      throw new Error("Auction is not active");
    }

    const now = Date.now();
    if (auction.endTime < now) {
      throw new Error("Auction has ended");
    }

    if (auction.sellerId === bidderId) {
      throw new Error("Cannot bid on your own auction");
    }

    // Check user's bid balance
    const bidBalance = await ctx.db
      .query("userBidBalances")
      .withIndex("by_user", (q) => q.eq("userId", bidderId))
      .first();

    if (!bidBalance || bidBalance.bidBalance < 1) {
      throw new Error("Insufficient bid balance. Please purchase more bids.");
    }

    // Deduct bid from balance
    await ctx.db.patch(bidBalance._id, {
      bidBalance: bidBalance.bidBalance - 1,
      totalBidsUsed: bidBalance.totalBidsUsed + 1,
    });

    // Record the bid transaction
    await ctx.db.insert("bidTransactions", {
      userId: bidderId,
      transactionType: "use",
      bidCount: -1,
      amount: 0,
      paymentStatus: "completed",
      description: `Bid placed on "${auction.title}"`,
    });

    // Calculate new price and end time
    const newPrice = auction.currentPrice + auction.bidIncrement;
    const newEndTime = Math.max(auction.endTime, now + auction.timerSeconds * 1000);

    // Create the bid record
    const bidId = await ctx.db.insert("pennyBids", {
      pennyAuctionId: args.auctionId,
      bidderId,
      bidAmount: auction.bidIncrement,
      bidCost: auction.bidCost,
      newPrice,
      timerExtended: newEndTime > auction.endTime,
      isAutoBid: args.isAutoBid || false,
    });

    // Update auction
    await ctx.db.patch(args.auctionId, {
      currentPrice: newPrice,
      endTime: newEndTime,
      highestBidderId: bidderId,
      totalBids: auction.totalBids + 1,
    });

    // Notify previous bidder if different
    if (auction.highestBidderId && auction.highestBidderId !== bidderId) {
      await ctx.db.insert("notifications", {
        userId: auction.highestBidderId,
        title: "Outbid!",
        message: `You've been outbid on "${auction.title}". Price: $${newPrice.toFixed(2)}`,
        type: "bid",
        isRead: false,
        actionLink: `/penny-auctions/${args.auctionId}`,
      });
    }

    return {
      bidId,
      newPrice,
      newEndTime,
      timeRemaining: newEndTime - now,
    };
  },
});

// Set up auto-bid
export const setupAutoBid = mutation({
  args: {
    auctionId: v.id("pennyAuctions"),
    maxBids: v.number(),
    stopWhenOutbid: v.optional(v.boolean()),
    bidDelaySec: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const auction = await ctx.db.get(args.auctionId);
    if (!auction || auction.status !== "active") {
      throw new Error("Auction not active");
    }

    // Check existing config
    const existing = await ctx.db
      .query("autoBidConfigs")
      .withIndex("by_user_and_auction", (q) =>
        q.eq("userId", userId).eq("pennyAuctionId", args.auctionId)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        maxBids: args.maxBids,
        stopWhenOutbid: args.stopWhenOutbid ?? false,
        bidDelaySec: args.bidDelaySec ?? 1,
        isActive: true,
      });
      return existing._id;
    }

    // Create new config
    return await ctx.db.insert("autoBidConfigs", {
      userId,
      pennyAuctionId: args.auctionId,
      maxBids: args.maxBids,
      bidsUsed: 0,
      isActive: true,
      stopWhenOutbid: args.stopWhenOutbid ?? false,
      bidDelaySec: args.bidDelaySec ?? 1,
    });
  },
});

// Cancel auto-bid
export const cancelAutoBid = mutation({
  args: { auctionId: v.id("pennyAuctions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const config = await ctx.db
      .query("autoBidConfigs")
      .withIndex("by_user_and_auction", (q) =>
        q.eq("userId", userId).eq("pennyAuctionId", args.auctionId)
      )
      .first();

    if (config) {
      await ctx.db.patch(config._id, { isActive: false });
    }

    return { success: true };
  },
});

// Create penny auction (seller)
export const createPennyAuction = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    imageUrl: v.optional(v.string()),
    retailPrice: v.number(),
    bidIncrement: v.optional(v.number()),
    bidCost: v.optional(v.number()),
    startTime: v.number(),
    durationSeconds: v.number(),
    timerSeconds: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sellerId = await requireSeller(ctx);

    const auctionId = await ctx.db.insert("pennyAuctions", {
      title: args.title,
      description: args.description,
      categoryId: args.categoryId,
      imageUrl: args.imageUrl,
      retailPrice: args.retailPrice,
      startingPrice: 0,
      currentPrice: 0,
      bidIncrement: args.bidIncrement ?? 0.01,
      bidCost: args.bidCost ?? 0.5,
      startTime: args.startTime,
      endTime: args.startTime + args.durationSeconds * 1000,
      timerSeconds: args.timerSeconds ?? 10,
      status: args.startTime <= Date.now() ? "active" : "pending",
      highestBidderId: undefined,
      totalBids: 0,
      isDisabled: false,
      sellerId,
      featured: args.featured ?? false,
    });

    return auctionId;
  },
});

// Complete penny auction (internal)
export const completePennyAuction = internalMutation({
  args: { auctionId: v.id("pennyAuctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction || auction.status !== "active") {
      return { success: false };
    }

    if (auction.endTime > Date.now()) {
      return { success: false, reason: "Not ended yet" };
    }

    await ctx.db.patch(args.auctionId, {
      status: "completed",
      winnerId: auction.highestBidderId,
      finalPrice: auction.currentPrice,
    });

    // Notify winner
    if (auction.highestBidderId) {
      await ctx.db.insert("notifications", {
        userId: auction.highestBidderId,
        title: "You Won!",
        message: `Congratulations! You won "${auction.title}" for only $${auction.currentPrice.toFixed(2)} (retail: $${auction.retailPrice})!`,
        type: "auction",
        isRead: false,
        actionLink: `/penny-auctions/${args.auctionId}`,
      });
    }

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: auction.sellerId,
      title: "Auction Completed",
      message: `Your penny auction "${auction.title}" has ended with ${auction.totalBids} bids.`,
      type: "auction",
      isRead: false,
    });

    return { success: true, winnerId: auction.highestBidderId };
  },
});
