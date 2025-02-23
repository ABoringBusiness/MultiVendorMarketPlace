-- Add legacy_role column to store original role during migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_role VARCHAR;

-- Update role column to support both old and new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('buyer', 'seller', 'admin', 'bidder', 'auctioneer', 'super_admin'));

-- Add indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_legacy_role ON users(legacy_role);
