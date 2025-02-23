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
    let queryData = table === 'products' ? [...testProducts] : [];
    let conditions = [];
    let updateData = null;

    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation((data) => {
        const newProduct = {
          id: 'new-id',
          ...data,
          status: 'active',
          seller_id: 'seller-id'
        };
        return {
          select: () => ({
            single: () => Promise.resolve({ data: newProduct, error: null })
          })
        };
      }),
      update: jest.fn().mockImplementation((data) => {
        updateData = data;
        return queryBuilder;
      }),
      eq: jest.fn().mockImplementation((field, value) => {
        conditions.push({ field, value, op: 'eq' });
        return queryBuilder;
      }),
      single: jest.fn().mockImplementation(() => {
        const filtered = queryData.filter(item =>
          conditions.every(({ field, value }) => item[field] === value)
        );

        if (updateData && filtered.length > 0) {
          const updatedItem = { ...filtered[0], ...updateData };
          return Promise.resolve({ data: updatedItem, error: null });
        }

        return Promise.resolve({ 
          data: filtered[0] || null,
          error: filtered.length === 0 ? { message: 'Not found' } : null
        });
      }),
      then: jest.fn().mockImplementation((callback) => {
        const filtered = queryData.filter(item =>
          conditions.every(({ field, value }) => item[field] === value)
        );
        return callback({ data: filtered, error: null });
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
