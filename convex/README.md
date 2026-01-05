# Convex Backend for Multi-Vendor Marketplace

This directory contains the Convex backend implementation for the multi-vendor marketplace.

## Structure

- `schema.ts` - Database schema definitions
- `auth.ts` - Authentication functions (sign up, sign in, sign out)
- `products.ts` - Product mutations and queries
- `orders.ts` - Order mutations and queries
- `cart.ts` - Shopping cart mutations and queries
- `categories.ts` - Category mutations and queries
- `reviews.ts` - Review mutations and queries
- `notifications.ts` - Notification mutations and queries
- `users.ts` - User/vendor queries
- `_helpers/` - Helper functions for auth, validation, etc.
- `_migration/` - Data migration utilities

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Convex development server:
   ```bash
   npm run convex:dev
   ```

3. Deploy to production:
   ```bash
   npm run convex:deploy
   ```

## Authentication

Convex Auth is used for authentication with email/password. Passwords are hashed using bcryptjs.

## Real-time Features

Convex provides built-in real-time subscriptions for all queries, replacing the need for Socket.IO.
