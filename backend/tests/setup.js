import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { ROLES } from '../constants/roles.js';

// Load environment variables
dotenv.config();

// Initial test data
const initialProducts = [
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

// Mock users for testing
const mockUsers = {
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

// Mock database state
let products = [];
let conditions = [];
let updateData = null;

// Reset database before each test
beforeEach(() => {
  products = [...initialProducts];
  conditions = [];
  updateData = null;
  jest.clearAllMocks();
});

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
    getUser: jest.fn().mockImplementation((token) => {
      const user = mockUsers[token];
      if (!user) {
        return Promise.resolve({ data: null, error: { message: 'Invalid token' } });
      }
      return Promise.resolve({ data: { user: { id: user.id } }, error: null });
    })
  },
  from: jest.fn().mockImplementation((table) => {
    if (table === 'users') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((field, value) => ({
          single: () => {
            const user = Object.values(mockUsers).find(u => u[field] === value);
            return Promise.resolve({ data: user || null, error: !user ? { message: 'Not found' } : null });
          }
        }))
      };
    }

    if (table !== 'products') {
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    }

    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation((data) => {
        const newProduct = {
          id: 'new-id',
          ...data,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        products.push(newProduct);
        return queryBuilder;
      }),
      update: jest.fn().mockImplementation((data) => {
        updateData = data;
        return queryBuilder;
      }),
      eq: jest.fn().mockImplementation((field, value) => {
        conditions.push({ field, value });
        return queryBuilder;
      }),
      single: jest.fn().mockImplementation(() => {
        let result = [...products];
        
        // Apply all conditions
        for (const { field, value } of conditions) {
          result = result.filter(item => item[field] === value);
        }

        // Handle updates
        if (updateData && result.length > 0) {
          const index = products.findIndex(p => p.id === result[0].id);
          if (index !== -1) {
            const updatedItem = { 
              ...products[index], 
              ...updateData,
              updated_at: new Date().toISOString()
            };
            products[index] = updatedItem;
            return Promise.resolve({ data: updatedItem, error: null });
          }
        }

        return Promise.resolve({ 
          data: result[0] || null,
          error: result.length === 0 ? { message: 'Not found' } : null
        });
      }),
      then: jest.fn().mockImplementation((callback) => {
        let result = [...products];
        
        // Apply all conditions
        for (const { field, value } of conditions) {
          result = result.filter(item => item[field] === value);
        }

        // Always return at least an empty array
        return callback({ data: result || [], error: null });
      }),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };

    return queryBuilder;
  })
};

// Mock database connection
jest.mock('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Export mock data for tests
export const testData = {
  products: initialProducts,
  users: mockUsers,
  tokens: {
    seller: 'mock-seller-token',
    admin: 'mock-admin-token'
  }
};
