/**
 * Convex Service
 *
 * This service provides a bridge between the Express API and Convex backend.
 * It allows gradual migration from PostgreSQL/Sequelize to Convex by enabling
 * the Express routes to call Convex mutations and queries.
 */

const { ConvexHttpClient } = require("convex/browser");

// Convex client instance
let convexClient = null;

/**
 * Initialize the Convex HTTP client
 * Call this once during server startup
 */
function initializeConvex() {
  const deploymentUrl = process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT;

  if (!deploymentUrl) {
    console.warn(
      "⚠️  CONVEX_URL not set. Convex integration disabled. Set CONVEX_URL in .env to enable."
    );
    return null;
  }

  convexClient = new ConvexHttpClient(deploymentUrl);
  console.log("✅ Convex client initialized");
  return convexClient;
}

/**
 * Get the Convex client instance
 * @returns {ConvexHttpClient|null}
 */
function getConvexClient() {
  return convexClient;
}

/**
 * Check if Convex is enabled
 * @returns {boolean}
 */
function isConvexEnabled() {
  return convexClient !== null;
}

// ============================================
// Auth Functions
// ============================================

/**
 * Sign up a new user via Convex
 */
async function signUp({ name, email, password, role = "buyer" }) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("auth:signUp", {
      name,
      email,
      password,
      role,
    });
    return result;
  } catch (error) {
    console.error("Convex signUp error:", error);
    throw error;
  }
}

/**
 * Sign in a user via Convex
 */
async function signIn({ email, password }) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("auth:signIn", {
      email,
      password,
    });
    return result;
  } catch (error) {
    console.error("Convex signIn error:", error);
    throw error;
  }
}

/**
 * Get current user by session token
 */
async function getCurrentUser(sessionToken) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("auth:getCurrentUserQuery", {
      sessionToken,
    });
    return result;
  } catch (error) {
    console.error("Convex getCurrentUser error:", error);
    throw error;
  }
}

// ============================================
// Product Functions
// ============================================

/**
 * Get products with optional filters
 */
async function getProducts({ categoryId, sellerId, includeDisabled = false } = {}) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("products:getProducts", {
      categoryId,
      sellerId,
      includeDisabled,
    });
    return result;
  } catch (error) {
    console.error("Convex getProducts error:", error);
    throw error;
  }
}

/**
 * Get a single product by ID
 */
async function getProductById(productId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("products:getProductById", {
      productId,
    });
    return result;
  } catch (error) {
    console.error("Convex getProductById error:", error);
    throw error;
  }
}

/**
 * Create a new product
 */
async function createProduct(sessionToken, productData) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("products:createProduct", {
      sessionToken,
      ...productData,
    });
    return result;
  } catch (error) {
    console.error("Convex createProduct error:", error);
    throw error;
  }
}

/**
 * Update an existing product
 */
async function updateProduct(sessionToken, productId, updates) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("products:updateProduct", {
      sessionToken,
      productId,
      ...updates,
    });
    return result;
  } catch (error) {
    console.error("Convex updateProduct error:", error);
    throw error;
  }
}

/**
 * Delete a product
 */
async function deleteProduct(sessionToken, productId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("products:deleteProduct", {
      sessionToken,
      productId,
    });
    return result;
  } catch (error) {
    console.error("Convex deleteProduct error:", error);
    throw error;
  }
}

// ============================================
// Cart Functions
// ============================================

/**
 * Get user's cart
 */
async function getCart(sessionToken) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("cart:getCart", {
      sessionToken,
    });
    return result;
  } catch (error) {
    console.error("Convex getCart error:", error);
    throw error;
  }
}

/**
 * Add item to cart
 */
async function addToCart(sessionToken, productId, quantity = 1) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("cart:addToCart", {
      sessionToken,
      productId,
      quantity,
    });
    return result;
  } catch (error) {
    console.error("Convex addToCart error:", error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
async function updateCartItem(sessionToken, cartItemId, quantity) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("cart:updateCartItem", {
      sessionToken,
      cartItemId,
      quantity,
    });
    return result;
  } catch (error) {
    console.error("Convex updateCartItem error:", error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
async function removeCartItem(sessionToken, cartItemId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("cart:removeCartItem", {
      sessionToken,
      cartItemId,
    });
    return result;
  } catch (error) {
    console.error("Convex removeCartItem error:", error);
    throw error;
  }
}

/**
 * Clear entire cart
 */
async function clearCart(sessionToken) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("cart:clearCart", {
      sessionToken,
    });
    return result;
  } catch (error) {
    console.error("Convex clearCart error:", error);
    throw error;
  }
}

// ============================================
// Order Functions
// ============================================

/**
 * Create order from cart
 */
async function createOrder(sessionToken, shippingAddress) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("orders:createOrder", {
      sessionToken,
      shippingAddress,
    });
    return result;
  } catch (error) {
    console.error("Convex createOrder error:", error);
    throw error;
  }
}

/**
 * Get user's orders
 */
async function getUserOrders(sessionToken, { status, limit } = {}) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("orders:getUserOrders", {
      sessionToken,
      status,
      limit,
    });
    return result;
  } catch (error) {
    console.error("Convex getUserOrders error:", error);
    throw error;
  }
}

/**
 * Get order by ID
 */
async function getOrderById(sessionToken, orderId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("orders:getOrderById", {
      sessionToken,
      orderId,
    });
    return result;
  } catch (error) {
    console.error("Convex getOrderById error:", error);
    throw error;
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(sessionToken, orderId, status) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("orders:updateOrderStatus", {
      sessionToken,
      orderId,
      status,
    });
    return result;
  } catch (error) {
    console.error("Convex updateOrderStatus error:", error);
    throw error;
  }
}

// ============================================
// Category Functions
// ============================================

/**
 * Get all categories
 */
async function getCategories() {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("categories:getCategories", {});
    return result;
  } catch (error) {
    console.error("Convex getCategories error:", error);
    throw error;
  }
}

/**
 * Get categories with product count
 */
async function getCategoriesWithCount() {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("categories:getCategoriesWithCount", {});
    return result;
  } catch (error) {
    console.error("Convex getCategoriesWithCount error:", error);
    throw error;
  }
}

// ============================================
// Review Functions
// ============================================

/**
 * Get reviews for a product
 */
async function getProductReviews(productId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("reviews:getProductReviews", {
      productId,
    });
    return result;
  } catch (error) {
    console.error("Convex getProductReviews error:", error);
    throw error;
  }
}

/**
 * Create a review
 */
async function createReview(sessionToken, productId, rating, comment) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("reviews:createReview", {
      sessionToken,
      productId,
      rating,
      comment,
    });
    return result;
  } catch (error) {
    console.error("Convex createReview error:", error);
    throw error;
  }
}

// ============================================
// Notification Functions
// ============================================

/**
 * Get user notifications
 */
async function getNotifications(sessionToken, { unreadOnly, limit } = {}) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("notifications:getNotifications", {
      sessionToken,
      unreadOnly,
      limit,
    });
    return result;
  } catch (error) {
    console.error("Convex getNotifications error:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(sessionToken, notificationId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("notifications:markAsRead", {
      sessionToken,
      notificationId,
    });
    return result;
  } catch (error) {
    console.error("Convex markAsRead error:", error);
    throw error;
  }
}

/**
 * Create a notification (internal use)
 */
async function createNotification(userId, { title, message, type, actionLink, metadata }) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.mutation("notifications:createNotification", {
      userId,
      title,
      message,
      type,
      actionLink,
      metadata,
    });
    return result;
  } catch (error) {
    console.error("Convex createNotification error:", error);
    throw error;
  }
}

// ============================================
// User/Vendor Functions
// ============================================

/**
 * Get all vendors
 */
async function getVendors() {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("users:getVendors", {});
    return result;
  } catch (error) {
    console.error("Convex getVendors error:", error);
    throw error;
  }
}

/**
 * Get vendor profile
 */
async function getVendorProfile(vendorId) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("users:getVendorProfile", {
      vendorId,
    });
    return result;
  } catch (error) {
    console.error("Convex getVendorProfile error:", error);
    throw error;
  }
}

/**
 * Get platform statistics (admin only)
 */
async function getPlatformStats(sessionToken) {
  if (!convexClient) return null;

  try {
    const result = await convexClient.query("users:getPlatformStats", {
      sessionToken,
    });
    return result;
  } catch (error) {
    console.error("Convex getPlatformStats error:", error);
    throw error;
  }
}

module.exports = {
  // Initialization
  initializeConvex,
  getConvexClient,
  isConvexEnabled,

  // Auth
  signUp,
  signIn,
  getCurrentUser,

  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,

  // Cart
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,

  // Orders
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,

  // Categories
  getCategories,
  getCategoriesWithCount,

  // Reviews
  getProductReviews,
  createReview,

  // Notifications
  getNotifications,
  markNotificationAsRead,
  createNotification,

  // Users/Vendors
  getVendors,
  getVendorProfile,
  getPlatformStats,
};
