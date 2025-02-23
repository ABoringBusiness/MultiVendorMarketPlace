import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test data
const testProducts = [
  {
    id: '1',
    title: 'Digital Art 1',
    description: 'Beautiful digital art',
    price: 99.99,
    category_id: '123e4567-e89b-12d3-a456-426614174000',
    seller_id: 'seller-id',
    status: 'active'
  },
  {
    id: '2',
    title: 'Photography Print',
    description: 'High quality photo print',
    price: 149.99,
    category_id: '223e4567-e89b-12d3-a456-426614174000',
    seller_id: 'seller-id',
    status: 'active'
  }
];

const testUsers = {
  'mock-seller-token': {
    id: 'seller-id',
    role: 'seller',
    email: 'seller@test.com'
  },
  'mock-admin-token': {
    id: 'admin-id',
    role: 'admin',
    email: 'admin@test.com'
  }
};

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
      error: null
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  },
  from: jest.fn().mockImplementation((table) => {
    const mockData = {
      products: testProducts,
      users: testUsers
    };

    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        if (table === 'products') {
          return Promise.resolve({ data: testProducts[0], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: jest.fn().mockImplementation((callback) => {
        if (table === 'products') {
          return callback({ data: testProducts, error: null });
        }
        return callback({ data: [], error: null });
      })
    };
  })
};

// Mock database connection
jest.mock('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
