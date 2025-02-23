import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { ROLES } from '../constants/roles.js';

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
    role: ROLES.SELLER,
    email: 'seller@test.com'
  },
  'mock-admin-token': {
    id: 'admin-id',
    role: ROLES.ADMIN,
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

    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation((data) => {
        if (table === 'products') {
          const newProduct = {
            id: 'new-id',
            ...data,
            status: 'active'
          };
          return {
            select: () => ({
              single: () => Promise.resolve({ data: newProduct, error: null })
            })
          };
        }
        return queryBuilder;
      }),
      update: jest.fn().mockImplementation((data) => {
        if (table === 'products') {
          const updatedProduct = {
            ...testProducts[0],
            ...data
          };
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: updatedProduct, error: null })
              })
            })
          };
        }
        return queryBuilder;
      }),
      eq: jest.fn().mockImplementation((field, value) => {
        if (table === 'products' && field === 'id') {
          const product = testProducts.find(p => p.id === value);
          queryBuilder.single = () => Promise.resolve({ data: product, error: null });
        }
        return queryBuilder;
      }),
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

    return queryBuilder;
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
