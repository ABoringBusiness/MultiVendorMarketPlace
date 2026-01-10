# Frontend Integration Guide

This guide explains how to integrate a React frontend with the Convex backend.

## Prerequisites

- Node.js 18+
- React 18+
- The Convex backend deployed (see `QUICKSTART_CONVEX.md`)

## Installation

```bash
# In your React project
npm install convex
```

## Setup

### 1. Create Convex Provider

Create `src/ConvexClientProvider.tsx`:

```tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

### 2. Wrap Your App

For Next.js (`app/layout.tsx`):

```tsx
import { ConvexClientProvider } from "@/ConvexClientProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

For Create React App (`src/index.tsx`):

```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL!);

root.render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
```

### 3. Environment Variables

```env
# Next.js
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Create React App
REACT_APP_CONVEX_URL=https://your-deployment.convex.cloud
```

## Usage Examples

### Fetching Products (Real-time)

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function ProductList({ categoryId }: { categoryId?: string }) {
  // This query automatically subscribes to updates!
  const products = useQuery(api.products.getProducts, {
    categoryId,
    includeDisabled: false,
  });

  if (products === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

### Creating a Product

```tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CreateProductForm() {
  const createProduct = useMutation(api.products.createProduct);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createProduct({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        categoryId: formData.get("categoryId") as any,
        imageUrl: formData.get("imageUrl") as string,
      });
      // Product created! The ProductList will auto-update.
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Product Title" required />
      <textarea name="description" placeholder="Description" />
      <input name="price" type="number" step="0.01" required />
      <input name="imageUrl" placeholder="Image URL" />
      <button type="submit">Create Product</button>
    </form>
  );
}
```

### Shopping Cart

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function ShoppingCart() {
  const cart = useQuery(api.cart.getCart, {});
  const addToCart = useMutation(api.cart.addToCart);
  const updateQuantity = useMutation(api.cart.updateCartItem);
  const removeItem = useMutation(api.cart.removeCartItem);
  const clearCart = useMutation(api.cart.clearCart);

  if (cart === undefined) return <div>Loading cart...</div>;
  if (!cart) return <div>Your cart is empty</div>;

  return (
    <div>
      <h2>Shopping Cart ({cart.items.length} items)</h2>

      {cart.items.map((item) => (
        <div key={item._id} className="cart-item">
          <span>{item.product.title}</span>
          <span>${item.product.price}</span>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              updateQuantity({
                cartItemId: item._id,
                quantity: parseInt(e.target.value),
              })
            }
          />

          <button onClick={() => removeItem({ cartItemId: item._id })}>
            Remove
          </button>
        </div>
      ))}

      <div className="cart-total">
        <strong>Total: ${cart.total.toFixed(2)}</strong>
      </div>

      <button onClick={() => clearCart({})}>Clear Cart</button>
    </div>
  );
}
```

### Real-time Notifications

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function NotificationBell() {
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 10,
  });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  return (
    <div className="notification-dropdown">
      <button className="bell-icon">
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      <div className="dropdown-content">
        <div className="header">
          <span>Notifications</span>
          <button onClick={() => markAllAsRead({})}>Mark all read</button>
        </div>

        {notifications?.map((notification) => (
          <div
            key={notification._id}
            className={`notification ${notification.isRead ? "" : "unread"}`}
            onClick={() => markAsRead({ notificationId: notification._id })}
          >
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
            <small>{new Date(notification._creationTime).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### User Authentication

```tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem("sessionToken")
  );

  const signIn = useMutation(api.auth.signIn);
  const signUp = useMutation(api.auth.signUp);
  const signOut = useMutation(api.auth.signOut);

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn({ email, password });
    if (result.success) {
      localStorage.setItem("sessionToken", result.sessionToken);
      setSessionToken(result.sessionToken);
    }
    return result;
  };

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
    role: "buyer" | "seller" = "buyer"
  ) => {
    const result = await signUp({ name, email, password, role });
    if (result.success) {
      localStorage.setItem("sessionToken", result.sessionToken);
      setSessionToken(result.sessionToken);
    }
    return result;
  };

  const handleSignOut = async () => {
    if (sessionToken) {
      await signOut({ sessionToken });
    }
    localStorage.removeItem("sessionToken");
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        sessionToken,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        isAuthenticated: !!sessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Order Management

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function OrderHistory() {
  const orders = useQuery(api.orders.getUserOrders, {});

  if (orders === undefined) return <div>Loading orders...</div>;

  return (
    <div>
      <h2>Your Orders</h2>
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} />
      ))}
    </div>
  );
}

function Checkout() {
  const cart = useQuery(api.cart.getCart, {});
  const createOrder = useMutation(api.orders.createOrder);
  const [shippingAddress, setShippingAddress] = useState("");

  const handleCheckout = async () => {
    try {
      const order = await createOrder({ shippingAddress });
      // Redirect to payment page
      window.location.href = `/payment/${order._id}`;
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <textarea
        value={shippingAddress}
        onChange={(e) => setShippingAddress(e.target.value)}
        placeholder="Enter shipping address"
      />
      <button onClick={handleCheckout}>Place Order</button>
    </div>
  );
}
```

### Seller Dashboard

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function SellerDashboard() {
  const myProducts = useQuery(api.products.getMyProducts, {});
  const sellerOrders = useQuery(api.orders.getSellerOrders, {});
  const stats = useQuery(api.orders.getSellerOrderStats, {});

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="Total Products" value={myProducts?.length ?? 0} />
        <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} />
        <StatCard title="Revenue" value={`$${stats?.totalRevenue?.toFixed(2) ?? 0}`} />
        <StatCard title="Pending Orders" value={stats?.pendingOrders ?? 0} />
      </div>

      <section>
        <h3>Recent Orders</h3>
        {sellerOrders?.slice(0, 5).map((order) => (
          <OrderRow key={order._id} order={order} />
        ))}
      </section>

      <section>
        <h3>My Products</h3>
        {myProducts?.map((product) => (
          <ProductRow key={product._id} product={product} />
        ))}
      </section>
    </div>
  );
}
```

## TypeScript Support

Convex generates TypeScript types automatically. Import the API types:

```tsx
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";

// Use generated types
type Product = Doc<"products">;
type ProductId = Id<"products">;

function ProductCard({ product }: { product: Product }) {
  // TypeScript knows all product fields!
  return (
    <div>
      <h3>{product.title}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

## Migrating from REST API

### Before (REST API)

```tsx
// Old approach with fetch
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/products")
    .then((res) => res.json())
    .then((data) => {
      setProducts(data);
      setLoading(false);
    });
}, []);
```

### After (Convex)

```tsx
// New approach with Convex - automatic updates!
const products = useQuery(api.products.getProducts, {});

if (products === undefined) return <Loading />;
```

## Benefits of Convex Integration

1. **Real-time by default** - No manual polling or WebSocket setup
2. **Type safety** - Full TypeScript support with generated types
3. **Automatic caching** - Convex handles cache invalidation
4. **Optimistic updates** - UI updates immediately, rolls back on error
5. **Simpler code** - No useEffect, useState for data fetching
6. **Offline support** - Queries work offline with cached data

## Next Steps

1. Set up your frontend project with Convex
2. Create the `convex` folder symlink or copy
3. Run `npx convex dev` to generate types
4. Start building with `useQuery` and `useMutation`

See also:
- [Convex React Documentation](https://docs.convex.dev/client/react)
- [Convex TypeScript Documentation](https://docs.convex.dev/typescript)
- [Convex Authentication](https://docs.convex.dev/auth)
