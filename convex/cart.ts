import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./_helpers/auth";
import { isValidQuantity } from "./_helpers/validators";

/**
 * Shopping Cart Functions
 * 
 * Add, update, remove items from cart.
 */

/**
 * Get user's cart with items
 */
export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Find or create cart
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!cart) {
      // Cart doesn't exist yet, return empty cart
      return {
        id: null,
        items: [],
        total: 0,
        itemCount: 0,
      };
    }

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    // Enrich with product details
    let total = 0;
    const enrichedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (product) {
          total += product.price * item.quantity;
          return {
            ...item,
            product: {
              _id: product._id,
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl,
              isDisabled: product.isDisabled,
            },
          };
        }
        return null;
      })
    );

    // Filter out null items (deleted products)
    const validItems = enrichedItems.filter((item) => item !== null);

    return {
      id: cart._id,
      items: validItems,
      total,
      itemCount: validItems.length,
    };
  },
});

/**
 * Add item to cart
 */
export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const quantity = args.quantity || 1;

    if (!isValidQuantity(quantity)) {
      throw new Error("Quantity must be a positive integer");
    }

    // Validate product exists and is not disabled
    const product = await ctx.db.get(args.productId);
    if (!product || product.isDisabled) {
      throw new Error("Product not found or unavailable");
    }

    // Find or create cart
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!cart) {
      const cartId = await ctx.db.insert("carts", {
        userId: user._id,
      });
      cart = await ctx.db.get(cartId);
    }

    if (!cart) {
      throw new Error("Failed to create cart");
    }

    // Check if item already exists in cart
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_and_product", (q) =>
        q.eq("cartId", cart._id).eq("productId", args.productId)
      )
      .unique();

    if (existingItem) {
      // Update quantity
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + quantity,
      });
    } else {
      // Create new cart item
      await ctx.db.insert("cartItems", {
        cartId: cart._id,
        productId: args.productId,
        quantity,
      });
    }

    return {
      message: "Item added to cart",
    };
  },
});

/**
 * Update cart item quantity
 */
export const updateCartItem = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!isValidQuantity(args.quantity)) {
      throw new Error("Quantity must be a positive integer");
    }

    // Find the cart item
    const cartItem = await ctx.db.get(args.itemId);
    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Verify the cart belongs to the user
    const cart = await ctx.db.get(cartItem.cartId);
    if (!cart || cart.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    // Update quantity
    await ctx.db.patch(args.itemId, {
      quantity: args.quantity,
    });

    return {
      message: "Cart item updated",
    };
  },
});

/**
 * Remove item from cart
 */
export const removeCartItem = mutation({
  args: {
    itemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Find the cart item
    const cartItem = await ctx.db.get(args.itemId);
    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Verify the cart belongs to the user
    const cart = await ctx.db.get(cartItem.cartId);
    if (!cart || cart.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    // Delete the cart item
    await ctx.db.delete(args.itemId);

    return {
      message: "Item removed from cart",
    };
  },
});

/**
 * Clear all items from cart
 */
export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Find user's cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!cart) {
      return {
        message: "Cart is already empty",
      };
    }

    // Delete all cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return {
      message: "Cart cleared",
    };
  },
});
