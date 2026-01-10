import { action, internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { SYSTEM_PROMPTS, MODELS, TOKEN_LIMITS } from "./config";
import type { ChatMessage, AgentResponse } from "./types";

/**
 * Customer Support Chatbot Agent
 *
 * Provides AI-powered customer support for:
 * - Order status inquiries
 * - Product questions
 * - Return/refund requests
 * - General marketplace help
 *
 * Features:
 * - Context-aware responses using order/user data
 * - Conversation history tracking
 * - Escalation to human support when needed
 */

// Store conversation in database for context
export const saveConversation = mutation({
  args: {
    userId: v.id("users"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
      })
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // For now, we'll store in notifications as a workaround
    // In production, you'd create a dedicated conversations table
    const existingConvo = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "chat_session"))
      .first();

    if (existingConvo) {
      await ctx.db.patch(existingConvo._id, {
        metadata: {
          messages: args.messages.slice(-20), // Keep last 20 messages
          updatedAt: Date.now(),
          ...args.metadata,
        },
      });
      return existingConvo._id;
    } else {
      return await ctx.db.insert("notifications", {
        userId: args.userId,
        title: "Support Chat Session",
        message: "Active support conversation",
        type: "chat_session",
        isRead: true,
        metadata: {
          messages: args.messages,
          createdAt: Date.now(),
          ...args.metadata,
        },
      });
    }
  },
});

// Get conversation history
export const getConversation = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const convo = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "chat_session"))
      .first();

    if (!convo || !convo.metadata) {
      return { messages: [] };
    }

    return {
      messages: (convo.metadata as any).messages || [],
      createdAt: (convo.metadata as any).createdAt,
      updatedAt: (convo.metadata as any).updatedAt,
    };
  },
});

// Get user's order context for support
export const getUserSupportContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user info
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get recent orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    // Get order items for context
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const products = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
              ...item,
              productTitle: product?.title || "Unknown Product",
            };
          })
        );

        return {
          ...order,
          items: products,
        };
      })
    );

    // Get unread notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .take(5);

    return {
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      recentOrders: ordersWithItems,
      unreadNotifications: notifications.length,
    };
  },
});

// Main chat action
export const chat = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return {
        success: false,
        message: "AI support is currently unavailable. Please try again later.",
      };
    }

    // Get user context
    let userContext;
    try {
      userContext = await ctx.runQuery(
        internal.agents.customerSupport.getUserSupportContext,
        { userId: args.userId }
      );
    } catch (e) {
      userContext = null;
    }

    // Build context-aware system prompt
    const systemPrompt = buildSupportSystemPrompt(userContext);

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (args.conversationHistory) {
      messages.push(...args.conversationHistory.slice(-10)); // Last 10 messages
    }

    // Add current message
    messages.push({ role: "user", content: args.message });

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: MODELS.DEFAULT_CHAT,
          messages,
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const assistantMessage = result.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error("Empty response");
      }

      // Check if escalation is needed
      const needsEscalation = checkForEscalation(assistantMessage, args.message);

      // Save conversation
      const updatedHistory = [
        ...(args.conversationHistory || []),
        { role: "user" as const, content: args.message },
        { role: "assistant" as const, content: assistantMessage },
      ];

      await ctx.runMutation(api.agents.customerSupport.saveConversation, {
        userId: args.userId,
        messages: updatedHistory,
        metadata: {
          needsEscalation,
          lastInteraction: Date.now(),
        },
      });

      return {
        success: true,
        message: assistantMessage,
        data: {
          needsEscalation,
          conversationLength: updatedHistory.length,
        },
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Support chat error:", error);
      return {
        success: false,
        message:
          "I apologize, but I'm having trouble processing your request. Please try again or contact our support team directly.",
      };
    }
  },
});

// Quick answers for common questions (no AI needed)
export const getQuickAnswer = action({
  args: {
    questionType: v.union(
      v.literal("shipping"),
      v.literal("returns"),
      v.literal("payment"),
      v.literal("account"),
      v.literal("tracking")
    ),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const answers: Record<string, string> = {
      shipping: `**Shipping Information**

• Standard shipping: 5-7 business days
• Express shipping: 2-3 business days
• International shipping: 10-14 business days

Shipping costs vary by seller and destination. You can see the shipping cost for each item on the product page.`,

      returns: `**Return Policy**

• Most items can be returned within 30 days of delivery
• Items must be unused and in original packaging
• Some sellers may have different return policies - check the product page
• Refunds are processed within 5-7 business days after we receive the return

To start a return, go to your Orders page and click "Request Return" on the item.`,

      payment: `**Payment Options**

We accept:
• Credit/Debit cards (Visa, MasterCard, Amex)
• PayPal
• Apple Pay / Google Pay

All payments are processed securely through Stripe. Your payment information is never stored on our servers.`,

      account: `**Account Help**

• To update your profile: Go to Settings > Profile
• To change password: Go to Settings > Security
• To update payment methods: Go to Settings > Payment
• To close your account: Contact support

For security reasons, some account changes require email verification.`,

      tracking: `**Order Tracking**

To track your order:
1. Go to "My Orders" in your account
2. Click on the order you want to track
3. Click "Track Package" for tracking details

You'll also receive email updates when your order ships and is delivered.`,
    };

    return {
      success: true,
      message: answers[args.questionType] || "Information not available.",
    };
  },
});

// Check order status
export const checkOrderStatus = action({
  args: {
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    if (args.orderId) {
      // Get specific order
      const order = await ctx.runQuery(api.orders.getOrderById, {
        orderId: args.orderId,
      });

      if (!order) {
        return {
          success: false,
          message: "Order not found. Please check the order ID and try again.",
        };
      }

      return {
        success: true,
        message: formatOrderStatus(order),
        data: order,
      };
    }

    // Get most recent order
    const orders = await ctx.runQuery(api.orders.getUserOrders, {
      limit: 1,
    });

    if (!orders || orders.length === 0) {
      return {
        success: false,
        message: "You don't have any orders yet.",
      };
    }

    return {
      success: true,
      message: formatOrderStatus(orders[0]),
      data: orders[0],
    };
  },
});

// Helper: Build context-aware system prompt
function buildSupportSystemPrompt(userContext: any): string {
  let prompt = SYSTEM_PROMPTS.CUSTOMER_SUPPORT;

  if (userContext) {
    prompt += `\n\nCustomer Context:
- Name: ${userContext.userName}
- Account type: ${userContext.userRole}
- Recent orders: ${userContext.recentOrders?.length || 0}`;

    if (userContext.recentOrders?.length > 0) {
      prompt += "\n\nRecent Order History:";
      userContext.recentOrders.forEach((order: any, i: number) => {
        prompt += `\n${i + 1}. Order ${order._id.slice(-8)} - $${order.total} - Status: ${order.status} - Payment: ${order.paymentStatus}`;
        if (order.items?.length > 0) {
          prompt += `\n   Items: ${order.items.map((it: any) => it.productTitle).join(", ")}`;
        }
      });
    }
  }

  return prompt;
}

// Helper: Check if human escalation is needed
function checkForEscalation(response: string, userMessage: string): boolean {
  const escalationKeywords = [
    "speak to a human",
    "talk to someone",
    "manager",
    "supervisor",
    "escalate",
    "complaint",
    "lawsuit",
    "attorney",
    "lawyer",
    "fraud",
    "stolen",
    "hacked",
  ];

  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Check user message for escalation triggers
  if (escalationKeywords.some((kw) => lowerMessage.includes(kw))) {
    return true;
  }

  // Check if AI suggests escalation
  if (
    lowerResponse.includes("human support") ||
    lowerResponse.includes("escalate") ||
    lowerResponse.includes("contact our team")
  ) {
    return true;
  }

  return false;
}

// Helper: Format order status message
function formatOrderStatus(order: any): string {
  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    processing: "🔄",
    shipped: "📦",
    delivered: "✅",
    cancelled: "❌",
  };

  return `**Order Status**

Order ID: ${order._id.slice(-8)}
Status: ${statusEmoji[order.status] || "📋"} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
Total: $${order.total.toFixed(2)}
Payment: ${order.paymentStatus === "paid" ? "✅ Paid" : "⏳ " + order.paymentStatus}
${order.shippingAddress ? `\nShipping to: ${order.shippingAddress}` : ""}

${order.status === "shipped" ? "Your order is on its way! You should receive it within 3-5 business days." : ""}
${order.status === "pending" ? "Your order is being prepared by the seller." : ""}
${order.status === "delivered" ? "Your order has been delivered. We hope you enjoy your purchase!" : ""}`;
}
