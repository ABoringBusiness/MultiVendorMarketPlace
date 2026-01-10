/**
 * Convex AI Agents Module
 *
 * This module provides AI-powered functionality for the marketplace:
 *
 * 1. Product Recommender - Personalized product recommendations
 * 2. Customer Support - AI chatbot for customer inquiries
 * 3. Review Analyzer - Sentiment analysis and fake review detection
 * 4. Search Enhancer - Query understanding and expansion
 * 5. Fraud Detector - Transaction and account risk analysis
 *
 * Configuration:
 * - Set OPENAI_API_KEY in environment for AI features
 * - Fallback functionality available without API key
 *
 * Usage:
 * ```typescript
 * import { api } from "../convex/_generated/api";
 *
 * // Get product recommendations
 * const recommendations = await convex.action(
 *   api.agents.productRecommender.getRecommendations,
 *   { userId, limit: 5 }
 * );
 *
 * // Chat with support
 * const response = await convex.action(
 *   api.agents.customerSupport.chat,
 *   { userId, message: "Where is my order?" }
 * );
 *
 * // Analyze reviews
 * const analysis = await convex.action(
 *   api.agents.reviewAnalyzer.analyzeProductReviews,
 *   { productId }
 * );
 *
 * // Enhance search
 * const enhanced = await convex.action(
 *   api.agents.searchEnhancer.enhanceQuery,
 *   { query: "red shoes under $100" }
 * );
 *
 * // Check fraud risk
 * const risk = await convex.action(
 *   api.agents.fraudDetector.analyzeOrder,
 *   { orderId }
 * );
 * ```
 */

// Re-export all agent modules
export * from "./types";
export * from "./config";

// Note: Individual agent functions are accessed via api.agents.<agentName>.<function>
// This file serves as documentation and type exports
