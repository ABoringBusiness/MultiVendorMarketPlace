# Convex AI Agents

This document describes the AI agents available in the Multi-Vendor Marketplace.

## Overview

The marketplace includes 5 AI-powered agents built on Convex actions:

| Agent | Purpose | API Key Required |
|-------|---------|------------------|
| Product Recommender | Personalized recommendations | Yes (has fallback) |
| Customer Support | AI chatbot | Yes (has fallback) |
| Review Analyzer | Sentiment & fake detection | Yes (has fallback) |
| Search Enhancer | Query understanding | Yes (has fallback) |
| Fraud Detector | Risk analysis | Yes (has fallback) |

## Setup

### 1. Configure OpenAI API Key

Add to your Convex environment (dashboard or CLI):

```bash
npx convex env set OPENAI_API_KEY sk-your-api-key
```

Or in Convex dashboard: Settings → Environment Variables → Add `OPENAI_API_KEY`

### 2. Deploy Agents

```bash
npx convex deploy
```

## Agent Reference

### 1. Product Recommender

Provides personalized product recommendations.

```typescript
import { api } from "../convex/_generated/api";

// Get recommendations for a user
const result = await convex.action(api.agents.productRecommender.getRecommendations, {
  userId: "user_id_here",
  categoryId: "optional_category_id", // Filter by category
  limit: 5,
  context: "Looking for birthday gift", // Optional context
});

// Response
{
  success: true,
  message: "Generated 5 recommendations",
  data: [
    { productId: "...", score: 95, reason: "Similar to recent purchases" },
    { productId: "...", score: 88, reason: "Popular in this category" },
  ],
  tokens: 150
}

// Get similar products
const similar = await convex.action(api.agents.productRecommender.getSimilarProducts, {
  productId: "product_id_here",
  limit: 5,
});
```

### 2. Customer Support Chatbot

AI-powered customer support with context awareness.

```typescript
// Chat with support
const response = await convex.action(api.agents.customerSupport.chat, {
  userId: "user_id",
  message: "Where is my order?",
  conversationHistory: [
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello! How can I help?" }
  ]
});

// Response
{
  success: true,
  message: "I can see your most recent order #abc123 is currently 'shipped'...",
  data: {
    needsEscalation: false,
    conversationLength: 4
  }
}

// Quick answers (no AI needed)
const answer = await convex.action(api.agents.customerSupport.getQuickAnswer, {
  questionType: "shipping" // "returns", "payment", "account", "tracking"
});

// Check order status
const status = await convex.action(api.agents.customerSupport.checkOrderStatus, {
  userId: "user_id",
  orderId: "optional_order_id" // Gets most recent if not provided
});
```

### 3. Review Analyzer

Analyzes product reviews for sentiment and authenticity.

```typescript
// Analyze a single review
const analysis = await convex.action(api.agents.reviewAnalyzer.analyzeReview, {
  reviewText: "Great product, fast shipping!",
  rating: 5
});

// Response
{
  success: true,
  message: "Review is positive (92% confidence)",
  data: {
    sentiment: "positive",
    confidence: 92,
    keywords: ["great", "fast"],
    summary: "Positive review praising product quality and delivery speed"
  }
}

// Analyze all reviews for a product
const productAnalysis = await convex.action(
  api.agents.reviewAnalyzer.analyzeProductReviews,
  { productId: "product_id" }
);

// Response
{
  success: true,
  data: {
    totalReviews: 25,
    averageRating: 4.2,
    sentimentBreakdown: { positive: 72, neutral: 20, negative: 8 },
    topKeywords: ["quality", "price", "shipping"],
    summary: "Overall positive reception..."
  }
}

// Detect fake reviews
const fakeCheck = await convex.action(api.agents.reviewAnalyzer.detectFakeReviews, {
  productId: "product_id"
});
```

### 4. Search Enhancer

Improves search queries with AI understanding.

```typescript
// Enhance a search query
const enhanced = await convex.action(api.agents.searchEnhancer.enhanceQuery, {
  query: "red shoes under 100 dollars",
  includeCategories: true
});

// Response
{
  success: true,
  data: {
    originalQuery: "red shoes under 100 dollars",
    enhancedQuery: "red shoes",
    synonyms: ["crimson footwear", "scarlet sneakers"],
    categories: ["Shoes", "Footwear"],
    filters: {
      maxPrice: 100,
      color: "red"
    }
  }
}

// Get search suggestions
const suggestions = await convex.action(api.agents.searchEnhancer.getSuggestions, {
  partialQuery: "blue dress",
  limit: 5
});

// Parse natural language query
const parsed = await convex.action(
  api.agents.searchEnhancer.parseNaturalLanguageQuery,
  { query: "cheap laptop for gaming under 800" }
);

// Response
{
  data: {
    searchTerms: ["laptop", "gaming"],
    category: "Electronics",
    priceRange: { min: 0, max: 800 },
    quality: "budget",
    sortBy: "price_asc",
    intent: "Looking for an affordable gaming laptop"
  }
}

// Spell check
const corrected = await convex.action(api.agents.searchEnhancer.correctSpelling, {
  query: "lafptop"
});
// Returns: { corrected: "laptop", ... }
```

### 5. Fraud Detector

Analyzes transactions and accounts for fraud risk.

```typescript
// Analyze a single order
const risk = await convex.action(api.agents.fraudDetector.analyzeOrder, {
  orderId: "order_id",
  shippingAddress: "123 Main St",
  billingAddress: "456 Other St",
  paymentMethod: "credit_card"
});

// Response
{
  success: true,
  message: "Risk score: 45/100 - review",
  data: {
    riskScore: 45,
    flags: [
      "Shipping and billing addresses differ",
      "Account less than 7 days old"
    ],
    recommendation: "review", // "approve", "review", "reject"
    details: "Order #abc for $500 - 2 risk factors identified"
  }
}

// Batch analyze orders
const batch = await convex.action(api.agents.fraudDetector.analyzeOrdersBatch, {
  orderIds: ["order1", "order2", "order3"]
});

// Detect account anomalies
const anomalies = await convex.action(
  api.agents.fraudDetector.detectAccountAnomalies,
  { userId: "user_id" }
);
```

## React Integration

Use the agents in your React frontend:

```tsx
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

function ProductRecommendations({ userId }) {
  const getRecommendations = useAction(api.agents.productRecommender.getRecommendations);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    getRecommendations({ userId, limit: 5 })
      .then(result => {
        if (result.success) {
          setRecommendations(result.data);
        }
      });
  }, [userId]);

  return (
    <div>
      {recommendations.map(rec => (
        <ProductCard key={rec.productId} productId={rec.productId} />
      ))}
    </div>
  );
}

function SupportChat({ userId }) {
  const chat = useAction(api.agents.customerSupport.chat);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    const result = await chat({
      userId,
      message: text,
      conversationHistory: messages
    });

    setMessages([
      ...messages,
      { role: "user", content: text },
      { role: "assistant", content: result.message }
    ]);
  };

  return <ChatInterface messages={messages} onSend={sendMessage} />;
}
```

## Fallback Behavior

When the OpenAI API key is not configured or API calls fail, agents provide basic functionality:

| Agent | Fallback Behavior |
|-------|-------------------|
| Product Recommender | Returns empty recommendations |
| Customer Support | Returns generic help message |
| Review Analyzer | Uses keyword-based sentiment analysis |
| Search Enhancer | Basic synonym matching and filter extraction |
| Fraud Detector | Rule-based risk scoring only |

## Cost Optimization

To minimize API costs:

1. **Use caching** - Recommendations and search enhancements are cached
2. **Batch requests** - Use batch endpoints when analyzing multiple items
3. **Use smaller models** - `gpt-4o-mini` for simpler tasks
4. **Rate limiting** - Built-in rate limits prevent excessive usage

## Error Handling

All agents return a consistent response format:

```typescript
type AgentResponse = {
  success: boolean;
  message: string;
  data?: any;
  tokens?: number;  // OpenAI tokens used
  confidence?: number;
};
```

Always check `success` before using `data`:

```typescript
const result = await convex.action(api.agents.reviewAnalyzer.analyzeReview, {...});

if (result.success) {
  // Use result.data
} else {
  // Handle error with result.message
}
```

## Security Considerations

1. **API Key** - Store in Convex environment variables, never client-side
2. **Rate Limiting** - Agents have built-in rate limits
3. **Input Validation** - All inputs are validated by Convex
4. **User Context** - Always pass authenticated userId for user-specific actions
5. **Sensitive Data** - Review content is processed but not stored by OpenAI

## Future Enhancements

Planned improvements:
- [ ] Anthropic Claude integration
- [ ] Vector embeddings for semantic search
- [ ] Multi-language support
- [ ] Agent orchestration for complex workflows
- [ ] Custom model fine-tuning
- [ ] A/B testing for recommendation algorithms
