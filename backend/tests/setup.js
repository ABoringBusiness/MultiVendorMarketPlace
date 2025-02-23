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
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Photography Print',
    description: 'High quality photo print',
    price: 149.99,
    category_id: '223e4567-e89b-12d3-a456-426614174000',
    seller_id: 'seller-id',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

// Reset database before each test
beforeEach(() => {
  products = [...initialProducts];
  jest.clearAllMocks();
});

// Create a query builder that maintains proper chaining
const createProductQueryBuilder = () => {
  let conditions = [];
  let updateData = null;
  let selectedFields = '*';

  const chain = {
    select: jest.fn().mockImplementation((...fields) => {
      selectedFields = fields.length ? fields.join(',') : '*';
      return chain;
    }),
    insert: jest.fn().mockImplementation((data) => {
      const newProduct = {
        id: 'new-id',
        ...data,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      products.push(newProduct);
      return {
        select: () => ({
          single: () => Promise.resolve({ data: newProduct, error: null })
        })
      };
    }),
    update: jest.fn().mockImplementation((data) => {
      updateData = data;
      return chain;
    }),
    eq: jest.fn().mockImplementation((field, value) => {
      conditions.push({ field, value });
      return chain;
    }),
    single: jest.fn().mockImplementation(() => {
      let result = [...products];
      for (const { field, value } of conditions) {
        result = result.filter(item => item[field] === value);
      }
      if (!conditions.some(c => c.field === 'status')) {
        result = result.filter(item => item.status === 'active');
      }
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
      for (const { field, value } of conditions) {
        result = result.filter(item => item[field] === value);
      }
      if (!conditions.some(c => c.field === 'status')) {
        result = result.filter(item => item.status === 'active');
      }
      return callback({ data: result || [], error: null });
    })
  };
  return chain;
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

    return createProductQueryBuilder();
  })
};

// Mock database connection
jest.mock('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));

// Export mock data for tests
export const testData = {
  products: initialProducts,
  users: mockUsers,
  tokens: {
    seller: 'mock-seller-token',
    admin: 'mock-admin-token'
  }
};
