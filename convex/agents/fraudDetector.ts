import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { SYSTEM_PROMPTS, MODELS, TOKEN_LIMITS } from "./config";
import type { FraudCheck, AgentResponse } from "./types";

/**
 * Fraud Detection Agent
 *
 * Uses AI to detect potentially fraudulent activity:
 * - Unusual order patterns
 * - High-risk transactions
 * - Account anomalies
 * - Payment fraud indicators
 */

// Get user's order history for fraud analysis
export const getUserOrderHistory = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Get order frequency (orders per day)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter(
      (o) => now - o._creationTime < 7 * dayMs
    );

    return {
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      accountAge: now - user._creationTime,
      totalOrders,
      totalSpent,
      avgOrderValue,
      recentOrderCount: recentOrders.length,
      orders: orders.slice(0, 10).map((o) => ({
        id: o._id,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o._creationTime,
      })),
    };
  },
});

// Analyze an order for fraud risk
export const analyzeOrder = action({
  args: {
    orderId: v.id("orders"),
    shippingAddress: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    // Get order details
    const order = await ctx.runQuery(internal.orders.getOrderInternal, {
      orderId: args.orderId,
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        data: null,
      };
    }

    // Get user history
    const userHistory = await ctx.runQuery(
      internal.agents.fraudDetector.getUserOrderHistory,
      { userId: order.userId }
    );

    // Calculate risk score
    const riskFactors = calculateRiskFactors(order, userHistory, args);

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      // Return basic risk assessment
      return {
        success: true,
        message: `Risk score: ${riskFactors.score}/100`,
        data: riskFactors,
      };
    }

    // AI-enhanced analysis
    const prompt = buildFraudAnalysisPrompt(order, userHistory, args, riskFactors);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: MODELS.DEFAULT_ANALYSIS,
          messages: [
            { role: "system", content: SYSTEM_PROMPTS.FRAUD_DETECTOR },
            { role: "user", content: prompt },
          ],
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      const analysis = parseFraudAnalysis(content || "{}", riskFactors);

      return {
        success: true,
        message: `Risk score: ${analysis.riskScore}/100 - ${analysis.recommendation}`,
        data: analysis,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Fraud analysis error:", error);
      return {
        success: true,
        message: `Risk score: ${riskFactors.score}/100 (basic analysis)`,
        data: riskFactors,
      };
    }
  },
});

// Bulk analyze multiple orders
export const analyzeOrdersBatch = action({
  args: {
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const results: Array<{ orderId: string; risk: FraudCheck }> = [];

    for (const orderId of args.orderIds.slice(0, 10)) {
      try {
        const result = await ctx.runAction(
          internal.agents.fraudDetector.analyzeOrder,
          { orderId }
        );
        if (result.success && result.data) {
          results.push({
            orderId: orderId as string,
            risk: result.data,
          });
        }
      } catch (e) {
        // Skip failed analyses
      }
    }

    // Sort by risk score (highest first)
    results.sort((a, b) => b.risk.riskScore - a.risk.riskScore);

    const highRisk = results.filter((r) => r.risk.riskScore >= 70);
    const mediumRisk = results.filter(
      (r) => r.risk.riskScore >= 40 && r.risk.riskScore < 70
    );

    return {
      success: true,
      message: `Analyzed ${results.length} orders: ${highRisk.length} high risk, ${mediumRisk.length} medium risk`,
      data: {
        analyzed: results.length,
        highRisk: highRisk.length,
        mediumRisk: mediumRisk.length,
        results,
      },
    };
  },
});

// Detect account anomalies
export const detectAccountAnomalies = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const userHistory = await ctx.runQuery(
      internal.agents.fraudDetector.getUserOrderHistory,
      { userId: args.userId }
    );

    if (!userHistory) {
      return {
        success: false,
        message: "User not found",
        data: null,
      };
    }

    const anomalies: string[] = [];
    let riskScore = 0;

    // Check account age
    const accountAgeDays = userHistory.accountAge / (24 * 60 * 60 * 1000);
    if (accountAgeDays < 1 && userHistory.totalOrders > 3) {
      anomalies.push("New account with high order velocity");
      riskScore += 30;
    }

    // Check order velocity
    if (userHistory.recentOrderCount > 10) {
      anomalies.push("Unusually high order frequency in last 7 days");
      riskScore += 25;
    }

    // Check spending patterns
    if (userHistory.avgOrderValue > 500 && accountAgeDays < 7) {
      anomalies.push("High value orders from new account");
      riskScore += 20;
    }

    // Check for unusual patterns in orders
    const orders = userHistory.orders || [];
    const pendingOrders = orders.filter((o: any) => o.status === "pending");
    if (pendingOrders.length > 5) {
      anomalies.push("Multiple pending orders");
      riskScore += 15;
    }

    const recommendation =
      riskScore >= 70
        ? "review"
        : riskScore >= 40
          ? "review"
          : "approve";

    return {
      success: true,
      message:
        anomalies.length > 0
          ? `Found ${anomalies.length} potential anomalies`
          : "No anomalies detected",
      data: {
        riskScore: Math.min(riskScore, 100),
        flags: anomalies,
        recommendation,
        details: `Account: ${accountAgeDays.toFixed(1)} days old, ${userHistory.totalOrders} orders, $${userHistory.totalSpent.toFixed(2)} total spent`,
        accountStats: {
          ageDays: accountAgeDays,
          totalOrders: userHistory.totalOrders,
          totalSpent: userHistory.totalSpent,
          avgOrderValue: userHistory.avgOrderValue,
          recentOrders: userHistory.recentOrderCount,
        },
      },
    };
  },
});

// Helper: Calculate risk factors
function calculateRiskFactors(
  order: any,
  userHistory: any,
  additionalData: any
): FraudCheck {
  const flags: string[] = [];
  let riskScore = 0;

  // Order value risk
  if (order.total > 1000) {
    flags.push("High order value");
    riskScore += 15;
  }
  if (order.total > 5000) {
    flags.push("Very high order value");
    riskScore += 20;
  }

  // New account risk
  if (userHistory) {
    const accountAgeDays = userHistory.accountAge / (24 * 60 * 60 * 1000);
    if (accountAgeDays < 1) {
      flags.push("Account less than 24 hours old");
      riskScore += 25;
    } else if (accountAgeDays < 7) {
      flags.push("Account less than 7 days old");
      riskScore += 10;
    }

    // Order velocity
    if (userHistory.recentOrderCount > 5) {
      flags.push("High order frequency");
      riskScore += 15;
    }

    // First high-value order
    if (order.total > userHistory.avgOrderValue * 3 && userHistory.totalOrders > 0) {
      flags.push("Order value significantly above average");
      riskScore += 20;
    }
  } else {
    flags.push("Unable to verify user history");
    riskScore += 30;
  }

  // Address mismatch
  if (
    additionalData.shippingAddress &&
    additionalData.billingAddress &&
    additionalData.shippingAddress !== additionalData.billingAddress
  ) {
    flags.push("Shipping and billing addresses differ");
    riskScore += 10;
  }

  // Determine recommendation
  let recommendation: "approve" | "review" | "reject" = "approve";
  if (riskScore >= 70) {
    recommendation = "reject";
  } else if (riskScore >= 40) {
    recommendation = "review";
  }

  return {
    riskScore: Math.min(riskScore, 100),
    flags,
    recommendation,
    details: `Order #${order._id.slice(-8)} for $${order.total} - ${flags.length} risk factors identified`,
  };
}

// Helper: Build fraud analysis prompt
function buildFraudAnalysisPrompt(
  order: any,
  userHistory: any,
  additionalData: any,
  basicRisk: FraudCheck
): string {
  return `Analyze this transaction for fraud risk:

Order Details:
- Order ID: ${order._id}
- Total: $${order.total}
- Status: ${order.status}
- Payment Status: ${order.paymentStatus}
${additionalData.shippingAddress ? `- Shipping Address: ${additionalData.shippingAddress}` : ""}
${additionalData.billingAddress ? `- Billing Address: ${additionalData.billingAddress}` : ""}
${additionalData.paymentMethod ? `- Payment Method: ${additionalData.paymentMethod}` : ""}

Customer Profile:
${
  userHistory
    ? `- Account Age: ${(userHistory.accountAge / (24 * 60 * 60 * 1000)).toFixed(1)} days
- Total Orders: ${userHistory.totalOrders}
- Total Spent: $${userHistory.totalSpent.toFixed(2)}
- Average Order: $${userHistory.avgOrderValue.toFixed(2)}
- Orders in Last 7 Days: ${userHistory.recentOrderCount}`
    : "- No history available"
}

Initial Risk Assessment:
- Risk Score: ${basicRisk.riskScore}/100
- Flags: ${basicRisk.flags.join(", ") || "None"}

Provide a detailed fraud analysis in JSON format.`;
}

// Helper: Parse fraud analysis from AI
function parseFraudAnalysis(content: string, fallback: FraudCheck): FraudCheck {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        riskScore: parsed.riskScore ?? fallback.riskScore,
        flags: parsed.flags || fallback.flags,
        recommendation: parsed.recommendation || fallback.recommendation,
        details: parsed.details || fallback.details,
      };
    }
  } catch (e) {
    console.error("Failed to parse fraud analysis:", e);
  }
  return fallback;
}

// Internal query to get order (referenced by analyzeOrder)
export const getOrderInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});
