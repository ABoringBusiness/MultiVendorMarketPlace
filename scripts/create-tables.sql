-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  "isVerified" BOOLEAN DEFAULT FALSE,
  "verificationToken" TEXT,
  "resetPasswordToken" TEXT,
  "resetPasswordExpires" TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS "Categories" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS "Products" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "stock" INTEGER,
  "imageUrl" TEXT,
  "isDisabled" BOOLEAN DEFAULT FALSE,
  "sellerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Categories"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS "Notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK (type IN ('order', 'auction', 'bid', 'payment', 'system')),
  "isRead" BOOLEAN DEFAULT FALSE,
  "actionLink" TEXT,
  "metadata" JSONB,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Carts table
CREATE TABLE IF NOT EXISTS "Carts" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CartItems table
CREATE TABLE IF NOT EXISTS "CartItems" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cartId" UUID NOT NULL REFERENCES "Carts"("id") ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS "Orders" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "total" DECIMAL(10, 2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "shippingAddress" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
  "stripeSessionId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OrderItems table
CREATE TABLE IF NOT EXISTS "OrderItems" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES "Orders"("id") ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10, 2) NOT NULL,
  "totalPrice" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Auctions table
CREATE TABLE IF NOT EXISTS "Auctions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "categoryId" UUID NOT NULL REFERENCES "Categories"("id") ON DELETE CASCADE,
  "condition" TEXT NOT NULL,
  "startingBid" DECIMAL(10, 2) NOT NULL,
  "currentBid" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "imageUrl" TEXT,
  "sellerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "highestBidderId" UUID REFERENCES "Users"("id"),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "isDisabled" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Bids table
CREATE TABLE IF NOT EXISTS "Bids" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "auctionId" UUID NOT NULL REFERENCES "Auctions"("id") ON DELETE CASCADE,
  "bidderId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PennyAuctions table
CREATE TABLE IF NOT EXISTS "PennyAuctions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "categoryId" UUID NOT NULL REFERENCES "Categories"("id") ON DELETE CASCADE,
  "retailPrice" DECIMAL(10, 2) NOT NULL,
  "startingPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "currentPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "bidIncrement" DECIMAL(10, 2) NOT NULL DEFAULT 0.01,
  "bidCost" DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "timerSeconds" INTEGER NOT NULL DEFAULT 10,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "highestBidderId" UUID REFERENCES "Users"("id"),
  "totalBids" INTEGER NOT NULL DEFAULT 0,
  "isDisabled" BOOLEAN DEFAULT FALSE,
  "sellerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "featured" BOOLEAN DEFAULT FALSE,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PennyBids table
CREATE TABLE IF NOT EXISTS "PennyBids" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "pennyAuctionId" UUID NOT NULL REFERENCES "PennyAuctions"("id") ON DELETE CASCADE,
  "bidderId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "bidAmount" DECIMAL(10, 2) NOT NULL,
  "bidCost" DECIMAL(10, 2) NOT NULL,
  "newPrice" DECIMAL(10, 2) NOT NULL,
  "timerExtended" BOOLEAN DEFAULT TRUE,
  "isAutoBid" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create BidPackages table
CREATE TABLE IF NOT EXISTS "BidPackages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "bidCount" INTEGER NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "discountPercentage" DECIMAL(5, 2),
  "imageUrl" TEXT,
  "featured" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UserBidBalances table
CREATE TABLE IF NOT EXISTS "UserBidBalances" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "bidBalance" INTEGER NOT NULL DEFAULT 0,
  "totalBidsPurchased" INTEGER NOT NULL DEFAULT 0,
  "totalBidsUsed" INTEGER NOT NULL DEFAULT 0,
  "lastPurchaseDate" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId")
);

-- Create BidTransactions table
CREATE TABLE IF NOT EXISTS "BidTransactions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "bidPackageId" UUID REFERENCES "BidPackages"("id") ON DELETE SET NULL,
  "transactionType" TEXT NOT NULL,
  "bidCount" INTEGER NOT NULL,
  "amount" DECIMAL(10, 2),
  "paymentMethod" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "stripeSessionId" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AutoBidConfigs table
CREATE TABLE IF NOT EXISTS "AutoBidConfigs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "pennyAuctionId" UUID NOT NULL REFERENCES "PennyAuctions"("id") ON DELETE CASCADE,
  "maxBids" INTEGER NOT NULL,
  "bidsUsed" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ServiceUsages table
CREATE TABLE IF NOT EXISTS "ServiceUsages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "serviceType" TEXT NOT NULL,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "endTime" TIMESTAMP WITH TIME ZONE,
  "durationMinutes" INTEGER,
  "ratePerMinute" DECIMAL(10, 2) NOT NULL,
  "totalCost" DECIMAL(10, 2),
  "status" TEXT NOT NULL DEFAULT 'active',
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ServiceBillings table
CREATE TABLE IF NOT EXISTS "ServiceBillings" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "billingPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "billingPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "paymentDate" TIMESTAMP WITH TIME ZONE,
  "paymentMethod" TEXT,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ServiceBillingItems table
CREATE TABLE IF NOT EXISTS "ServiceBillingItems" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceBillingId" UUID NOT NULL REFERENCES "ServiceBillings"("id") ON DELETE CASCADE,
  "serviceUsageId" UUID REFERENCES "ServiceUsages"("id") ON DELETE SET NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial admin user
INSERT INTO "Users" ("name", "email", "password", "role", "isVerified")
VALUES ('Admin User', 'admin@example.com', '$2a$10$rrCvCmZfK6JK6jkxJFyOAOu2lnJ5h4NXPDQpEMstkgFu.9CLnQOAe', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert initial category
INSERT INTO "Categories" ("name", "description")
VALUES ('Electronics', 'Electronic devices and gadgets')
ON CONFLICT DO NOTHING;