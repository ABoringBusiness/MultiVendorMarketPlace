import { action, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { SYSTEM_PROMPTS, MODELS, TOKEN_LIMITS } from "./config";
import type { Recommendation, AgentResponse } from "./types";

/**
 * Product Recommendation Agent
 *
 * Uses AI to provide personalized product recommendations based on:
 * - User's purchase history
 * - Browsing behavior
 * - Similar user preferences
 * - Product attributes and categories
 */

// Get user's order history for context
export const getUserContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's recent orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Get order items for these orders
    const orderItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return items;
      })
    );

    // Get product details
    const productIds = orderItems.flat().map((item) => item.productId);
    const products = await Promise.all(
      productIds.map((id) => ctx.db.get(id))
    );

    // Get user's reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      recentProducts: products.filter(Boolean),
      reviewedProducts: reviews.map((r) => ({
        productId: r.productId,
        rating: r.rating,
      })),
      orderCount: orders.length,
    };
  },
});

// Get products in a category for recommendations
export const getCategoryProducts = internalQuery({
  args: { categoryId: v.id("categories"), limit: v.number() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("isDisabled"), false))
      .take(args.limit);

    // Get category details
    const category = await ctx.db.get(args.categoryId);

    return {
      products,
      categoryName: category?.name || "Unknown",
    };
  },
});

// Main recommendation action
export const getRecommendations = action({
  args: {
    userId: v.optional(v.id("users")),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return {
        success: false,
        message: "OpenAI API key not configured",
        data: [],
      };
    }

    const limit = args.limit || 5;
    let contextData: any = {};
    let availableProducts: any[] = [];

    // Get user context if userId provided
    if (args.userId) {
      try {
        contextData = await ctx.runQuery(internal.agents.productRecommender.getUserContext, {
          userId: args.userId,
        });
      } catch (e) {
        // User may not have history yet
        contextData = { recentProducts: [], reviewedProducts: [], orderCount: 0 };
      }
    }

    // Get category products if categoryId provided
    if (args.categoryId) {
      try {
        const catData = await ctx.runQuery(
          internal.agents.productRecommender.getCategoryProducts,
          { categoryId: args.categoryId, limit: 50 }
        );
        availableProducts = catData.products;
      } catch (e) {
        availableProducts = [];
      }
    }

    // Build prompt for AI
    const userPrompt = buildRecommendationPrompt(
      contextData,
      availableProducts,
      args.context,
      limit
    );

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: MODELS.DEFAULT_CHAT,
          messages: [
            { role: "system", content: SYSTEM_PROMPTS.PRODUCT_RECOMMENDER },
            { role: "user", content: userPrompt },
          ],
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from AI");
      }

      // Parse AI response
      const recommendations = parseRecommendations(content);

      return {
        success: true,
        message: `Generated ${recommendations.length} recommendations`,
        data: recommendations,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Recommendation error:", error);
      return {
        success: false,
        message: error.message || "Failed to generate recommendations",
        data: [],
      };
    }
  },
});

// Get similar products based on a product
export const getSimilarProducts = action({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return {
        success: false,
        message: "OpenAI API key not configured",
        data: [],
      };
    }

    // Get the source product
    const product = await ctx.runQuery(api.products.getProductById, {
      productId: args.productId,
    });

    if (!product) {
      return {
        success: false,
        message: "Product not found",
        data: [],
      };
    }

    // Get products in the same category
    const categoryProducts = await ctx.runQuery(
      internal.agents.productRecommender.getCategoryProducts,
      { categoryId: product.categoryId, limit: 20 }
    );

    // Filter out the source product
    const candidates = categoryProducts.products.filter(
      (p: any) => p._id !== args.productId
    );

    if (candidates.length === 0) {
      return {
        success: true,
        message: "No similar products found",
        data: [],
      };
    }

    const userPrompt = `
Find products similar to this one:

Source Product:
- Title: ${product.title}
- Description: ${product.description || "No description"}
- Price: $${product.price}
- Category: ${categoryProducts.categoryName}

Available Products:
${candidates.map((p: any, i: number) => `${i + 1}. ID: ${p._id}, Title: ${p.title}, Price: $${p.price}`).join("\n")}

Return the top ${args.limit || 5} most similar products.
`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: MODELS.DEFAULT_CHAT,
          messages: [
            { role: "system", content: SYSTEM_PROMPTS.PRODUCT_RECOMMENDER },
            { role: "user", content: userPrompt },
          ],
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      const recommendations = parseRecommendations(content || "[]");

      return {
        success: true,
        message: `Found ${recommendations.length} similar products`,
        data: recommendations,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Similar products error:", error);
      return {
        success: false,
        message: error.message || "Failed to find similar products",
        data: [],
      };
    }
  },
});

// Helper function to build recommendation prompt
function buildRecommendationPrompt(
  userContext: any,
  availableProducts: any[],
  additionalContext: string | undefined,
  limit: number
): string {
  let prompt = `Generate ${limit} product recommendations.\n\n`;

  if (userContext.recentProducts?.length > 0) {
    prompt += "User's recent purchases:\n";
    userContext.recentProducts.forEach((p: any) => {
      prompt += `- ${p.title} ($${p.price})\n`;
    });
    prompt += "\n";
  }

  if (userContext.reviewedProducts?.length > 0) {
    prompt += "User's ratings:\n";
    userContext.reviewedProducts.forEach((r: any) => {
      prompt += `- Product ${r.productId}: ${r.rating}/5 stars\n`;
    });
    prompt += "\n";
  }

  if (availableProducts.length > 0) {
    prompt += "Available products to recommend from:\n";
    availableProducts.forEach((p: any, i: number) => {
      prompt += `${i + 1}. ID: ${p._id}, Title: ${p.title}, Price: $${p.price}\n`;
    });
    prompt += "\n";
  }

  if (additionalContext) {
    prompt += `Additional context: ${additionalContext}\n`;
  }

  prompt += "\nProvide recommendations in JSON array format.";

  return prompt;
}

// Helper function to parse AI recommendations
function parseRecommendations(content: string): Recommendation[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any) => ({
        productId: item.productId || item.id || "",
        score: item.score || item.relevance || 50,
        reason: item.reason || item.explanation || "Recommended for you",
      }));
    }
    return [];
  } catch (e) {
    console.error("Failed to parse recommendations:", e);
    return [];
  }
}
