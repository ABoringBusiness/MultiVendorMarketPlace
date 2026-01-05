# Convex Migration Testing Guide

## Prerequisites

Before testing the Convex backend, ensure you have:
1. Node.js 18+ installed
2. npm dependencies installed: `npm install`
3. A Convex account (free): https://dashboard.convex.dev

## Step 1: Initialize Convex Project

Run the Convex development server to initialize your project:

```bash
npx convex dev
```

This will:
- Prompt you to create or select a Convex project
- Generate `convex/_generated/` directory with type definitions
- Start watching for changes to your Convex functions
- Display the Convex dashboard URL

**Note:** The first time you run this, you'll need to:
1. Log in to your Convex account (or create one)
2. Select or create a project
3. Choose a deployment

## Step 2: Verify Schema

Once `npx convex dev` is running, it will automatically validate your schema. Check the terminal output for any schema errors.

You can also view your schema in the Convex dashboard:
1. Open the URL shown in the terminal (e.g., `https://dashboard.convex.dev/...`)
2. Click on "Data" to see your tables
3. Verify that all 9 tables are created:
   - users
   - categories
   - products
   - orders
   - orderItems
   - carts
   - cartItems
   - reviews
   - notifications

## Step 3: Test Authentication Functions

### Sign Up a Test User

In the Convex dashboard:
1. Go to "Functions"
2. Find `auth:signUp`
3. Click to test it
4. Enter test data:
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "role": "buyer"
   }
   ```
5. Click "Run"

You should see a success response with a userId.

### Sign In

1. Find `auth:signIn`
2. Test with:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

## Step 4: Test Product Functions

### Create a Category (requires admin)

First, create an admin user:
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

Then create a category using `categories:createCategory`:
```json
{
  "name": "Electronics",
  "description": "Electronic products"
}
```

### Create a Seller

```json
{
  "name": "Seller User",
  "email": "seller@example.com",
  "password": "seller123",
  "role": "seller"
}
```

### Create a Product

Use `products:createProduct`:
```json
{
  "categoryId": "<category_id_from_above>",
  "title": "Test Product",
  "description": "A test product",
  "price": 99.99,
  "imageUrl": "https://example.com/image.jpg"
}
```

Note: You'll need to authenticate as the seller user first. In a real application, this would be handled by the auth system.

## Step 5: Test Cart Functions

### Add to Cart

Use `cart:addToCart`:
```json
{
  "productId": "<product_id_from_above>",
  "quantity": 2
}
```

### Get Cart

Use `cart:getCart` with no arguments.

## Step 6: Test Order Functions

### Create Order

Use `orders:createOrder`:
```json
{
  "shippingAddress": "123 Main St, City, State 12345"
}
```

This will create an order from the current cart items.

### Get User Orders

Use `orders:getUserOrders` with no arguments.

## Step 7: Test Review Functions

### Create Review

Use `reviews:createReview`:
```json
{
  "productId": "<product_id>",
  "rating": 5,
  "comment": "Great product!"
}
```

### Get Product Reviews

Use `reviews:getProductReviews`:
```json
{
  "productId": "<product_id>"
}
```

## Step 8: Test Notification Functions

### Create Notification

Use `notifications:createNotification`:
```json
{
  "userId": "<user_id>",
  "title": "Test Notification",
  "message": "This is a test notification",
  "type": "system"
}
```

### Get Notifications

Use `notifications:getNotifications` with no arguments.

## Common Issues and Solutions

### Issue: "Cannot find module 'convex/server'"

**Solution:** Run `npm install` to ensure all dependencies are installed.

### Issue: Schema validation errors

**Solution:** 
1. Check the terminal output from `npx convex dev`
2. Fix any TypeScript errors in your schema
3. Make sure all imports are correct

### Issue: "Authentication required" errors

**Solution:** The Convex functions expect authentication context. In the dashboard, you can test functions without authentication for now. In production, you'll need to implement proper Convex Auth.

### Issue: "User not found" when testing seller/admin functions

**Solution:** Make sure you've created users with the appropriate roles first.

## Testing with Node.js Script

You can also test Convex functions using a Node.js script:

```javascript
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT);

async function test() {
  // Test sign up
  const result = await client.mutation("auth:signUp", {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    role: "buyer"
  });
  
  console.log("Sign up result:", result);
  
  // Test getting products
  const products = await client.query("products:getProducts", {});
  console.log("Products:", products);
}

test().catch(console.error);
```

## Validation Checklist

- [ ] Schema validates without errors
- [ ] All 9 tables are created in the database
- [ ] Can create users with different roles (buyer, seller, admin)
- [ ] Can sign in with valid credentials
- [ ] Can create categories (as admin)
- [ ] Can create products (as seller)
- [ ] Can add products to cart (as buyer)
- [ ] Can create orders from cart
- [ ] Can create and retrieve reviews
- [ ] Can create and retrieve notifications
- [ ] Role-based access control works (sellers can't create categories, buyers can't create products, etc.)

## Next Steps After Testing

Once all tests pass:
1. Implement data migration from PostgreSQL
2. Integrate Convex with your frontend application
3. Replace Socket.IO with Convex subscriptions
4. Update API endpoints to use Convex
5. Deploy to production

## Resources

- [Convex Dashboard](https://dashboard.convex.dev)
- [Convex Documentation](https://docs.convex.dev)
- [Testing Convex Functions](https://docs.convex.dev/production/testing)
