# Admin Panel Guide

This guide provides an overview of the admin panel functionality for both sellers and buyers in the MultiVendor Marketplace platform.

## Overview

The admin panel is divided into two main sections:

1. **Seller Admin Panel**: For sellers to manage their products, orders, inventory, and store settings
2. **Buyer Admin Panel**: For buyers to manage their orders, reviews, wishlist, and profile

## Seller Admin Panel

### Dashboard

The seller dashboard provides an overview of the seller's performance, including:

- Total products and active products
- Total orders and recent orders
- Total revenue and recent revenue
- Average rating and total reviews
- Top selling products
- Monthly sales chart

### Products Management

Sellers can manage their products with the following features:

- View all products with filtering and search
- Create new products
- Edit existing products
- Enable/disable products
- View product performance metrics

### Order Management

Sellers can manage orders for their products:

- View all orders with filtering and search
- Update order status (processing, shipped, delivered, cancelled)
- View order details
- Track order history

### Review Management

Sellers can manage reviews for their products:

- View all reviews with filtering
- Respond to reviews
- Track review metrics

### Inventory Management

Sellers can manage their inventory:

- View inventory levels
- Update stock quantities
- Set low stock alerts
- Update pricing
- Track inventory history

### Profile Management

Sellers can manage their store profile:

- Update store information
- Manage store settings
- Update contact information
- Customize store appearance

## Buyer Admin Panel

### Dashboard

The buyer dashboard provides an overview of the buyer's activity:

- Order statistics (total, recent, by status)
- Total spending and recent spending
- Review count
- Wishlist count
- Recent purchases
- Monthly spending chart

### Order Management

Buyers can manage their orders:

- View all orders with filtering and search
- View order details
- Track order status
- Cancel orders (if eligible)
- View order history

### Review Management

Buyers can manage their product reviews:

- View all reviews
- Create new reviews
- Edit existing reviews
- Delete reviews

### Wishlist Management

Buyers can manage their wishlist:

- View all wishlist items
- Add products to wishlist
- Remove products from wishlist
- Move wishlist items to cart

### Profile Management

Buyers can manage their profile:

- Update personal information
- Manage shipping addresses
- Update contact information
- Manage payment methods

## API Endpoints

### Seller Admin Endpoints

```
GET    /api/admin/seller/dashboard
GET    /api/admin/seller/products
GET    /api/admin/seller/orders
PUT    /api/admin/seller/orders/:id/status
GET    /api/admin/seller/reviews
POST   /api/admin/seller/reviews/:id/respond
GET    /api/admin/seller/inventory
PUT    /api/admin/seller/inventory/:id
GET    /api/admin/seller/profile
PUT    /api/admin/seller/profile
```

### Buyer Admin Endpoints

```
GET    /api/admin/buyer/dashboard
GET    /api/admin/buyer/orders
GET    /api/admin/buyer/orders/:id
PUT    /api/admin/buyer/orders/:id/cancel
GET    /api/admin/buyer/reviews
POST   /api/admin/buyer/reviews
DELETE /api/admin/buyer/reviews/:id
GET    /api/admin/buyer/wishlist
POST   /api/admin/buyer/wishlist
DELETE /api/admin/buyer/wishlist/:id
GET    /api/admin/buyer/profile
PUT    /api/admin/buyer/profile
```

## Authentication

All admin panel endpoints require authentication using JWT tokens. The user must have the appropriate role (seller or buyer) to access the respective endpoints.

## Real-time Updates

The admin panel uses Socket.IO for real-time updates:

- Dashboard statistics
- Order status updates
- Inventory changes
- New reviews
- New orders

## Implementation Details

The admin panel is implemented using:

- Express.js for the backend API
- JWT for authentication
- Sequelize ORM for database operations
- Socket.IO for real-time updates
- Swagger for API documentation

## Best Practices

When using the admin panel:

1. Always validate user input
2. Implement proper error handling
3. Use pagination for large datasets
4. Implement caching for frequently accessed data
5. Use transactions for critical operations
6. Implement proper logging
7. Secure sensitive data
8. Implement rate limiting
9. Use proper authorization checks
10. Implement audit logging for critical actions