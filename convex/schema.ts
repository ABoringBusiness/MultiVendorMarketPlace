import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for Multi-Vendor Marketplace
 * 
 * This schema defines all database tables for the marketplace application.
 * Migrated from PostgreSQL/Sequelize models to Convex.
 */

export default defineSchema({
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
  })
    .index("by_name", ["name"]),

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
  })
    .index("by_user", ["userId"]),

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
});
