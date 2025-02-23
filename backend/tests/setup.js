import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { supabase } from '../database/connection.js';

// Load environment variables
dotenv.config();

// Mock cron jobs
jest.mock('../automation/endedAuctionCron.js', () => ({
  endedAuctionCron: jest.fn()
}));
jest.mock('../automation/verifyCommissionCron.js', () => ({
  verifyCommissionCron: jest.fn()
}));
jest.mock('../automation/AuctionReportsCron.js', () => ({
  checkReportedAuctionsCron: jest.fn()
}));

// Close server after all tests
afterAll(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear test data
  try {
    await supabase.from('orders').delete().neq('id', '0');
    await supabase.from('products').delete().neq('id', '0');
    await supabase.from('reviews').delete().neq('id', '0');
    await supabase.from('users').delete().neq('id', '0');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
});

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

// Create chainable query builder
const createQueryBuilder = (table, data) => {
  let queryData = data;
  let conditions = [];

  const builder = {
    select: () => builder,
    insert: (newData) => {
      queryData = { ...newData, id: 'new-id' };
      return builder;
    },
    update: (updates) => {
      queryData = { ...queryData, ...updates };
      return builder;
    },
    eq: (field, value) => {
      conditions.push({ field, value, op: 'eq' });
      return builder;
    },
    neq: (field, value) => {
      conditions.push({ field, value, op: 'neq' });
      return builder;
    },
    single: () => {
      if (Array.isArray(queryData)) {
        const filtered = queryData.filter(item => 
          conditions.every(({ field, value, op }) => 
            op === 'eq' ? item[field] === value : item[field] !== value
          )
        );
        return Promise.resolve({ data: filtered[0] || null, error: null });
      }
      return Promise.resolve({ data: queryData, error: null });
    },
    then: (cb) => {
      if (Array.isArray(queryData)) {
        const filtered = queryData.filter(item => 
          conditions.every(({ field, value, op }) => 
            op === 'eq' ? item[field] === value : item[field] !== value
          )
        );
        return cb({ data: filtered, error: null });
      }
      return cb({ data: queryData, error: null });
    }
  };

  return builder;
};

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
      error: null
    }),
    signInWithPassword: jest.fn().mockImplementation(({ email, password }) => {
      if (email === 'test@test.com' && password === 'wrong_password') {
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        });
      }
      return Promise.resolve({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null
      });
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn().mockImplementation((table) => {
    const mockData = {
      products: testProducts,
      users: testUsers
    };
    return createQueryBuilder(table, mockData[table] || []);
  })
};

// Mock database connection
jest.unstable_mockModule('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));
