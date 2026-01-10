import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for Multi-Vendor Marketplace
 *
 * This schema defines all database tables for the marketplace application.
 * Includes:
 * - Core e-commerce (users, products, orders, carts, reviews)
 * - Traditional auctions
 * - Penny auctions with bid packages
 * - Digital products and services
 * - Minute-based service billing
 */

export default defineSchema({
  // ============================================
  // CORE E-COMMERCE TABLES
  // ============================================

  // Users table - migrated from User model
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(), // bcrypt hashed password
    role: v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin")),
    isDisabled: v.boolean(),
    tokenIdentifier: v.optional(v.string()), // For Convex Auth integration
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_token", ["tokenIdentifier"]),

  // Categories table - migrated from Category model
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }).index("by_name", ["name"]),

  // Products table - migrated from Product model
  products: defineTable({
    sellerId: v.id("users"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    isDisabled: v.boolean(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_category", ["categoryId"])
    .index("by_status", ["isDisabled"])
    .index("by_seller_and_status", ["sellerId", "isDisabled"]),

  // Orders table - migrated from Order model
  orders: defineTable({
    userId: v.id("users"),
    total: v.number(),
    status: v.string(), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    shippingAddress: v.optional(v.string()),
    paymentStatus: v.string(), // 'unpaid', 'paid', 'refunded'
    stripeSessionId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_user_and_status", ["userId", "status"]),

  // OrderItems table - migrated from OrderItem model
  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_product", ["productId"]),

  // Carts table - migrated from Cart model
  carts: defineTable({
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  // CartItems table - migrated from CartItem model
  cartItems: defineTable({
    cartId: v.id("carts"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_cart", ["cartId"])
    .index("by_product", ["productId"])
    .index("by_cart_and_product", ["cartId", "productId"]),

  // Reviews table - migrated from Review model
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_product_and_user", ["productId", "userId"]),

  // Notifications table - migrated from Notification model
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // 'order', 'auction', 'bid', 'payment', 'system'
    isRead: v.boolean(),
    actionLink: v.optional(v.string()),
    metadata: v.optional(v.any()), // JSON metadata
    expiresAt: v.optional(v.number()), // Timestamp
  })
    .index("by_user", ["userId"])
    .index("by_read_status", ["isRead"])
    .index("by_type", ["type"])
    .index("by_user_and_read", ["userId", "isRead"]),

  // ============================================
  // TRADITIONAL AUCTION TABLES
  // ============================================

  // Auctions table - traditional ascending bid auctions
  auctions: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    condition: v.optional(v.string()), // 'new', 'like_new', 'good', 'fair'
    startingBid: v.number(),
    currentBid: v.number(),
    startTime: v.number(), // Timestamp
    endTime: v.number(), // Timestamp
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
    reservePrice: v.optional(v.number()), // Minimum price to sell
    buyNowPrice: v.optional(v.number()), // Instant purchase price
  })
    .index("by_category", ["categoryId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_end_time", ["endTime"])
    .index("by_start_time", ["startTime"])
    .index("by_status_and_end_time", ["status", "endTime"]),

  // Bids table - bids on traditional auctions
  bids: defineTable({
    auctionId: v.id("auctions"),
    bidderId: v.id("users"),
    amount: v.number(),
    isWinning: v.boolean(),
  })
    .index("by_auction", ["auctionId"])
    .index("by_bidder", ["bidderId"])
    .index("by_auction_and_amount", ["auctionId", "amount"]),

  // ============================================
  // PENNY AUCTION TABLES
  // ============================================

  // Penny Auctions - timer-based auctions with paid bids
  pennyAuctions: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("categories"),
    imageUrl: v.optional(v.string()),
    retailPrice: v.number(), // Original product value
    startingPrice: v.number(), // Usually $0
    currentPrice: v.number(), // Current price (increments with each bid)
    bidIncrement: v.number(), // Price increase per bid (default $0.01)
    bidCost: v.number(), // Cost to place a bid (default $0.50)
    startTime: v.number(),
    endTime: v.number(), // Current end time (extends with each bid)
    timerSeconds: v.number(), // Seconds added per bid (default 10)
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
  })
    .index("by_category", ["categoryId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_end_time", ["endTime"])
    .index("by_featured", ["featured"])
    .index("by_status_and_featured", ["status", "featured"]),

  // Penny Bids - individual bids on penny auctions
  pennyBids: defineTable({
    pennyAuctionId: v.id("pennyAuctions"),
    bidderId: v.id("users"),
    bidAmount: v.number(), // Always bidIncrement (e.g., $0.01)
    bidCost: v.number(), // Cost deducted from user's bid balance
    newPrice: v.number(), // Price after this bid
    timerExtended: v.boolean(), // Whether timer was extended
    isAutoBid: v.boolean(), // Whether this was an auto-bid
  })
    .index("by_auction", ["pennyAuctionId"])
    .index("by_bidder", ["bidderId"])
    .index("by_auction_and_time", ["pennyAuctionId"]),

  // Bid Packages - purchasable bid packs
  bidPackages: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    bidCount: v.number(), // Number of bids in package
    price: v.number(), // USD price
    isActive: v.boolean(),
    discountPercentage: v.number(), // Discount from regular price
    imageUrl: v.optional(v.string()),
    featured: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_featured", ["featured"]),

  // User Bid Balances - tracks user's available bids
  userBidBalances: defineTable({
    userId: v.id("users"),
    bidBalance: v.number(), // Available bids
    totalBidsPurchased: v.number(),
    totalBidsUsed: v.number(),
    lastPurchaseDate: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Bid Transactions - purchase and usage history
  bidTransactions: defineTable({
    userId: v.id("users"),
    bidPackageId: v.optional(v.id("bidPackages")),
    transactionType: v.union(
      v.literal("purchase"),
      v.literal("use"),
      v.literal("refund"),
      v.literal("bonus"),
      v.literal("expiry")
    ),
    bidCount: v.number(), // Positive for purchases, negative for usage
    amount: v.number(), // USD amount (for purchases)
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    stripeSessionId: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_package", ["bidPackageId"])
    .index("by_type", ["transactionType"])
    .index("by_status", ["paymentStatus"]),

  // Auto Bid Config - automated bidding settings
  autoBidConfigs: defineTable({
    userId: v.id("users"),
    pennyAuctionId: v.id("pennyAuctions"),
    maxBids: v.number(), // Maximum bids to place
    bidsUsed: v.number(), // Bids already placed
    isActive: v.boolean(),
    stopWhenOutbid: v.boolean(), // Stop if someone else bids
    bidDelaySec: v.number(), // Delay between auto-bids
  })
    .index("by_user", ["userId"])
    .index("by_auction", ["pennyAuctionId"])
    .index("by_active", ["isActive"])
    .index("by_user_and_auction", ["userId", "pennyAuctionId"]),

  // ============================================
  // DIGITAL PRODUCTS & SERVICES
  // ============================================

  // Digital Products - downloadable/access-based products
  digitalProducts: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    salePrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    sellerId: v.id("users"),
    fileUrl: v.optional(v.string()), // Stored file URL
    fileKey: v.optional(v.string()), // Storage key
    fileSize: v.optional(v.number()), // Bytes
    fileType: v.optional(v.string()), // MIME type
    previewUrl: v.optional(v.string()),
    deliveryType: v.union(
      v.literal("download"),
      v.literal("access_key"),
      v.literal("online_access")
    ),
    licenseType: v.union(
      v.literal("single_user"),
      v.literal("multi_user"),
      v.literal("subscription")
    ),
    subscriptionPeriod: v.optional(
      v.union(v.literal("monthly"), v.literal("yearly"))
    ),
    downloadLimit: v.optional(v.number()),
    isWatermarked: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("inactive")),
    tags: v.optional(v.array(v.string())),
    averageRating: v.number(),
    totalRatings: v.number(),
    totalSales: v.number(),
    allowAffiliates: v.boolean(),
    affiliateCommissionRate: v.number(), // Percentage
  })
    .index("by_category", ["categoryId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_delivery_type", ["deliveryType"]),

  // Digital Purchases - records of digital product purchases
  digitalPurchases: defineTable({
    productId: v.id("digitalProducts"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    amount: v.number(),
    paymentId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    accessDetails: v.optional(v.any()), // License keys, access URLs, etc.
    accessExpiration: v.optional(v.number()),
    downloadCount: v.number(),
    lastDownloadDate: v.optional(v.number()),
    affiliateId: v.optional(v.id("users")),
    affiliateCommission: v.optional(v.number()),
  })
    .index("by_product", ["productId"])
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"]),

  // ============================================
  // MINUTE-BASED SERVICES
  // ============================================

  // Minute Services - time-based service offerings
  minuteServices: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    ratePerMinute: v.number(), // USD per minute
    minimumMinutes: v.number(),
    maximumMinutes: v.optional(v.number()),
    maximumCharge: v.optional(v.number()), // Cap on total charge
    categoryId: v.id("categories"),
    providerId: v.id("users"), // Service provider
    isActive: v.boolean(),
    tags: v.optional(v.array(v.string())),
    averageRating: v.number(),
    totalRatings: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_provider", ["providerId"])
    .index("by_active", ["isActive"]),

  // Service Sessions - active or completed service sessions
  serviceSessions: defineTable({
    serviceId: v.id("minuteServices"),
    userId: v.id("users"), // Customer
    providerId: v.id("users"), // Service provider
    startTime: v.number(),
    endTime: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    amount: v.number(), // Total charge
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("disputed")
    ),
    paymentId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_service", ["serviceId"])
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId"])
    .index("by_status", ["status"]),

  // ============================================
  // PLATFORM SERVICE USAGE & BILLING
  // ============================================

  // Service Usage - tracks platform service consumption
  serviceUsage: defineTable({
    userId: v.id("users"),
    serviceType: v.union(
      v.literal("auction"),
      v.literal("marketplace"),
      v.literal("premium_listing"),
      v.literal("featured_product"),
      v.literal("analytics"),
      v.literal("api_access")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    ratePerMinute: v.number(),
    totalCost: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("billed")
    ),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["serviceType"])
    .index("by_status", ["status"]),

  // Service Billing - periodic billing records
  serviceBilling: defineTable({
    userId: v.id("users"),
    billingPeriodStart: v.number(),
    billingPeriodEnd: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    dueDate: v.number(),
    paymentDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    invoiceNumber: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_invoice", ["invoiceNumber"]),

  // Service Billing Items - line items in billing
  serviceBillingItems: defineTable({
    serviceBillingId: v.id("serviceBilling"),
    serviceUsageId: v.id("serviceUsage"),
    amount: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_billing", ["serviceBillingId"])
    .index("by_usage", ["serviceUsageId"]),
});
