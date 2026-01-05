# Convex Migration Guide - Phase 1

## Overview

This document describes the migration from PostgreSQL/Sequelize/JWT to Convex backend for the multi-vendor marketplace. This is Phase 1 of the migration, focusing on core infrastructure.

## What is Convex?

Convex is a backend-as-a-service platform that provides:
- Real-time database with automatic subscriptions
- Built-in authentication
- TypeScript-first API
- Automatic schema validation
- Built-in real-time capabilities (replacing Socket.IO)

## Migration Strategy

The migration is being done in phases to minimize disruption:

### Phase 1: Core Infrastructure (Current)
- ✅ Set up Convex project structure
- ✅ Define database schema in Convex
- ✅ Implement authentication (sign up, sign in, profile management)
- ✅ Implement core CRUD operations (products, orders, cart, categories, reviews, notifications)
- ✅ Implement role-based access control
- 🔄 Keep existing PostgreSQL/Express API running in parallel

### Phase 2: Data Migration (Future)
- Migrate existing data from PostgreSQL to Convex
- Implement data sync during transition period
- Update frontend to use Convex clients

### Phase 3: Real-time Features (Future)
- Replace Socket.IO with Convex subscriptions
- Implement real-time notifications
- Implement real-time cart updates
- Implement real-time order tracking

### Phase 4: Cleanup (Future)
- Remove PostgreSQL dependencies
- Remove JWT authentication code
- Remove Socket.IO dependencies
- Update documentation

## Getting Started with Convex

### 1. Install Dependencies

```bash
npm install
```

The Convex package has been added to `package.json`.

### 2. Initialize Convex Project

```bash
npx convex dev
```

This will:
- Create a Convex project (if you don't have one)
- Generate configuration files
- Start the Convex development server
- Watch for changes to `convex/` directory

### 3. Configure Environment Variables

Update your `.env` file with Convex credentials:

```env
CONVEX_DEPLOYMENT=your-deployment-url
CONVEX_DEPLOY_KEY=your-deploy-key
```

Get these from the Convex dashboard: https://dashboard.convex.dev

### 4. Deploy to Production

```bash
npm run convex:deploy
```

## Schema Overview

The Convex schema mirrors the existing PostgreSQL models:

### Core Tables

1. **users** - User accounts with roles (buyer, seller, admin)
2. **categories** - Product categories
3. **products** - Product listings by sellers
4. **orders** - Customer orders
5. **orderItems** - Items in each order
6. **carts** - Shopping carts
7. **cartItems** - Items in shopping carts
8. **reviews** - Product reviews and ratings
9. **notifications** - User notifications

See `convex/schema.ts` for complete schema definitions.

## API Functions

### Authentication (`convex/auth.ts`)

- `signUp` - Register new user
- `signIn` - User login
- `signOut` - User logout
- `getCurrentUserQuery` - Get current user
- `getUserProfile` - Get user profile by ID
- `updateProfile` - Update user profile
- `updatePassword` - Change password

### Products (`convex/products.ts`)

**Mutations:**
- `createProduct` - Create new product (seller only)
- `updateProduct` - Update product (seller/admin)
- `deleteProduct` - Delete product (seller/admin)
- `toggleProductStatus` - Enable/disable product

**Queries:**
- `getProducts` - List products with filters
- `getProductById` - Get single product
- `getSellerProducts` - Get products by seller
- `getMyProducts` - Get current seller's products

### Categories (`convex/categories.ts`)

**Mutations:**
- `createCategory` - Create category (admin only)
- `updateCategory` - Update category (admin only)
- `deleteCategory` - Delete category (admin only)

**Queries:**
- `getCategories` - List all categories
- `getCategoryById` - Get category by ID
- `getCategoryByName` - Get category by name
- `getCategoriesWithCount` - Get categories with product count

### Cart (`convex/cart.ts`)

**Mutations:**
- `addToCart` - Add item to cart
- `updateCartItem` - Update item quantity
- `removeCartItem` - Remove item from cart
- `clearCart` - Clear all items

**Queries:**
- `getCart` - Get user's cart with items

### Orders (`convex/orders.ts`)

**Mutations:**
- `createOrder` - Create order from cart
- `updateOrderStatus` - Update order status (seller/admin)
- `updatePaymentStatus` - Update payment status (admin)
- `cancelOrder` - Cancel order

**Queries:**
- `getUserOrders` - Get user's orders
- `getOrderById` - Get order details
- `getSellerOrders` - Get seller's orders
- `getAllOrders` - Get all orders (admin)
- `getSellerOrderStats` - Get seller statistics

### Reviews (`convex/reviews.ts`)

**Mutations:**
- `createReview` - Create product review
- `updateReview` - Update review
- `deleteReview` - Delete review

**Queries:**
- `getProductReviews` - Get reviews for product
- `getUserReviews` - Get user's reviews
- `getProductRatingStats` - Get rating statistics
- `hasUserReviewedProduct` - Check if user reviewed product

### Notifications (`convex/notifications.ts`)

**Mutations:**
- `createNotification` - Create notification
- `markAsRead` - Mark notification as read
- `markAllAsRead` - Mark all as read
- `deleteNotification` - Delete notification
- `deleteAllRead` - Delete all read notifications
- `cleanupExpired` - Remove expired notifications (admin)
- `broadcastNotification` - Send to multiple users (admin)

**Queries:**
- `getNotifications` - Get user's notifications
- `getUnreadCount` - Get unread count
- `getNotificationById` - Get notification by ID

### Users/Vendors (`convex/users.ts`)

**Queries:**
- `getVendors` - List all vendors
- `getVendorProfile` - Get vendor profile with stats
- `getAllUsers` - Get all users (admin)
- `getUserById` - Get user by ID
- `searchUsers` - Search users (admin)
- `getPlatformStats` - Get platform statistics (admin)

## Access Control

Role-based access control is implemented using helper functions in `convex/_helpers/auth.ts`:

- `requireAuth()` - Ensure user is authenticated
- `requireRole(role)` - Ensure user has specific role
- `requireSeller()` - Ensure user is seller or admin
- `requireAdmin()` - Ensure user is admin
- `canModifyProduct(userId, productId)` - Check product ownership
- `canModifyOrder(userId, orderId)` - Check order access

## Using Convex in Your Application

### From Node.js/Express (Server-side)

```javascript
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT);

// Query
const products = await client.query("products:getProducts", {
  categoryId: "...",
});

// Mutation
const result = await client.mutation("products:createProduct", {
  title: "New Product",
  price: 99.99,
  // ...
});
```

### From React/Frontend (Client-side)

```javascript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function ProductList() {
  const products = useQuery(api.products.getProducts, {});
  const createProduct = useMutation(api.products.createProduct);
  
  // Use products...
}
```

## Real-time Subscriptions

Convex queries automatically subscribe to updates. When data changes, components re-render automatically:

```javascript
// This automatically updates when products change
const products = useQuery(api.products.getProducts, {});
```

This replaces Socket.IO for most real-time features.

## Data Migration

Migration utilities are located in `convex/_migration/`:

- `migrateUsers.ts` - User data migration
- `migrateProducts.ts` - Product data migration
- `migrateOrders.ts` - Order data migration

These will be implemented in Phase 2.

## Testing

Test Convex functions using the Convex CLI:

```bash
# Run a query
npx convex run products:getProducts --arg '{"categoryId": "..."}'

# Run a mutation
npx convex run products:createProduct --arg '{"title": "Test Product", "price": 99.99}'
```

## Deployment

### Development
```bash
npm run convex:dev
```

### Production
```bash
npm run convex:deploy
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` to ensure all dependencies are installed
   - Make sure you're in the project root directory

2. **Convex schema errors**
   - Run `npx convex dev` to validate schema
   - Check `convex/schema.ts` for type errors

3. **Authentication issues**
   - Ensure Convex deployment URL is correct in `.env`
   - Check that user has required role for operations

## Migration Checklist

Phase 1 (Core Infrastructure):
- [x] Set up Convex project structure
- [x] Define database schema
- [x] Implement authentication functions
- [x] Implement product CRUD
- [x] Implement cart operations
- [x] Implement order management
- [x] Implement reviews
- [x] Implement notifications
- [x] Implement role-based access control
- [ ] Initialize Convex project with `npx convex dev`
- [ ] Create migration utilities

## Next Steps

1. Run `npx convex dev` to initialize the Convex project
2. Test all Convex functions using the Convex dashboard
3. Implement data migration scripts
4. Update frontend to use Convex queries
5. Replace Socket.IO with Convex subscriptions

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Auth](https://docs.convex.dev/auth)
- [Convex Schema](https://docs.convex.dev/database/schemas)
- [Convex React](https://docs.convex.dev/client/react)

## Support

For questions or issues, please:
1. Check the Convex documentation
2. Review this migration guide
3. Contact the development team
