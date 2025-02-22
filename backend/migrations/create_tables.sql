-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  avatar VARCHAR,
  role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  starting_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  budget DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES users(id),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category Suggestions table
CREATE TABLE IF NOT EXISTS category_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  suggested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR NOT NULL CHECK (type IN ('user', 'auction', 'commission')),
  reason TEXT NOT NULL,
  reported_id UUID NOT NULL,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Commission Proofs table
CREATE TABLE IF NOT EXISTS commission_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
  proof_images TEXT[],
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
