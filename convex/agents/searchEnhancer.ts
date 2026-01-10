import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { SYSTEM_PROMPTS, MODELS, TOKEN_LIMITS } from "./config";
import type { SearchEnhancement, AgentResponse } from "./types";

/**
 * Search Enhancement Agent
 *
 * Improves product search using AI:
 * - Query understanding and expansion
 * - Synonym generation
 * - Category detection
 * - Filter extraction from natural language
 * - Spelling correction
 */

// Get all categories for context
export const getAllCategories = internalQuery({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.map((c) => c.name);
  },
});

// Enhance a search query
export const enhanceQuery = action({
  args: {
    query: v.string(),
    includeCategories: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;

    // Get available categories
    let categories: string[] = [];
    if (args.includeCategories !== false) {
      try {
        categories = await ctx.runQuery(
          internal.agents.searchEnhancer.getAllCategories,
          {}
        );
      } catch (e) {
        categories = [];
      }
    }

    if (!openaiKey) {
      // Fallback to simple enhancement
      return fallbackEnhancement(args.query, categories);
    }

    const prompt = `Analyze and enhance this search query for an e-commerce marketplace:

Query: "${args.query}"

${categories.length > 0 ? `Available categories: ${categories.join(", ")}` : ""}

Provide enhancement in JSON format.`;

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
            { role: "system", content: SYSTEM_PROMPTS.SEARCH_ENHANCER },
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
      const enhancement = parseSearchEnhancement(content || "{}", args.query);

      return {
        success: true,
        message: "Query enhanced successfully",
        data: enhancement,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Search enhancement error:", error);
      return fallbackEnhancement(args.query, categories);
    }
  },
});

// Suggest search completions
export const getSuggestions = action({
  args: {
    partialQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const limit = args.limit || 5;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        success: true,
        message: "Suggestions generated",
        data: { suggestions: generateBasicSuggestions(args.partialQuery, limit) },
      };
    }

    const prompt = `Generate ${limit} search autocomplete suggestions for an e-commerce marketplace.

Partial query: "${args.partialQuery}"

Return a JSON array of ${limit} complete search suggestions that a user might be looking for.
Consider products, categories, and common shopping queries.`;

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
            {
              role: "system",
              content:
                "You are a search suggestion AI for an e-commerce marketplace. Generate relevant, helpful search suggestions.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      let suggestions: string[] = [];
      try {
        const jsonMatch = content?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        suggestions = generateBasicSuggestions(args.partialQuery, limit);
      }

      return {
        success: true,
        message: `Generated ${suggestions.length} suggestions`,
        data: { suggestions },
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Suggestion error:", error);
      return {
        success: true,
        message: "Suggestions generated",
        data: { suggestions: generateBasicSuggestions(args.partialQuery, limit) },
      };
    }
  },
});

// Extract intent and filters from natural language query
export const parseNaturalLanguageQuery = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        success: true,
        message: "Basic parsing applied",
        data: extractBasicFilters(args.query),
      };
    }

    const prompt = `Parse this natural language shopping query and extract structured search parameters:

Query: "${args.query}"

Extract:
1. Product type/category
2. Price range (if mentioned)
3. Brand preferences
4. Attributes (color, size, material, etc.)
5. Quality indicators (cheap, premium, best, etc.)
6. Use case or occasion
7. Sorting preference (price low to high, popular, newest, etc.)

Return JSON with these fields:
- searchTerms: array of product search terms
- category: detected category or null
- priceRange: { min, max } or null
- brand: brand name or null
- attributes: object with detected attributes
- quality: "budget" | "mid-range" | "premium" | null
- sortBy: "price_asc" | "price_desc" | "popular" | "newest" | null
- intent: brief description of what user is looking for`;

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
                "You are a query understanding AI. Parse natural language shopping queries into structured search parameters.",
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

      let parsed = extractBasicFilters(args.query);
      try {
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Use basic extraction
      }

      return {
        success: true,
        message: "Query parsed successfully",
        data: parsed,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Query parsing error:", error);
      return {
        success: true,
        message: "Basic parsing applied",
        data: extractBasicFilters(args.query),
      };
    }
  },
});

// Spell check and correct query
export const correctSpelling = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<AgentResponse> => {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        success: true,
        message: "Spelling check unavailable",
        data: {
          original: args.query,
          corrected: args.query,
          corrections: [],
        },
      };
    }

    const prompt = `Check this search query for spelling errors and suggest corrections:

Query: "${args.query}"

Return JSON with:
- corrected: the corrected query
- corrections: array of {original, corrected, position} for each fix
- confidence: 0-100 confidence in corrections`;

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
            {
              role: "system",
              content:
                "You are a spelling correction AI for e-commerce search. Fix typos while preserving product names and technical terms.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      let correction = {
        original: args.query,
        corrected: args.query,
        corrections: [],
        confidence: 100,
      };

      try {
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          correction = {
            original: args.query,
            corrected: parsed.corrected || args.query,
            corrections: parsed.corrections || [],
            confidence: parsed.confidence || 100,
          };
        }
      } catch (e) {
        // Use original
      }

      return {
        success: true,
        message:
          correction.corrected !== args.query
            ? `Did you mean: "${correction.corrected}"?`
            : "No spelling errors found",
        data: correction,
        tokens: result.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("Spelling correction error:", error);
      return {
        success: true,
        message: "Spelling check unavailable",
        data: {
          original: args.query,
          corrected: args.query,
          corrections: [],
        },
      };
    }
  },
});

// Helper: Fallback query enhancement
function fallbackEnhancement(
  query: string,
  categories: string[]
): AgentResponse {
  const words = query.toLowerCase().split(/\s+/);

  // Simple synonym mapping
  const synonymMap: Record<string, string[]> = {
    phone: ["smartphone", "mobile", "cellphone"],
    laptop: ["notebook", "computer"],
    shirt: ["top", "blouse", "tee"],
    shoes: ["footwear", "sneakers", "boots"],
    bag: ["handbag", "purse", "backpack"],
    watch: ["timepiece", "smartwatch"],
    tv: ["television", "monitor", "display"],
    headphones: ["earbuds", "earphones", "headset"],
  };

  const synonyms: string[] = [];
  words.forEach((word) => {
    if (synonymMap[word]) {
      synonyms.push(...synonymMap[word]);
    }
  });

  // Match categories
  const matchedCategories = categories.filter((cat) => {
    const catLower = cat.toLowerCase();
    return words.some((word) => catLower.includes(word) || word.includes(catLower));
  });

  // Extract price filters
  const filters = extractBasicFilters(query);

  const enhancement: SearchEnhancement = {
    originalQuery: query,
    enhancedQuery: query,
    synonyms: [...new Set(synonyms)].slice(0, 5),
    categories: matchedCategories.slice(0, 3),
    filters: filters.priceRange
      ? { minPrice: filters.priceRange.min, maxPrice: filters.priceRange.max }
      : undefined,
  };

  return {
    success: true,
    message: "Query enhanced (basic)",
    data: enhancement,
  };
}

// Helper: Parse search enhancement from AI response
function parseSearchEnhancement(content: string, originalQuery: string): SearchEnhancement {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        originalQuery,
        enhancedQuery: parsed.enhancedQuery || originalQuery,
        synonyms: parsed.synonyms || [],
        categories: parsed.categories || [],
        filters: parsed.filters,
      };
    }
  } catch (e) {
    console.error("Failed to parse enhancement:", e);
  }

  return {
    originalQuery,
    enhancedQuery: originalQuery,
    synonyms: [],
    categories: [],
  };
}

// Helper: Generate basic suggestions
function generateBasicSuggestions(partial: string, limit: number): string[] {
  const commonSuffixes = [
    "",
    " for sale",
    " best price",
    " deals",
    " near me",
    " reviews",
    " cheap",
    " premium",
  ];

  return commonSuffixes
    .slice(0, limit)
    .map((suffix) => partial + suffix)
    .filter((s) => s.length > partial.length);
}

// Helper: Extract basic filters from query
function extractBasicFilters(query: string): any {
  const result: any = {
    searchTerms: query.split(/\s+/).filter((w) => w.length > 2),
    category: null,
    priceRange: null,
    brand: null,
    attributes: {},
    quality: null,
    sortBy: null,
    intent: query,
  };

  const lower = query.toLowerCase();

  // Price extraction
  const priceMatch = lower.match(
    /(?:under|below|less than|max|up to)\s*\$?(\d+)/
  );
  const minPriceMatch = lower.match(
    /(?:over|above|more than|min|at least)\s*\$?(\d+)/
  );
  const rangeMatch = lower.match(/\$?(\d+)\s*(?:to|-)\s*\$?(\d+)/);

  if (rangeMatch) {
    result.priceRange = {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
    };
  } else if (priceMatch) {
    result.priceRange = { min: 0, max: parseInt(priceMatch[1]) };
  } else if (minPriceMatch) {
    result.priceRange = { min: parseInt(minPriceMatch[1]), max: null };
  }

  // Quality detection
  if (lower.includes("cheap") || lower.includes("budget") || lower.includes("affordable")) {
    result.quality = "budget";
  } else if (lower.includes("premium") || lower.includes("luxury") || lower.includes("high-end")) {
    result.quality = "premium";
  }

  // Sort preference
  if (lower.includes("cheapest") || lower.includes("lowest price")) {
    result.sortBy = "price_asc";
  } else if (lower.includes("most expensive") || lower.includes("highest price")) {
    result.sortBy = "price_desc";
  } else if (lower.includes("popular") || lower.includes("best selling")) {
    result.sortBy = "popular";
  } else if (lower.includes("newest") || lower.includes("latest")) {
    result.sortBy = "newest";
  }

  return result;
}
