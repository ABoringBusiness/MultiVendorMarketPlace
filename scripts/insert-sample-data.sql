-- Insert sample users
INSERT INTO "Users" ("name", "email", "password", "role", "isVerified")
VALUES 
  ('Buyer User', 'buyer@example.com', '$2a$10$rrCvCmZfK6JK6jkxJFyOAOu2lnJ5h4NXPDQpEMstkgFu.9CLnQOAe', 'buyer', TRUE),
  ('Seller User', 'seller@example.com', '$2a$10$rrCvCmZfK6JK6jkxJFyOAOu2lnJ5h4NXPDQpEMstkgFu.9CLnQOAe', 'seller', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert additional categories
INSERT INTO "Categories" ("name", "description")
VALUES 
  ('Clothing', 'Apparel and fashion items'),
  ('Home & Garden', 'Items for home and garden'),
  ('Toys & Games', 'Entertainment for all ages')
ON CONFLICT DO NOTHING;

-- Get user IDs for reference
DO $$
DECLARE
  seller_id UUID;
  buyer_id UUID;
  electronics_id UUID;
  clothing_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO seller_id FROM "Users" WHERE email = 'seller@example.com';
  SELECT id INTO buyer_id FROM "Users" WHERE email = 'buyer@example.com';
  
  -- Get category IDs
  SELECT id INTO electronics_id FROM "Categories" WHERE name = 'Electronics';
  SELECT id INTO clothing_id FROM "Categories" WHERE name = 'Clothing';
  
  -- Insert sample products
  INSERT INTO "Products" ("title", "description", "price", "stock", "sellerId", "categoryId")
  VALUES 
    ('Smartphone XYZ', 'Latest smartphone with amazing features', 699.99, 10, seller_id, electronics_id),
    ('Laptop Pro', 'Professional laptop for work and gaming', 1299.99, 5, seller_id, electronics_id),
    ('Designer T-Shirt', 'Premium cotton t-shirt', 49.99, 20, seller_id, clothing_id)
  ON CONFLICT DO NOTHING;
  
  -- Create a cart for the buyer
  INSERT INTO "Carts" ("userId")
  VALUES (buyer_id)
  ON CONFLICT DO NOTHING;
  
  -- Insert a bid package
  INSERT INTO "BidPackages" ("name", "description", "bidCount", "price", "featured")
  VALUES ('Starter Pack', 'Get started with 50 bids', 50, 20.00, TRUE)
  ON CONFLICT DO NOTHING;
  
  -- Create an auction
  INSERT INTO "Auctions" (
    "title", 
    "description", 
    "categoryId", 
    "condition", 
    "startingBid", 
    "startTime", 
    "endTime", 
    "sellerId", 
    "status"
  )
  VALUES (
    'Premium Headphones', 
    'Noise-cancelling premium headphones', 
    electronics_id, 
    'new', 
    50.00, 
    NOW(), 
    NOW() + INTERVAL '7 days', 
    seller_id, 
    'active'
  )
  ON CONFLICT DO NOTHING;
  
  -- Create a penny auction
  INSERT INTO "PennyAuctions" (
    "title", 
    "description", 
    "categoryId", 
    "retailPrice", 
    "startTime", 
    "sellerId", 
    "status",
    "featured"
  )
  VALUES (
    'Smart Watch', 
    'Latest smart watch with health tracking', 
    electronics_id, 
    199.99, 
    NOW() + INTERVAL '1 day', 
    seller_id, 
    'pending',
    TRUE
  )
  ON CONFLICT DO NOTHING;
  
END $$;