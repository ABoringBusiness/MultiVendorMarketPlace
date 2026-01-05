# Convex Quick Start Guide

## What You Get

This Convex backend implementation provides:

✅ **Complete database schema** (9 tables)
- users, categories, products, orders, orderItems, carts, cartItems, reviews, notifications

✅ **Authentication system**
- Sign up, sign in, password management
- Role-based access (buyer, seller, admin)

✅ **Full CRUD operations**
- Products, Categories, Cart, Orders, Reviews, Notifications

✅ **Real-time capabilities**
- All queries automatically subscribe to updates
- No Socket.IO needed

✅ **Type-safe API**
- TypeScript-first
- Automatic schema validation

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Convex Dev Server
```bash
npx convex dev
```

First time:
- Opens browser to log in/sign up
- Creates a new project
- Generates type definitions

### 3. Test in Dashboard

The terminal will show a dashboard URL. Open it and:

1. **Create an admin user** (Functions → auth:signUp)
   ```json
   {
     "name": "Admin",
     "email": "admin@test.com",
     "password": "admin123",
     "role": "admin"
   }
   ```

2. **Create a category** (Functions → categories:createCategory)
   ```json
   {
     "name": "Electronics",
     "description": "Electronic products"
   }
   ```

3. **View your data** (Data tab)
   - See your users and categories tables

That's it! Your Convex backend is running.

## Key Files

```
convex/
├── schema.ts          # Database schema (start here)
├── auth.ts            # User authentication
├── products.ts        # Product CRUD + queries
├── orders.ts          # Order management
├── cart.ts            # Shopping cart
├── categories.ts      # Category management
├── reviews.ts         # Product reviews
├── notifications.ts   # User notifications
├── users.ts           # User/vendor queries
└── _helpers/          # Utilities
    ├── auth.ts        # Access control
    ├── validators.ts  # Input validation
    └── utils.ts       # Helper functions
```

## Common Tasks

### Create a Product (as seller)

```javascript
// First, create a seller user
await client.mutation("auth:signUp", {
  name: "Seller",
  email: "seller@test.com",
  password: "seller123",
  role: "seller"
});

// Then create a product
await client.mutation("products:createProduct", {
  categoryId: "<category_id>",
  title: "iPhone 15",
  description: "Latest iPhone",
  price: 999.99,
  imageUrl: "https://..."
});
```

### Query Products with Filters

```javascript
const products = await client.query("products:getProducts", {
  categoryId: "<category_id>",  // optional
  minPrice: 100,                // optional
  maxPrice: 1000,               // optional
  search: "iPhone",             // optional
  includeDisabled: false        // optional
});
```

### Add to Cart and Create Order

```javascript
// Add item to cart
await client.mutation("cart:addToCart", {
  productId: "<product_id>",
  quantity: 2
});

// View cart
const cart = await client.query("cart:getCart");

// Create order from cart
const order = await client.mutation("orders:createOrder", {
  shippingAddress: "123 Main St..."
});
```

## Using in React

```bash
npm install convex convex/react
```

```jsx
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";

function ProductList() {
  // Auto-subscribes to updates!
  const products = useQuery(api.products.getProducts, {});
  const addToCart = useMutation(api.cart.addToCart);
  
  return (
    <div>
      {products?.map(product => (
        <div key={product._id}>
          <h3>{product.title}</h3>
          <p>${product.price}</p>
          <button onClick={() => addToCart({ 
            productId: product._id, 
            quantity: 1 
          })}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Access Control

Built-in role-based access control:

| Function | Buyer | Seller | Admin |
|----------|-------|--------|-------|
| Create Product | ❌ | ✅ | ✅ |
| Update Own Product | ❌ | ✅ | ✅ |
| Update Any Product | ❌ | ❌ | ✅ |
| Create Category | ❌ | ❌ | ✅ |
| Add to Cart | ✅ | ✅ | ✅ |
| Create Order | ✅ | ✅ | ✅ |
| Update Order Status | ❌ | ✅* | ✅ |
| Create Review | ✅ | ✅ | ✅ |
| Delete Any Review | ❌ | ❌ | ✅ |

*Sellers can update orders containing their products

## Migration from PostgreSQL

When you're ready to migrate data:

1. Use the migration utilities in `convex/_migration/`
2. See examples in each file
3. Or follow the detailed guide in `CONVEX_MIGRATION.md`

## Environment Variables

Add to your `.env`:

```env
# Get these from Convex dashboard
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key
```

## Deploy to Production

```bash
npm run convex:deploy
```

## Next Steps

1. ✅ Test all functions in dashboard
2. ⏭️ Integrate with your frontend
3. ⏭️ Migrate data from PostgreSQL
4. ⏭️ Replace Express API calls with Convex
5. ⏭️ Remove Socket.IO (Convex handles real-time)

## Troubleshooting

**"Cannot find module 'convex/server'"**
→ Run `npm install`

**Schema errors**
→ Check terminal output from `npx convex dev`

**Authentication errors**
→ Use dashboard to test without auth, then implement Convex Auth

**TypeScript errors**
→ Ensure `convex/_generated` exists (created by `npx convex dev`)

## Resources

- 📚 [Full Migration Guide](./CONVEX_MIGRATION.md)
- 🧪 [Testing Guide](./TESTING_CONVEX.md)
- 📖 [Convex Docs](https://docs.convex.dev)
- 💬 [Convex Discord](https://convex.dev/community)

## Help

Questions? Check:
1. `CONVEX_MIGRATION.md` for detailed documentation
2. `TESTING_CONVEX.md` for testing instructions
3. Convex docs at https://docs.convex.dev
4. Your team's documentation
