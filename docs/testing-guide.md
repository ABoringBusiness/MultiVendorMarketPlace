# Testing Guide for MultiVendorMarketPlace PRs

This guide provides instructions for testing the functionality of the feature branches before merging them into the main codebase.

## Setting Up the Testing Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/ABoringBusiness/MultiVendorMarketPlace.git
   cd MultiVendorMarketPlace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. Run automated tests:
   ```bash
   npm test
   ```

## Manual Testing Checklist

### 1. Penny Auction Feature

#### Bid Package Purchase
- [ ] Navigate to the bid packages page
- [ ] Verify different bid package options are displayed
- [ ] Purchase a bid package
- [ ] Verify the user's bid count is updated correctly
- [ ] Verify payment processing works correctly

#### Creating a Penny Auction
- [ ] Navigate to the create auction page
- [ ] Select "Penny Auction" as the auction type
- [ ] Fill in all required fields
- [ ] Submit the form
- [ ] Verify the penny auction is created with correct settings

#### Bidding on a Penny Auction
- [ ] Navigate to an active penny auction
- [ ] Place a bid
- [ ] Verify the auction price increases by the increment amount
- [ ] Verify the auction timer is extended
- [ ] Verify the user's bid count decreases
- [ ] Verify the bid history is updated

#### Auto-Bidding
- [ ] Set up auto-bidding on a penny auction
- [ ] Verify auto-bids are placed according to settings
- [ ] Verify auto-bidding stops when conditions are met
- [ ] Verify the user can cancel auto-bidding

### 2. Real-Time Notifications

#### Notification Generation
- [ ] Perform actions that should trigger notifications (placing bids, winning auctions, etc.)
- [ ] Verify notifications are generated correctly

#### Notification Delivery
- [ ] Log in with multiple accounts in different browsers
- [ ] Verify notifications are delivered in real-time
- [ ] Verify notification content is correct

#### Notification Management
- [ ] Mark notifications as read
- [ ] Verify read status is updated
- [ ] Delete notifications
- [ ] Verify notifications are removed

### 3. Search, Cart, Order, and Payment

#### Search Functionality
- [ ] Search for products by keyword
- [ ] Filter search results by category
- [ ] Filter search results by price range
- [ ] Sort search results
- [ ] Verify search results are accurate

#### Cart Management
- [ ] Add items to cart
- [ ] Update item quantities
- [ ] Remove items from cart
- [ ] Verify cart totals are calculated correctly

#### Order Processing
- [ ] Create an order from cart
- [ ] Verify order details are correct
- [ ] Update order status (as seller/admin)
- [ ] Verify order history is displayed correctly

#### Payment Processing
- [ ] Initiate checkout process
- [ ] Complete payment with test card
- [ ] Verify payment is processed correctly
- [ ] Verify order status is updated after payment

### 4. Supabase Migration

#### Data Integrity
- [ ] Verify all data has been migrated correctly
- [ ] Test CRUD operations on all entities
- [ ] Verify relationships between entities are maintained

#### Performance
- [ ] Compare query performance before and after migration
- [ ] Test with large datasets
- [ ] Verify connection pooling works correctly

#### Security
- [ ] Verify row-level security policies are working
- [ ] Test user authentication with Supabase
- [ ] Verify API endpoints respect user permissions

## Regression Testing

After testing the new features, perform regression testing to ensure existing functionality still works:

- [ ] User authentication (login, registration, password reset)
- [ ] User profile management
- [ ] Product management (for sellers)
- [ ] Category management (for admins)
- [ ] Review and rating system

## Performance Testing

- [ ] Test the application with multiple concurrent users
- [ ] Monitor server resource usage during peak load
- [ ] Identify and address any performance bottlenecks

## Security Testing

- [ ] Test for common vulnerabilities (XSS, CSRF, SQL injection)
- [ ] Verify proper input validation on all forms
- [ ] Check for secure handling of sensitive data

## Reporting Issues

If you encounter any issues during testing, please report them with the following information:

1. Feature being tested
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or error messages
6. Environment details (browser, OS, etc.)

Submit issues through GitHub or contact the development team directly.