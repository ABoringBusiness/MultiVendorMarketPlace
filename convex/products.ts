import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireSeller, requireAdmin, requireProductModifyPermission } from "./_helpers/auth";
import { isValidPrice, sanitizeString } from "./_helpers/validators";

/**
 * Product Management Functions
 * 
 * CRUD operations for products with role-based access control.
 */

/**
 * Create a new product (seller only)
 */
export const createProduct = mutation({
  args: {
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require seller role
    const user = await requireSeller(ctx);

    // Validate inputs
    const title = sanitizeString(args.title);
    if (!title || title.length < 3) {
      throw new Error("Product title must be at least 3 characters long");
    }

    if (!isValidPrice(args.price)) {
      throw new Error("Price must be a positive number");
    }

    // Validate category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Invalid category ID");
    }

    // Create product
    const productId = await ctx.db.insert("products", {
      sellerId: user._id,
      categoryId: args.categoryId,
      title,
      description: args.description ? sanitizeString(args.description) : undefined,
      price: args.price,
      imageUrl: args.imageUrl,
      isDisabled: false,
    });

    return {
      productId,
      message: "Product created successfully",
    };
  },
});

/**
 * Update a product (seller/admin only)
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    // Require permission to modify product
    await requireProductModifyPermission(ctx, args.productId);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const updates: Partial<{
      title: string;
      description: string | undefined;
      price: number;
      imageUrl: string | undefined;
      categoryId: string;
    }> = {};

    if (args.title) {
      const title = sanitizeString(args.title);
      if (title.length < 3) {
        throw new Error("Product title must be at least 3 characters long");
      }
      updates.title = title;
    }

    if (args.description !== undefined) {
      updates.description = args.description ? sanitizeString(args.description) : undefined;
    }

    if (args.price !== undefined) {
      if (!isValidPrice(args.price)) {
        throw new Error("Price must be a positive number");
      }
      updates.price = args.price;
    }

    if (args.imageUrl !== undefined) {
      updates.imageUrl = args.imageUrl || undefined;
    }

    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category) {
        throw new Error("Invalid category ID");
      }
      updates.categoryId = args.categoryId;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.productId, updates);
    }

    return {
      message: "Product updated successfully",
    };
  },
});

/**
 * Delete a product (seller/admin only)
 */
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Require permission to modify product
    await requireProductModifyPermission(ctx, args.productId);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete product
    await ctx.db.delete(args.productId);

    return {
      message: "Product deleted successfully",
    };
  },
});

/**
 * Toggle product status (enable/disable)
 */
export const toggleProductStatus = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // Sellers can only disable their own products
    if (user.role === "seller") {
      if (product.sellerId !== user._id) {
        throw new Error("Unauthorized to update this product");
      }
      // Sellers can only disable
      await ctx.db.patch(args.productId, { isDisabled: true });
      return {
        message: "Product disabled successfully",
        isDisabled: true,
      };
    }

    // Admins can toggle status
    if (user.role === "admin") {
      const newStatus = !product.isDisabled;
      await ctx.db.patch(args.productId, { isDisabled: newStatus });
      return {
        message: `Product ${newStatus ? "disabled" : "enabled"} successfully`,
        isDisabled: newStatus,
      };
    }

    throw new Error("Access denied");
  },
});

/**
 * Get all products with filters
 */
export const getProducts = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    sellerId: v.optional(v.id("users")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    search: v.optional(v.string()),
    includeDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db.query("products").collect();

    // Filter by category
    if (args.categoryId) {
      products = products.filter((p) => p.categoryId === args.categoryId);
    }

    // Filter by seller
    if (args.sellerId) {
      products = products.filter((p) => p.sellerId === args.sellerId);
    }

    // Filter by disabled status
    if (!args.includeDisabled) {
      products = products.filter((p) => !p.isDisabled);
    }

    // Filter by price range
    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    // Search by title or description
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Enrich with category and seller info
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        const seller = await ctx.db.get(product.sellerId);
        return {
          ...product,
          category: category ? { _id: category._id, name: category.name } : null,
          seller: seller ? { _id: seller._id, name: seller.name } : null,
        };
      })
    );

    return enrichedProducts;
  },
});

/**
 * Get a single product by ID
 */
export const getProductById = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || product.isDisabled) {
      throw new Error("Product not found");
    }

    // Get category and seller info
    const category = await ctx.db.get(product.categoryId);
    const seller = await ctx.db.get(product.sellerId);

    return {
      ...product,
      category: category ? { _id: category._id, name: category.name } : null,
      seller: seller ? { _id: seller._id, name: seller.name } : null,
    };
  },
});

/**
 * Get products by seller
 */
export const getSellerProducts = query({
  args: {
    sellerId: v.id("users"),
    includeDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    if (!args.includeDisabled) {
      products = products.filter((p) => !p.isDisabled);
    }

    // Enrich with category info
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return {
          ...product,
          category: category ? { _id: category._id, name: category.name } : null,
        };
      })
    );

    return enrichedProducts;
  },
});

/**
 * Get my products (current seller's products)
 */
export const getMyProducts = query({
  args: {
    includeDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can view their products");
    }

    let products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();

    if (!args.includeDisabled) {
      products = products.filter((p) => !p.isDisabled);
    }

    // Enrich with category info
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return {
          ...product,
          category: category ? { _id: category._id, name: category.name } : null,
        };
      })
    );

    return enrichedProducts;
  },
});
