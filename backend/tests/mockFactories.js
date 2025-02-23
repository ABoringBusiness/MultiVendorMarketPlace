import { jest } from '@jest/globals';

// Mock Supabase client factory
export const createMockSupabase = () => ({
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  })),
  storage: {
    from: jest.fn()
  }
});

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'BUYER',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-id',
  title: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  seller_id: 'test-seller-id',
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-id',
  product_id: 'test-product-id',
  buyer_id: 'test-buyer-id',
  seller_id: 'test-seller-id',
  amount: 99.99,
  status: 'pending',
  stripe_payment_id: 'pi_test',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockReview = (overrides = {}) => ({
  id: 'test-review-id',
  seller_id: 'test-seller-id',
  reviewer_id: 'test-buyer-id',
  rating: 5,
  comment: 'Great seller!',
  created_at: new Date().toISOString(),
  ...overrides
});
