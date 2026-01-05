import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth, requireAdmin } from "./_helpers/auth";

/**
 * User and Vendor Query Functions
 * 
 * Get information about users and vendors.
 */

/**
 * Get all vendors (sellers)
 */
export const getVendors = query({
  args: {
    includeDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "seller"))
      .collect();

    // Filter by disabled status
    if (!args.includeDisabled) {
      users = users.filter((u) => !u.isDisabled);
    }

    // Don't return password hashes
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    }));
  },
});

/**
 * Get vendor profile with statistics
 */
export const getVendorProfile = query({
  args: {
    vendorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (vendor.role !== "seller" && vendor.role !== "admin") {
      throw new Error("User is not a vendor");
    }

    // Get vendor's products
    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.vendorId))
      .collect();

    const activeProducts = products.filter((p) => !p.isDisabled);

    // Get vendor's reviews (through their products)
    let totalRating = 0;
    let reviewCount = 0;

    for (const product of products) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();

      for (const review of reviews) {
        totalRating += review.rating;
        reviewCount++;
      }
    }

    const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

    // Get vendor's order count (simplified - counts orders with their products)
    const allOrders = await ctx.db.query("orders").collect();
    let orderCount = 0;

    for (const order of allOrders) {
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      const hasVendorProduct = orderItems.some((item) => {
        const product = products.find((p) => p._id === item.productId);
        return !!product;
      });

      if (hasVendorProduct) {
        orderCount++;
      }
    }

    return {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      isDisabled: vendor.isDisabled,
      _creationTime: vendor._creationTime,
      stats: {
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        averageRating,
        reviewCount,
        orderCount,
      },
    };
  },
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: {
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin"))),
    includeDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let users = await ctx.db.query("users").collect();

    // Filter by role
    if (args.role) {
      users = users.filter((u) => u.role === args.role);
    }

    // Filter by disabled status
    if (!args.includeDisabled) {
      users = users.filter((u) => !u.isDisabled);
    }

    // Don't return password hashes
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    }));
  },
});

/**
 * Get user by ID (admin only or own profile)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Users can view their own profile, admin can view any profile
    if (currentUser._id !== args.userId && currentUser.role !== "admin") {
      throw new Error("You can only view your own profile");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Don't return password hash
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    };
  },
});

/**
 * Search users by name or email (admin only)
 */
export const searchUsers = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const searchLower = args.search.toLowerCase();
    const users = await ctx.db.query("users").collect();

    const filteredUsers = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );

    // Don't return password hashes
    return filteredUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    }));
  },
});

/**
 * Get platform statistics (admin only)
 */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const products = await ctx.db.query("products").collect();
    const orders = await ctx.db.query("orders").collect();
    const reviews = await ctx.db.query("reviews").collect();

    const buyers = users.filter((u) => u.role === "buyer");
    const sellers = users.filter((u) => u.role === "seller");
    const admins = users.filter((u) => u.role === "admin");

    const activeProducts = products.filter((p) => !p.isDisabled);
    const disabledUsers = users.filter((u) => u.isDisabled);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.total, 0);

    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    return {
      users: {
        total: users.length,
        buyers: buyers.length,
        sellers: sellers.length,
        admins: admins.length,
        disabled: disabledUsers.length,
      },
      products: {
        total: products.length,
        active: activeProducts.length,
        disabled: products.length - activeProducts.length,
      },
      orders: {
        total: orders.length,
        byStatus: ordersByStatus,
      },
      reviews: {
        total: reviews.length,
      },
      revenue: {
        total: totalRevenue,
      },
    };
  },
});
