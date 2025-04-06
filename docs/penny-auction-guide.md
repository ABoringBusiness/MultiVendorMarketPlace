# Penny Auction System Guide

## Overview
The penny auction system is a specialized auction format where users pay a small fee to place bids, and each bid increases the auction price by a small increment (typically one cent). The last bidder when the auction timer expires wins the item.

## Key Features

### Bid Packages
- Users purchase bid packages to participate in penny auctions
- Packages come in different sizes (e.g., 25, 50, 100, 250 bids)
- Volume discounts apply to larger packages
- Bids are stored in the user's account until used

### Auto-Bidding
- Users can set up auto-bidding to automatically place bids on their behalf
- Auto-bidding parameters include:
  - Maximum number of bids to use
  - Bid frequency
  - Maximum price threshold
- Auto-bidding stops when any of the parameters are exceeded

### Anti-Sniping Protection
- When a bid is placed in the final seconds of an auction, time is added to the clock
- This prevents "sniping" (last-second bidding) and gives all participants a fair chance

### Bid History and Transparency
- Complete bid history is available for all auctions
- Users can see who placed bids and when
- Transparency builds trust in the auction system

## Technical Implementation

### Database Schema
- `PennyAuction` model extends the base `Auction` model
- `PennyBid` model tracks individual bids
- `BidPackage` model defines available bid packages
- `UserBids` model tracks user's available bids

### Controllers
- `pennyAuctionController.js` - Manages penny auction CRUD operations
- `pennyBidController.js` - Handles bid placement and validation
- `bidPackageController.js` - Manages bid package purchases

### Routes
- `/api/penny-auctions` - Penny auction endpoints
- `/api/penny-bids` - Bid placement endpoints
- `/api/bid-packages` - Bid package purchase endpoints

## User Flow

1. User purchases a bid package
2. User browses available penny auctions
3. User places bids manually or sets up auto-bidding
4. If the user is the last bidder when the timer expires, they win the auction
5. User completes checkout to claim the won item

## Best Practices for Implementation

1. Ensure real-time updates for auction status and bids
2. Implement robust validation to prevent bid fraud
3. Use database transactions for bid operations to maintain data integrity
4. Implement proper error handling for edge cases
5. Provide clear user feedback for bid status and results