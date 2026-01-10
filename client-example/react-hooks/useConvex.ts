/**
 * Convex React Hooks
 *
 * This file provides React hooks for common Convex operations.
 * Copy this to your React frontend project.
 *
 * Usage:
 * 1. Install convex: npm install convex
 * 2. Copy the convex/ folder to your React project
 * 3. Run: npx convex dev (to generate types)
 * 4. Import and use these hooks
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// ============================================
// Product Hooks
// ============================================

/**
 * Fetch all products with optional filters
 * Automatically updates when products change
 */
export function useProducts(options?: {
  categoryId?: Id<"categories">;
  sellerId?: Id<"users">;
  includeDisabled?: boolean;
}) {
  return useQuery(api.products.getProducts, options ?? {});
}

/**
 * Fetch a single product by ID
 */
export function useProduct(productId: Id<"products"> | undefined) {
  return useQuery(
    api.products.getProductById,
    productId ? { productId } : "skip"
  );
}

/**
 * Fetch current seller's products
 */
export function useMyProducts() {
  return useQuery(api.products.getMyProducts, {});
}

/**
 * Product mutations
 */
export function useProductMutations() {
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const toggleStatus = useMutation(api.products.toggleProductStatus);

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
  };
}

// ============================================
// Cart Hooks
// ============================================

/**
 * Fetch user's cart with items and totals
 */
export function useCart() {
  return useQuery(api.cart.getCart, {});
}

/**
 * Cart mutations
 */
export function useCartMutations() {
  const addToCart = useMutation(api.cart.addToCart);
  const updateCartItem = useMutation(api.cart.updateCartItem);
  const removeCartItem = useMutation(api.cart.removeCartItem);
  const clearCart = useMutation(api.cart.clearCart);

  return {
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
  };
}

// ============================================
// Order Hooks
// ============================================

/**
 * Fetch user's orders
 */
export function useOrders(options?: { status?: string; limit?: number }) {
  return useQuery(api.orders.getUserOrders, options ?? {});
}

/**
 * Fetch a single order by ID
 */
export function useOrder(orderId: Id<"orders"> | undefined) {
  return useQuery(api.orders.getOrderById, orderId ? { orderId } : "skip");
}

/**
 * Fetch seller's orders
 */
export function useSellerOrders(options?: { status?: string; limit?: number }) {
  return useQuery(api.orders.getSellerOrders, options ?? {});
}

/**
 * Fetch seller order statistics
 */
export function useSellerStats() {
  return useQuery(api.orders.getSellerOrderStats, {});
}

/**
 * Order mutations
 */
export function useOrderMutations() {
  const createOrder = useMutation(api.orders.createOrder);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const updatePaymentStatus = useMutation(api.orders.updatePaymentStatus);
  const cancelOrder = useMutation(api.orders.cancelOrder);

  return {
    createOrder,
    updateStatus,
    updatePaymentStatus,
    cancelOrder,
  };
}

// ============================================
// Category Hooks
// ============================================

/**
 * Fetch all categories
 */
export function useCategories() {
  return useQuery(api.categories.getCategories, {});
}

/**
 * Fetch categories with product counts
 */
export function useCategoriesWithCount() {
  return useQuery(api.categories.getCategoriesWithCount, {});
}

/**
 * Fetch a single category
 */
export function useCategory(categoryId: Id<"categories"> | undefined) {
  return useQuery(
    api.categories.getCategoryById,
    categoryId ? { categoryId } : "skip"
  );
}

/**
 * Category mutations (admin only)
 */
export function useCategoryMutations() {
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  return {
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// ============================================
// Review Hooks
// ============================================

/**
 * Fetch reviews for a product
 */
export function useProductReviews(productId: Id<"products"> | undefined) {
  return useQuery(
    api.reviews.getProductReviews,
    productId ? { productId } : "skip"
  );
}

/**
 * Fetch product rating statistics
 */
export function useProductRating(productId: Id<"products"> | undefined) {
  return useQuery(
    api.reviews.getProductRatingStats,
    productId ? { productId } : "skip"
  );
}

/**
 * Check if user has reviewed a product
 */
export function useHasReviewed(productId: Id<"products"> | undefined) {
  return useQuery(
    api.reviews.hasUserReviewedProduct,
    productId ? { productId } : "skip"
  );
}

/**
 * Review mutations
 */
export function useReviewMutations() {
  const createReview = useMutation(api.reviews.createReview);
  const updateReview = useMutation(api.reviews.updateReview);
  const deleteReview = useMutation(api.reviews.deleteReview);

  return {
    createReview,
    updateReview,
    deleteReview,
  };
}

// ============================================
// Notification Hooks
// ============================================

/**
 * Fetch user's notifications
 */
export function useNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  return useQuery(api.notifications.getNotifications, options ?? {});
}

/**
 * Fetch unread notification count
 */
export function useUnreadCount() {
  return useQuery(api.notifications.getUnreadCount, {});
}

/**
 * Notification mutations
 */
export function useNotificationMutations() {
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const deleteAllRead = useMutation(api.notifications.deleteAllRead);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  };
}

// ============================================
// User/Vendor Hooks
// ============================================

/**
 * Fetch all vendors
 */
export function useVendors() {
  return useQuery(api.users.getVendors, {});
}

/**
 * Fetch vendor profile with stats
 */
export function useVendorProfile(vendorId: Id<"users"> | undefined) {
  return useQuery(
    api.users.getVendorProfile,
    vendorId ? { vendorId } : "skip"
  );
}

/**
 * Fetch platform statistics (admin only)
 */
export function usePlatformStats() {
  return useQuery(api.users.getPlatformStats, {});
}

// ============================================
// Auth Hooks
// ============================================

/**
 * Authentication mutations
 */
export function useAuth() {
  const signUp = useMutation(api.auth.signUp);
  const signIn = useMutation(api.auth.signIn);
  const signOut = useMutation(api.auth.signOut);
  const updateProfile = useMutation(api.auth.updateProfile);
  const updatePassword = useMutation(api.auth.updatePassword);

  return {
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
  };
}

/**
 * Get current user profile
 */
export function useCurrentUser() {
  return useQuery(api.auth.getCurrentUserQuery, {});
}
