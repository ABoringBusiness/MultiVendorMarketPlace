import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireSeller, requireAdmin } from "./_helpers/auth";

/**
 * Traditional Auction Functions
 *
 * Handles ascending bid auctions where the highest bidder wins when time expires.
 */

// ============================================
// QUERIES
// ============================================

// Get all active auctions
export const getActiveAuctions = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let query = ctx.db
      .query("auctions")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    const auctions = await query.collect();

    // Filter by category if provided
    let filtered = auctions.filter(
      (a) => !a.isDisabled && a.endTime > now
    );

    if (args.categoryId) {
      filtered = filtered.filter((a) => a.categoryId === args.categoryId);
    }

    // Sort by end time (ending soonest first)
    filtered.sort((a, b) => a.endTime - b.endTime);

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Get seller info for each auction
    return Promise.all(
      filtered.map(async (auction) => {
        const seller = await ctx.db.get(auction.sellerId);
        const category = await ctx.db.get(auction.categoryId);
        return {
          ...auction,
          sellerName: seller?.name || "Unknown",
          categoryName: category?.name || "Unknown",
          timeRemaining: auction.endTime - now,
        };
      })
    );
  },
});

// Get auction by ID
export const getAuctionById = query({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return null;

    const seller = await ctx.db.get(auction.sellerId);
    const category = await ctx.db.get(auction.categoryId);
    const highestBidder = auction.highestBidderId
      ? await ctx.db.get(auction.highestBidderId)
      : null;

    // Get bid history
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .order("desc")
      .take(10);

    const bidsWithUsers = await Promise.all(
      bids.map(async (bid) => {
        const bidder = await ctx.db.get(bid.bidderId);
        return {
          ...bid,
          bidderName: bidder?.name || "Anonymous",
        };
      })
    );

    return {
      ...auction,
      sellerName: seller?.name || "Unknown",
      categoryName: category?.name || "Unknown",
      highestBidderName: highestBidder?.name || null,
      recentBids: bidsWithUsers,
      timeRemaining: Math.max(0, auction.endTime - Date.now()),
    };
  },
});

// Get seller's auctions
export const getSellerAuctions = query({
  args: { sellerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const sellerId = args.sellerId || (identity?.subject as any);

    if (!sellerId) return [];

    const auctions = await ctx.db
      .query("auctions")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .order("desc")
      .collect();

    return auctions;
  },
});

// Get user's bids
export const getUserBids = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const bids = await ctx.db
      .query("bids")
      .withIndex("by_bidder", (q) => q.eq("bidderId", userId))
      .order("desc")
      .take(50);

    const bidsWithAuctions = await Promise.all(
      bids.map(async (bid) => {
        const auction = await ctx.db.get(bid.auctionId);
        return {
          ...bid,
          auctionTitle: auction?.title || "Unknown",
          auctionStatus: auction?.status || "unknown",
          auctionEndTime: auction?.endTime,
        };
      })
    );

    return bidsWithAuctions;
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a new auction
export const createAuction = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    condition: v.optional(v.string()),
    startingBid: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    imageUrl: v.optional(v.string()),
    reservePrice: v.optional(v.number()),
    buyNowPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sellerId = await requireSeller(ctx);

    // Validate times
    if (args.startTime >= args.endTime) {
      throw new Error("End time must be after start time");
    }

    if (args.startingBid <= 0) {
      throw new Error("Starting bid must be positive");
    }

    const auctionId = await ctx.db.insert("auctions", {
      ...args,
      sellerId,
      currentBid: args.startingBid,
      highestBidderId: undefined,
      status: args.startTime <= Date.now() ? "active" : "pending",
      isDisabled: false,
    });

    return auctionId;
  },
});

// Place a bid
export const placeBid = mutation({
  args: {
    auctionId: v.id("auctions"),
    amount: v.number(),
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

    if (auction.endTime < Date.now()) {
      throw new Error("Auction has ended");
    }

    if (auction.sellerId === bidderId) {
      throw new Error("Cannot bid on your own auction");
    }

    if (args.amount <= auction.currentBid) {
      throw new Error(`Bid must be higher than current bid of $${auction.currentBid}`);
    }

    // Mark previous winning bid as not winning
    if (auction.highestBidderId) {
      const previousBids = await ctx.db
        .query("bids")
        .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
        .filter((q) => q.eq(q.field("isWinning"), true))
        .collect();

      for (const bid of previousBids) {
        await ctx.db.patch(bid._id, { isWinning: false });
      }
    }

    // Create the new bid
    const bidId = await ctx.db.insert("bids", {
      auctionId: args.auctionId,
      bidderId,
      amount: args.amount,
      isWinning: true,
    });

    // Update auction
    await ctx.db.patch(args.auctionId, {
      currentBid: args.amount,
      highestBidderId: bidderId,
    });

    // Notify previous bidder
    if (auction.highestBidderId && auction.highestBidderId !== bidderId) {
      await ctx.db.insert("notifications", {
        userId: auction.highestBidderId,
        title: "Outbid!",
        message: `You've been outbid on "${auction.title}". Current bid: $${args.amount}`,
        type: "auction",
        isRead: false,
        actionLink: `/auctions/${args.auctionId}`,
      });
    }

    return bidId;
  },
});

// Buy now (instant purchase)
export const buyNow = mutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const buyerId = await requireAuth(ctx);

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    if (!auction.buyNowPrice) {
      throw new Error("Buy now is not available for this auction");
    }

    if (auction.status !== "active") {
      throw new Error("Auction is not active");
    }

    if (auction.sellerId === buyerId) {
      throw new Error("Cannot buy your own auction");
    }

    // End the auction
    await ctx.db.patch(args.auctionId, {
      status: "completed",
      highestBidderId: buyerId,
      currentBid: auction.buyNowPrice,
    });

    // Create a "bid" record for the buy now
    await ctx.db.insert("bids", {
      auctionId: args.auctionId,
      bidderId: buyerId,
      amount: auction.buyNowPrice,
      isWinning: true,
    });

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: auction.sellerId,
      title: "Auction Sold!",
      message: `Your auction "${auction.title}" was purchased via Buy Now for $${auction.buyNowPrice}`,
      type: "auction",
      isRead: false,
      actionLink: `/auctions/${args.auctionId}`,
    });

    return { success: true, finalPrice: auction.buyNowPrice };
  },
});

// Update auction (seller only)
export const updateAuction = mutation({
  args: {
    auctionId: v.id("auctions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    reservePrice: v.optional(v.number()),
    buyNowPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    // Check ownership
    const user = await ctx.db.get(userId);
    if (auction.sellerId !== userId && user?.role !== "admin") {
      throw new Error("Not authorized to update this auction");
    }

    // Can only update pending auctions or active ones with no bids
    if (auction.status === "completed" || auction.status === "cancelled") {
      throw new Error("Cannot update completed or cancelled auctions");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.reservePrice !== undefined) updates.reservePrice = args.reservePrice;
    if (args.buyNowPrice !== undefined) updates.buyNowPrice = args.buyNowPrice;

    await ctx.db.patch(args.auctionId, updates);
    return { success: true };
  },
});

// Cancel auction (seller/admin)
export const cancelAuction = mutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    const user = await ctx.db.get(userId);
    if (auction.sellerId !== userId && user?.role !== "admin") {
      throw new Error("Not authorized to cancel this auction");
    }

    if (auction.status === "completed") {
      throw new Error("Cannot cancel completed auction");
    }

    await ctx.db.patch(args.auctionId, { status: "cancelled" });

    // Notify highest bidder if any
    if (auction.highestBidderId) {
      await ctx.db.insert("notifications", {
        userId: auction.highestBidderId,
        title: "Auction Cancelled",
        message: `The auction "${auction.title}" has been cancelled.`,
        type: "auction",
        isRead: false,
      });
    }

    return { success: true };
  },
});

// Complete auction (internal/scheduled)
export const completeAuction = mutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction || auction.status !== "active") {
      return { success: false, reason: "Auction not active" };
    }

    if (auction.endTime > Date.now()) {
      return { success: false, reason: "Auction has not ended yet" };
    }

    // Check if reserve price was met
    const reserveMet = !auction.reservePrice || auction.currentBid >= auction.reservePrice;

    await ctx.db.patch(args.auctionId, {
      status: "completed",
    });

    // Notify winner and seller
    if (auction.highestBidderId && reserveMet) {
      await ctx.db.insert("notifications", {
        userId: auction.highestBidderId,
        title: "You Won!",
        message: `Congratulations! You won "${auction.title}" for $${auction.currentBid}`,
        type: "auction",
        isRead: false,
        actionLink: `/auctions/${args.auctionId}`,
      });

      await ctx.db.insert("notifications", {
        userId: auction.sellerId,
        title: "Auction Sold!",
        message: `Your auction "${auction.title}" sold for $${auction.currentBid}`,
        type: "auction",
        isRead: false,
        actionLink: `/auctions/${args.auctionId}`,
      });
    } else {
      // No winner or reserve not met
      await ctx.db.insert("notifications", {
        userId: auction.sellerId,
        title: "Auction Ended",
        message: `Your auction "${auction.title}" ended ${reserveMet ? "with no bids" : "without meeting reserve"}`,
        type: "auction",
        isRead: false,
        actionLink: `/auctions/${args.auctionId}`,
      });
    }

    return { success: true, winner: auction.highestBidderId, finalPrice: auction.currentBid };
  },
});
