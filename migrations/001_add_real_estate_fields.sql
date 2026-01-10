-- migrations/001_add_real_estate_fields.sql
-- Real Estate Lead Marketplace Schema Extensions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. EXTEND USERS TABLE (REALTORS)
-- ============================================

ALTER TABLE "Users" 
  ADD COLUMN IF NOT EXISTS "brokerage" TEXT,
  ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "market" TEXT,
  ADD COLUMN IF NOT EXISTS "markets" TEXT[],
  ADD COLUMN IF NOT EXISTS "specializations" TEXT[],
  ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dealsClosedLast12Mo" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "totalEarnings" DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "referralFeePercent" DECIMAL(3,2) DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS "acceptingReferrals" BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "acceptingLeads" BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "autoAcceptReferrals" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "preferredLeadTypes" TEXT[],
  ADD COLUMN IF NOT EXISTS "priceRangeMin" INTEGER,
  ADD COLUMN IF NOT EXISTS "priceRangeMax" INTEGER,
  ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'America/Chicago',
  ADD COLUMN IF NOT EXISTS "isVerifiedRealtor" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeOnboardingComplete" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "teamId" UUID;

CREATE INDEX IF NOT EXISTS idx_users_market ON "Users"("market");
CREATE INDEX IF NOT EXISTS idx_users_brokerage ON "Users"("brokerage");
CREATE INDEX IF NOT EXISTS idx_users_verified ON "Users"("isVerifiedRealtor");

-- ============================================
-- 2. EXTEND PRODUCTS TABLE (LEADS)
-- ============================================

ALTER TABLE "Products"
  ADD COLUMN IF NOT EXISTS "leadType" TEXT CHECK (leadType IN ('buyer', 'seller', 'renter', 'investor', 'both')),
  ADD COLUMN IF NOT EXISTS "market" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "qualityScore" DECIMAL(5,2) DEFAULT 50.00 CHECK (qualityScore >= 0 AND qualityScore <= 100),
  ADD COLUMN IF NOT EXISTS "leadSource" TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS "contactInfo" JSONB,
  ADD COLUMN IF NOT EXISTS "propertyPreferences" JSONB,
  ADD COLUMN IF NOT EXISTS "urgencyLevel" TEXT DEFAULT 'medium' CHECK (urgencyLevel IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS "timeframe" TEXT,
  ADD COLUMN IF NOT EXISTS "isPreApproved" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "budget" INTEGER,
  ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "conversionProbability" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "hmmState" TEXT,
  ADD COLUMN IF NOT EXISTS "isHot" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "clicks" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "saves" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "soldAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "buyerId" UUID REFERENCES "Users"("id"),
  ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Rename stock to available
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='Products' AND column_name='stock') THEN
    ALTER TABLE "Products" RENAME COLUMN "stock" TO "available";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_lead_type ON "Products"("leadType");
CREATE INDEX IF NOT EXISTS idx_products_market ON "Products"("market");
CREATE INDEX IF NOT EXISTS idx_products_quality_score ON "Products"("qualityScore" DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_hot ON "Products"("isHot");
CREATE INDEX IF NOT EXISTS idx_products_buyer ON "Products"("buyerId");

-- ============================================
-- 3. NEW TABLE: LEAD TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS "LeadTransactions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "listingId" UUID NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "buyerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL,
  "platformFee" DECIMAL(10, 2) NOT NULL,
  "sellerPayout" DECIMAL(10, 2) NOT NULL,
  "paymentMethod" TEXT DEFAULT 'stripe',
  "stripePaymentIntentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'disputed')),
  "refundReason" TEXT,
  "refundedAt" TIMESTAMP,
  "leadQualityRating" INTEGER CHECK (leadQualityRating >= 1 AND leadQualityRating <= 5),
  "qualityFeedback" TEXT,
  "contactResponsive" BOOLEAN,
  "leadAccurate" BOOLEAN,
  "wouldBuyAgain" BOOLEAN,
  "conversionStatus" TEXT DEFAULT 'pending' CHECK (conversionStatus IN ('pending', 'contacted', 'meeting_scheduled', 'under_contract', 'closed', 'lost')),
  "conversionDate" TIMESTAMP,
  "salePrice" DECIMAL(10, 2),
  "commissionEarned" DECIMAL(10, 2),
  "commissionPercent" DECIMAL(3,2),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

CREATE INDEX idx_lead_txn_listing ON "LeadTransactions"("listingId");
CREATE INDEX idx_lead_txn_seller ON "LeadTransactions"("sellerId");
CREATE INDEX idx_lead_txn_buyer ON "LeadTransactions"("buyerId");
CREATE INDEX idx_lead_txn_status ON "LeadTransactions"("status");
CREATE INDEX idx_lead_txn_created ON "LeadTransactions"("createdAt" DESC);

-- ============================================
-- 4. NEW TABLE: REFERRALS
-- ============================================

CREATE TABLE IF NOT EXISTS "Referrals" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fromAgentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "toAgentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "leadId" UUID NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
  "referralFeePercent" DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')),
  "acceptedAt" TIMESTAMP,
  "rejectedAt" TIMESTAMP,
  "rejectionReason" TEXT,
  "expiresAt" TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  "expectedCommission" DECIMAL(10, 2),
  "actualCommission" DECIMAL(10, 2),
  "referralFeePaid" DECIMAL(10, 2),
  "paidOut" BOOLEAN DEFAULT FALSE,
  "paidOutAt" TIMESTAMP,
  "stripeTransferId" TEXT,
  "conversionStatus" TEXT DEFAULT 'pending',
  "closedAt" TIMESTAMP,
  "salePrice" DECIMAL(10, 2),
  "rating" INTEGER CHECK (rating >= 1 AND rating <= 5),
  "feedback" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referrals_from_agent ON "Referrals"("fromAgentId");
CREATE INDEX idx_referrals_to_agent ON "Referrals"("toAgentId");
CREATE INDEX idx_referrals_lead ON "Referrals"("leadId");
CREATE INDEX idx_referrals_status ON "Referrals"("status");

-- ============================================
-- 5. NEW TABLE: TEAMS
-- ============================================

CREATE TABLE IF NOT EXISTS "Teams" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "brokerage" TEXT,
  "ownerAgentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "memberCount" INTEGER DEFAULT 1,
  "discountPercent" DECIMAL(3,2) DEFAULT 0.00,
  "isActive" BOOLEAN DEFAULT TRUE,
  "totalLeadsPurchased" INTEGER DEFAULT 0,
  "totalSpent" DECIMAL(10, 2) DEFAULT 0.00,
  "totalEarnings" DECIMAL(10, 2) DEFAULT 0.00,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TeamMembers" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "teamId" UUID NOT NULL REFERENCES "Teams"("id") ON DELETE CASCADE,
  "agentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "role" TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("teamId", "agentId")
);

CREATE INDEX idx_teams_owner ON "Teams"("ownerAgentId");
CREATE INDEX idx_teams_brokerage ON "Teams"("brokerage");
CREATE INDEX idx_team_members_team ON "TeamMembers"("teamId");
CREATE INDEX idx_team_members_agent ON "TeamMembers"("agentId");

-- Add foreign key for teamId in Users
ALTER TABLE "Users"
  ADD CONSTRAINT fk_users_team 
  FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE SET NULL;

-- ============================================
-- 6. NEW TABLE: REFERRAL INVITES (Viral Loop)
-- ============================================

CREATE TABLE IF NOT EXISTS "ReferralInvites" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "referrerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "inviteeEmail" TEXT NOT NULL,
  "inviteeName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  "inviteCode" TEXT UNIQUE NOT NULL,
  "invitedUserId" UUID REFERENCES "Users"("id"),
  "referrerReward" DECIMAL(10, 2) DEFAULT 100.00,
  "inviteeReward" DECIMAL(10, 2) DEFAULT 100.00,
  "rewardPaid" BOOLEAN DEFAULT FALSE,
  "rewardPaidAt" TIMESTAMP,
  "emailSentAt" TIMESTAMP,
  "emailOpenedAt" TIMESTAMP,
  "linkClickedAt" TIMESTAMP,
  "acceptedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referral_invites_referrer ON "ReferralInvites"("referrerId");
CREATE INDEX idx_referral_invites_email ON "ReferralInvites"("inviteeEmail");
CREATE INDEX idx_referral_invites_code ON "ReferralInvites"("inviteCode");
CREATE INDEX idx_referral_invites_status ON "ReferralInvites"("status");

-- ============================================
-- 7. NEW TABLE: AGENT NETWORK
-- ============================================

CREATE TABLE IF NOT EXISTS "AgentNetwork" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "agentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "connectedAgentId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "relationshipType" TEXT DEFAULT 'referral_partner' CHECK (relationshipType IN ('coworker', 'referral_partner', 'friend', 'mentor', 'team_member')),
  "connectionStrength" DECIMAL(3,2) DEFAULT 0.50 CHECK (connectionStrength >= 0 AND connectionStrength <= 1),
  "transactionCount" INTEGER DEFAULT 0,
  "totalRevenue" DECIMAL(10, 2) DEFAULT 0.00,
  "lastTransactionAt" TIMESTAMP,
  "leadsShared" INTEGER DEFAULT 0,
  "leadsReceived" INTEGER DEFAULT 0,
  "referralsSent" INTEGER DEFAULT 0,
  "referralsReceived" INTEGER DEFAULT 0,
  "trustScore" DECIMAL(3,2) DEFAULT 0.50,
  "averageRating" DECIMAL(3,2) DEFAULT 0.00,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("agentId", "connectedAgentId")
);

CREATE INDEX idx_agent_network_agent ON "AgentNetwork"("agentId");
CREATE INDEX idx_agent_network_connected ON "AgentNetwork"("connectedAgentId");
CREATE INDEX idx_agent_network_type ON "AgentNetwork"("relationshipType");

-- ============================================
-- 8. NEW TABLE: LEAD WATCHLIST
-- ============================================

CREATE TABLE IF NOT EXISTS "LeadWatchlist" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "leadId" UUID NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "leadId")
);

CREATE INDEX idx_watchlist_user ON "LeadWatchlist"("userId");
CREATE INDEX idx_watchlist_lead ON "LeadWatchlist"("leadId");

-- ============================================
-- 9. NEW TABLE: ANALYTICS EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS "AnalyticsEvents" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
  "eventType" TEXT NOT NULL,
  "eventData" JSONB,
  "sessionId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON "AnalyticsEvents"("userId");
CREATE INDEX idx_analytics_type ON "AnalyticsEvents"("eventType");
CREATE INDEX idx_analytics_created ON "AnalyticsEvents"("createdAt" DESC);

-- ============================================
-- 10. UPDATE EXISTING ORDERS TABLE
-- ============================================

ALTER TABLE "Orders"
  ADD COLUMN IF NOT EXISTS "leadId" UUID REFERENCES "Products"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "transactionType" TEXT DEFAULT 'lead_purchase' CHECK (transactionType IN ('lead_purchase', 'subscription', 'service', 'other'));
