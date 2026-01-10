import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { SYSTEM_PROMPTS, MODELS, TOKEN_LIMITS } from "./config";
import type { SentimentResult, AgentResponse } from "./types";

/**
 * Review Analyzer Agent
 *
 * Provides AI-powered review analysis:
 * - Sentiment analysis (positive, negative, neutral)
 * - Key theme extraction
 * - Fake review detection
 * - Product feedback summarization
 */

// Get reviews for a product
export const getProductReviewsInternal = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return reviewsWithUsers;
  },
});

// Analyze a single review
export const analyzeReview = action({
  args: {
    reviewText: v.string(),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // Fallback to simple analysis
      return fallbackAnalysis(args.reviewText, args.rating);
    }

    const prompt = `Analyze this product review:

Review: "${args.reviewText}"
${args.rating ? `Star Rating: ${args.rating}/5` : ""}

Provide analysis in JSON format.`;

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
            { role: "system", content: SYSTEM_PROMPTS.REVIEW_ANALYZER },
            { role: "user", content: prompt },
          ],
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      const analysis = parseSentimentResult(content || "{}");

      return {
        success: true,
        message: `Review is ${analysis.sentiment} (${analysis.confidence}% confidence)`,
        data: analysis,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Review analysis error:", error);
      return fallbackAnalysis(args.reviewText, args.rating);
    }
  },
});

// Analyze all reviews for a product
export const analyzeProductReviews = action({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    // Get all reviews for the product
    const reviews = await ctx.runQuery(
      internal.agents.reviewAnalyzer.getProductReviewsInternal,
      { productId: args.productId }
    );

    if (reviews.length === 0) {
      return {
        success: true,
        message: "No reviews found for this product",
        data: {
          totalReviews: 0,
          averageRating: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          topKeywords: [],
          summary: "No reviews available yet.",
        },
      };
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return fallbackProductAnalysis(reviews);
    }

    // Format reviews for analysis
    const reviewsText = reviews
      .map(
        (r: any) =>
          `[${r.rating}/5 stars] "${r.comment || "No comment"}" - by ${r.userName}`
      )
      .join("\n\n");

    const prompt = `Analyze these ${reviews.length} product reviews and provide an overall summary:

${reviewsText}

Provide analysis in JSON format with:
1. Overall sentiment (positive/negative/neutral)
2. Sentiment breakdown (percentage of each)
3. Top 5 keywords/themes mentioned
4. Brief summary of the reviews
5. Average star rating
6. Any potential fake review flags`;

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
            { role: "system", content: SYSTEM_PROMPTS.REVIEW_ANALYZER },
            { role: "user", content: prompt },
          ],
          max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      const analysis = parseProductAnalysis(content || "{}", reviews);

      return {
        success: true,
        message: `Analyzed ${reviews.length} reviews`,
        data: analysis,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Product review analysis error:", error);
      return fallbackProductAnalysis(reviews);
    }
  },
});

// Detect potentially fake reviews
export const detectFakeReviews = action({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const reviews = await ctx.runQuery(
      internal.agents.reviewAnalyzer.getProductReviewsInternal,
      { productId: args.productId }
    );

    if (reviews.length < 3) {
      return {
        success: true,
        message: "Not enough reviews to analyze for authenticity",
        data: { suspiciousReviews: [], confidence: 0 },
      };
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return {
        success: false,
        message: "AI analysis unavailable",
        data: { suspiciousReviews: [], confidence: 0 },
      };
    }

    const reviewsText = reviews
      .map(
        (r: any, i: number) =>
          `Review ${i + 1} [${r.rating}/5]: "${r.comment || "No comment"}" (by ${r.userName})`
      )
      .join("\n\n");

    const prompt = `Analyze these reviews for potential fake or spam reviews:

${reviewsText}

Look for these red flags:
- Generic, non-specific praise
- Suspiciously similar wording
- Extreme ratings without substance
- Promotional language
- Review timing patterns

Return JSON with:
- suspiciousReviews: array of review numbers that seem fake
- reasons: explanation for each flagged review
- overallAuthenticity: percentage (0-100)
- recommendations: suggestions for the seller`;

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
            {
              role: "system",
              content:
                "You are a review authenticity analyzer. Identify potentially fake or spam reviews.",
            },
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

      // Parse the response
      let analysis = { suspiciousReviews: [], overallAuthenticity: 100, reasons: {} };
      try {
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Use defaults
      }

      return {
        success: true,
        message: `Authenticity score: ${analysis.overallAuthenticity || 100}%`,
        data: analysis,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Fake review detection error:", error);
      return {
        success: false,
        message: error.message || "Analysis failed",
        data: { suspiciousReviews: [], confidence: 0 },
      };
    }
  },
});

// Helper: Fallback analysis without AI
function fallbackAnalysis(text: string, rating?: number): AgentResponse {
  const positiveWords = [
    "great",
    "excellent",
    "amazing",
    "love",
    "perfect",
    "best",
    "wonderful",
    "fantastic",
    "awesome",
    "good",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "hate",
    "worst",
    "horrible",
    "poor",
    "disappointing",
    "broken",
    "waste",
  ];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  let confidence = 50;

  if (rating) {
    if (rating >= 4) {
      sentiment = "positive";
      confidence = 70 + positiveCount * 5;
    } else if (rating <= 2) {
      sentiment = "negative";
      confidence = 70 + negativeCount * 5;
    }
  } else if (positiveCount > negativeCount) {
    sentiment = "positive";
    confidence = 50 + positiveCount * 10;
  } else if (negativeCount > positiveCount) {
    sentiment = "negative";
    confidence = 50 + negativeCount * 10;
  }

  const result: SentimentResult = {
    sentiment,
    confidence: Math.min(confidence, 95),
    keywords: [...positiveWords, ...negativeWords].filter((w) => lowerText.includes(w)),
    summary: `Review appears to be ${sentiment} based on keyword analysis.`,
  };

  return {
    success: true,
    message: `Review is ${sentiment} (basic analysis)`,
    data: result,
  };
}

// Helper: Fallback product analysis
function fallbackProductAnalysis(reviews: any[]): AgentResponse {
  const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 3), 0);
  const avgRating = totalRating / reviews.length;

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 4) sentimentCounts.positive++;
    else if (r.rating <= 2) sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  });

  return {
    success: true,
    message: `Analyzed ${reviews.length} reviews (basic analysis)`,
    data: {
      totalReviews: reviews.length,
      averageRating: avgRating.toFixed(1),
      sentimentBreakdown: {
        positive: Math.round((sentimentCounts.positive / reviews.length) * 100),
        neutral: Math.round((sentimentCounts.neutral / reviews.length) * 100),
        negative: Math.round((sentimentCounts.negative / reviews.length) * 100),
      },
      topKeywords: [],
      summary: `Product has ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)}/5.`,
    },
  };
}

// Helper: Parse sentiment result from AI
function parseSentimentResult(content: string): SentimentResult {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || "neutral",
        confidence: parsed.confidence || 50,
        keywords: parsed.keywords || [],
        summary: parsed.summary || "Unable to generate summary.",
      };
    }
  } catch (e) {
    console.error("Failed to parse sentiment:", e);
  }

  return {
    sentiment: "neutral",
    confidence: 50,
    keywords: [],
    summary: "Unable to analyze review.",
  };
}

// Helper: Parse product analysis from AI
function parseProductAnalysis(content: string, reviews: any[]): any {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse product analysis:", e);
  }

  // Return basic stats on parse failure
  return {
    totalReviews: reviews.length,
    averageRating:
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length,
    summary: "Analysis unavailable",
  };
}
