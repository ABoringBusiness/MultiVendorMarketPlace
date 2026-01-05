import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./_helpers/auth";
import { sanitizeString } from "./_helpers/validators";

/**
 * Category Management Functions
 * 
 * CRUD operations for product categories (admin only).
 */

/**
 * Create a new category (admin only)
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin role
    await requireAdmin(ctx);

    const name = sanitizeString(args.name);
    if (!name || name.length < 2) {
      throw new Error("Category name must be at least 2 characters long");
    }

    // Check if category already exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();

    if (existing) {
      throw new Error("Category already exists");
    }

    // Create category
    const categoryId = await ctx.db.insert("categories", {
      name,
      description: args.description ? sanitizeString(args.description) : undefined,
    });

    return {
      categoryId,
      message: "Category created successfully",
    };
  },
});

/**
 * Update a category (admin only)
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin role
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const updates: Partial<{
      name: string;
      description: string | undefined;
    }> = {};

    if (args.name) {
      const name = sanitizeString(args.name);
      if (name.length < 2) {
        throw new Error("Category name must be at least 2 characters long");
      }

      // Check if name is already taken
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();

      if (existing && existing._id !== args.categoryId) {
        throw new Error("Category name already exists");
      }

      updates.name = name;
    }

    if (args.description !== undefined) {
      updates.description = args.description ? sanitizeString(args.description) : undefined;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.categoryId, updates);
    }

    return {
      message: "Category updated successfully",
    };
  },
});

/**
 * Delete a category (admin only)
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Require admin role
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if any products are using this category
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .first();

    if (products) {
      throw new Error("Cannot delete category with existing products");
    }

    // Delete category
    await ctx.db.delete(args.categoryId);

    return {
      message: "Category deleted successfully",
    };
  },
});

/**
 * Get all categories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories;
  },
});

/**
 * Get a category by ID
 */
export const getCategoryById = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },
});

/**
 * Get category by name
 */
export const getCategoryByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  },
});

/**
 * Get categories with product count
 */
export const getCategoriesWithCount = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();

        return {
          ...category,
          productCount: products.length,
        };
      })
    );

    return categoriesWithCount;
  },
});
