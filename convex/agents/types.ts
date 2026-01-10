import { v } from "convex/values";

/**
 * AI Agent Type Definitions
 *
 * Common types and validators for Convex AI agents.
 */

// Message roles for chat-based agents
export const messageRoleValidator = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system")
);

// Chat message structure
export const chatMessageValidator = v.object({
  role: messageRoleValidator,
  content: v.string(),
});

// Agent response structure
export const agentResponseValidator = v.object({
  success: v.boolean(),
  message: v.string(),
  data: v.optional(v.any()),
  confidence: v.optional(v.number()),
  tokens: v.optional(v.number()),
});

// Product recommendation result
export const recommendationValidator = v.object({
  productId: v.string(),
  score: v.number(),
  reason: v.string(),
});

// Review sentiment analysis result
export const sentimentValidator = v.object({
  sentiment: v.union(
    v.literal("positive"),
    v.literal("negative"),
    v.literal("neutral")
  ),
  confidence: v.number(),
  keywords: v.array(v.string()),
  summary: v.string(),
});

// Search enhancement result
export const searchEnhancementValidator = v.object({
  originalQuery: v.string(),
  enhancedQuery: v.string(),
  synonyms: v.array(v.string()),
  categories: v.array(v.string()),
  filters: v.optional(
    v.object({
      minPrice: v.optional(v.number()),
      maxPrice: v.optional(v.number()),
      category: v.optional(v.string()),
    })
  ),
});

// Fraud detection result
export const fraudCheckValidator = v.object({
  riskScore: v.number(),
  flags: v.array(v.string()),
  recommendation: v.union(
    v.literal("approve"),
    v.literal("review"),
    v.literal("reject")
  ),
  details: v.string(),
});

// Types for TypeScript
export type MessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: MessageRole;
  content: string;
};

export type AgentResponse = {
  success: boolean;
  message: string;
  data?: any;
  confidence?: number;
  tokens?: number;
};

export type Recommendation = {
  productId: string;
  score: number;
  reason: string;
};

export type SentimentResult = {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  keywords: string[];
  summary: string;
};

export type SearchEnhancement = {
  originalQuery: string;
  enhancedQuery: string;
  synonyms: string[];
  categories: string[];
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
  };
};

export type FraudCheck = {
  riskScore: number;
  flags: string[];
  recommendation: "approve" | "review" | "reject";
  details: string;
};
