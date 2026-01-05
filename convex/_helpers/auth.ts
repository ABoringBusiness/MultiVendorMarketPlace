import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Authentication and Authorization Helper Functions
 * 
 * These helpers provide role-based access control for Convex functions.
 */

/**
 * Get the current authenticated user from the context.
 * Returns null if no user is authenticated.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Find user by tokenIdentifier
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  return user;
}

/**
 * Require authentication. Throws an error if user is not authenticated.
 * Returns the authenticated user.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }
  if (user.isDisabled) {
    throw new Error("Account is disabled. Please contact support.");
  }
  return user;
}

/**
 * Require a specific role. Throws an error if user doesn't have the required role.
 * @param ctx - The query or mutation context
 * @param role - The required role ('buyer', 'seller', 'admin')
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: "buyer" | "seller" | "admin"
) {
  const user = await requireAuth(ctx);
  if (user.role !== role && user.role !== "admin") {
    // Admin has access to everything
    throw new Error(`Access denied. ${role} role required.`);
  }
  return user;
}

/**
 * Check if the current user is a seller.
 */
export async function isSeller(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return user !== null && (user.role === "seller" || user.role === "admin");
}

/**
 * Check if the current user is an admin.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return user !== null && user.role === "admin";
}

/**
 * Require seller role. Throws an error if user is not a seller or admin.
 */
export async function requireSeller(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "seller" && user.role !== "admin") {
    throw new Error("Access denied. Seller role required.");
  }
  return user;
}

/**
 * Require admin role. Throws an error if user is not an admin.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "admin") {
    throw new Error("Access denied. Admin role required.");
  }
  return user;
}

/**
 * Check if a user can modify a specific product.
 * Admins can modify any product.
 * Sellers can only modify their own products.
 */
export async function canModifyProduct(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  productId: Id<"products">
): Promise<boolean> {
  const product = await ctx.db.get(productId);
  if (!product) {
    return false;
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    return false;
  }

  // Admin can modify any product
  if (user.role === "admin") {
    return true;
  }

  // Seller can only modify their own products
  if (user.role === "seller" && product.sellerId === userId) {
    return true;
  }

  return false;
}

/**
 * Require permission to modify a product.
 * Throws an error if the user cannot modify the product.
 */
export async function requireProductModifyPermission(
  ctx: QueryCtx | MutationCtx,
  productId: Id<"products">
) {
  const user = await requireAuth(ctx);
  const canModify = await canModifyProduct(ctx, user._id, productId);
  
  if (!canModify) {
    throw new Error("You do not have permission to modify this product.");
  }
  
  return user;
}

/**
 * Check if a user can modify a specific order.
 * Buyers can modify their own orders (cancel).
 * Sellers can modify orders containing their products (update status).
 * Admins can modify any order.
 */
export async function canModifyOrder(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orderId: Id<"orders">
): Promise<boolean> {
  const order = await ctx.db.get(orderId);
  if (!order) {
    return false;
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    return false;
  }

  // Admin can modify any order
  if (user.role === "admin") {
    return true;
  }

  // Buyer can modify their own orders
  if (order.userId === userId) {
    return true;
  }

  // Seller can modify orders containing their products
  if (user.role === "seller") {
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    for (const item of orderItems) {
      const product = await ctx.db.get(item.productId);
      if (product && product.sellerId === userId) {
        return true;
      }
    }
  }

  return false;
}
