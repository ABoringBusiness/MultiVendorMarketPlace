# Extended Convex Schema

This document describes the extended schema for auctions, penny auctions, digital products, and services.

## Schema Overview

The extended schema adds 15 new tables to the base marketplace:

| Table | Purpose |
|-------|---------|
| **auctions** | Traditional ascending bid auctions |
| **bids** | Bids on traditional auctions |
| **pennyAuctions** | Timer-based penny auctions |
| **pennyBids** | Bids on penny auctions |
| **bidPackages** | Purchasable bid packs |
| **userBidBalances** | User's available bid count |
| **bidTransactions** | Bid purchase/usage history |
| **autoBidConfigs** | Automated bidding settings |
| **digitalProducts** | Downloadable/access products |
| **digitalPurchases** | Digital product purchases |
| **minuteServices** | Time-based services |
| **serviceSessions** | Service session records |
| **serviceUsage** | Platform usage tracking |
| **serviceBilling** | Periodic billing records |
| **serviceBillingItems** | Billing line items |

## Traditional Auctions

Standard ascending bid auctions where the highest bidder wins when time expires.

### Schema: `auctions`

```typescript
{
  title: string,
  description?: string,
  categoryId: Id<"categories">,
  condition?: "new" | "like_new" | "good" | "fair",
  startingBid: number,
  currentBid: number,
  startTime: number,      // Timestamp
  endTime: number,        // Timestamp
  imageUrl?: string,
  sellerId: Id<"users">,
  highestBidderId?: Id<"users">,
  status: "pending" | "active" | "completed" | "cancelled",
  isDisabled: boolean,
  reservePrice?: number,  // Minimum price to sell
  buyNowPrice?: number,   // Instant purchase price
}
```

### API Functions

```typescript
// Get active auctions
const auctions = useQuery(api.auctions.getActiveAuctions, {
  categoryId: optional,
  limit: 20
});

// Get auction details
const auction = useQuery(api.auctions.getAuctionById, {
  auctionId: "..."
});

// Place a bid
await convex.mutation(api.auctions.placeBid, {
  auctionId: "...",
  amount: 150.00
});

// Buy now (instant purchase)
await convex.mutation(api.auctions.buyNow, {
  auctionId: "..."
});
```

## Penny Auctions

Timer-based auctions where each bid extends the timer and increments the price.

### How Penny Auctions Work

1. User purchases a bid package (e.g., 100 bids for $50)
2. Each bid costs one bid from the user's balance
3. Each bid:
   - Increases price by a small increment (e.g., $0.01)
   - Extends the timer by a few seconds (e.g., 10 seconds)
   - Makes the bidder the current winner
4. When timer reaches zero, the last bidder wins
5. Winner pays the final price (often 90%+ off retail)

### Schema: `pennyAuctions`

```typescript
{
  title: string,
  description?: string,
  categoryId: Id<"categories">,
  imageUrl?: string,
  retailPrice: number,      // Original product value
  startingPrice: number,    // Usually $0
  currentPrice: number,     // Current price
  bidIncrement: number,     // Price increase per bid ($0.01)
  bidCost: number,          // Cost per bid ($0.50)
  startTime: number,
  endTime: number,          // Extends with each bid
  timerSeconds: number,     // Seconds added per bid
  status: "pending" | "active" | "completed" | "cancelled",
  highestBidderId?: Id<"users">,
  totalBids: number,
  isDisabled: boolean,
  sellerId: Id<"users">,
  featured: boolean,
  winnerId?: Id<"users">,
  finalPrice?: number,
}
```

### Bid Packages

```typescript
{
  name: string,             // "Starter Pack"
  description?: string,
  bidCount: number,         // 100
  price: number,            // $50
  isActive: boolean,
  discountPercentage: number,
  imageUrl?: string,
  featured: boolean,
}
```

### API Functions

```typescript
// Get active penny auctions
const auctions = useQuery(api.pennyAuctions.getActivePennyAuctions, {
  featured: true,
  limit: 10
});

// Place a penny bid (uses 1 bid from balance)
await convex.mutation(api.pennyAuctions.placePennyBid, {
  auctionId: "..."
});

// Get bid packages
const packages = useQuery(api.bidPackages.getBidPackages, {});

// Purchase bid package
const { transactionId } = await convex.mutation(
  api.bidPackages.initiatePurchase,
  { packageId: "..." }
);

// Get user's bid balance
const balance = useQuery(api.bidPackages.getUserBidBalance, {});

// Set up auto-bid
await convex.mutation(api.pennyAuctions.setupAutoBid, {
  auctionId: "...",
  maxBids: 50,
  stopWhenOutbid: true
});
```

## Digital Products

Downloadable or access-based digital products.

### Schema: `digitalProducts`

```typescript
{
  title: string,
  description?: string,
  price: number,
  salePrice?: number,
  categoryId: Id<"categories">,
  sellerId: Id<"users">,
  fileUrl?: string,
  fileKey?: string,
  fileSize?: number,
  fileType?: string,
  previewUrl?: string,
  deliveryType: "download" | "access_key" | "online_access",
  licenseType: "single_user" | "multi_user" | "subscription",
  subscriptionPeriod?: "monthly" | "yearly",
  downloadLimit?: number,
  isWatermarked: boolean,
  status: "draft" | "active" | "inactive",
  tags?: string[],
  averageRating: number,
  totalRatings: number,
  totalSales: number,
  allowAffiliates: boolean,
  affiliateCommissionRate: number,
}
```

## Minute-Based Services

Services billed by the minute.

### Schema: `minuteServices`

```typescript
{
  title: string,
  description?: string,
  ratePerMinute: number,    // USD per minute
  minimumMinutes: number,
  maximumMinutes?: number,
  maximumCharge?: number,   // Cap on total charge
  categoryId: Id<"categories">,
  providerId: Id<"users">,
  isActive: boolean,
  tags?: string[],
  averageRating: number,
  totalRatings: number,
}
```

### Service Sessions

```typescript
{
  serviceId: Id<"minuteServices">,
  userId: Id<"users">,      // Customer
  providerId: Id<"users">,  // Provider
  startTime: number,
  endTime?: number,
  durationMinutes?: number,
  amount: number,           // Total charge
  status: "active" | "paused" | "completed" | "cancelled",
  paymentStatus: "pending" | "paid" | "refunded" | "disputed",
  paymentId?: string,
  notes?: string,
}
```

## Platform Billing

Tracks platform service usage for billing sellers.

### Service Usage

```typescript
{
  userId: Id<"users">,
  serviceType: "auction" | "marketplace" | "premium_listing" | "featured_product" | "analytics" | "api_access",
  startTime: number,
  endTime?: number,
  durationMinutes?: number,
  ratePerMinute: number,
  totalCost: number,
  status: "active" | "completed" | "billed",
  description?: string,
  metadata?: any,
}
```

### Billing Records

```typescript
{
  userId: Id<"users">,
  billingPeriodStart: number,
  billingPeriodEnd: number,
  totalAmount: number,
  status: "pending" | "paid" | "overdue" | "cancelled",
  dueDate: number,
  paymentDate?: number,
  paymentMethod?: string,
  invoiceNumber: string,
  notes?: string,
}
```

## Migration

To migrate existing auction data to Convex:

1. **Run the base migration first** (users, products, etc.)

2. **Add auction migration to the script**:

```javascript
// scripts/migrate-auctions-to-convex.js
const { ConvexHttpClient } = require("convex/browser");

async function migrateAuctions(sequelize, convex, idMaps) {
  const [auctions] = await sequelize.query("SELECT * FROM auctions");

  for (const auction of auctions) {
    const convexId = await convex.mutation(
      "_migration/migrateAuctions:migrateAuction",
      {
        title: auction.title,
        categoryId: idMaps.categories.get(auction.category_id),
        sellerId: idMaps.users.get(auction.seller_id),
        startingBid: parseFloat(auction.starting_bid),
        currentBid: parseFloat(auction.current_bid),
        startTime: new Date(auction.start_time).getTime(),
        endTime: new Date(auction.end_time).getTime(),
        status: auction.status,
        // ... other fields
      }
    );
    idMaps.auctions.set(auction.id, convexId);
  }
}
```

3. **Run migrations in order**:
   - Users → Categories → Products
   - Auctions → Bids
   - Penny Auctions → Penny Bids
   - Bid Packages → User Balances → Transactions

## Indexes

All tables include optimized indexes for common queries:

| Table | Indexes |
|-------|---------|
| auctions | by_category, by_seller, by_status, by_end_time |
| pennyAuctions | by_category, by_status, by_featured, by_end_time |
| bids | by_auction, by_bidder, by_auction_and_amount |
| pennyBids | by_auction, by_bidder |
| bidPackages | by_active, by_featured |
| userBidBalances | by_user |
| digitalProducts | by_category, by_seller, by_status |
| minuteServices | by_category, by_provider, by_active |

## Real-time Features

All auction tables support Convex's real-time subscriptions:

```typescript
// Live auction updates
const auction = useQuery(api.auctions.getAuctionById, {
  auctionId: "..."
});
// Automatically updates when bids are placed

// Live penny auction with timer
const pennyAuction = useQuery(api.pennyAuctions.getPennyAuctionById, {
  auctionId: "..."
});
// Updates in real-time as bids come in
```

## Scheduled Functions

For auction management, set up scheduled functions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for ended auctions every minute
crons.interval(
  "check-ended-auctions",
  { minutes: 1 },
  internal.auctions.checkEndedAuctions
);

// Check for ended penny auctions every 10 seconds
crons.interval(
  "check-ended-penny-auctions",
  { seconds: 10 },
  internal.pennyAuctions.checkEndedPennyAuctions
);

export default crons;
```

## Security Considerations

1. **Bid Validation**: All bids are validated server-side
2. **Balance Checks**: Penny bids verify user has sufficient balance
3. **Ownership Checks**: Sellers can't bid on their own auctions
4. **Rate Limiting**: Consider adding rate limits for bid placement
5. **Audit Trail**: All bid transactions are logged
