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
  
  // No need to explicitly close Supabase connection in tests
});

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
  from: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'test-user-id',
        email: 'test@test.com',
        role: 'buyer',
        name: 'Test User',
        created_at: new Date().toISOString()
      },
      error: null
    }),
    then: jest.fn().mockImplementation((callback) => {
      // Default test data
      const allProducts = [
        {
          id: '1',
          title: 'Digital Art 1',
          description: 'Beautiful digital art',
          price: 99.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'active'
        },
        {
          id: '2',
          title: 'Photography Print',
          description: 'High quality photo print',
          price: 149.99,
          category_id: '223e4567-e89b-12d3-a456-426614174000',
          status: 'active'
        },
        {
          id: '3',
          title: 'Abstract Painting',
          description: 'Modern abstract art',
          price: 299.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'active'
        }
      ];

      return Promise.resolve(callback({
        data: allProducts,
        error: null
      }));

      // Apply filters based on the query conditions
      for (const call of mockCalls) {
        const [method, ...args] = call;
        
        if (method === 'eq' && args[0] === 'category_id') {
          filteredProducts = filteredProducts.filter(p => p.category_id === args[1]);
        }
        else if (method === 'gte' && args[0] === 'price') {
          filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(args[1]));
        }
        else if (method === 'lte' && args[0] === 'price') {
          filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(args[1]));
        }
        else if (method === 'or' && args[0].includes('title.ilike')) {
          const searchTerm = args[0].split('.')[2].replace(/%/g, '').toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.title.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm)
          );
        }
      }

      return Promise.resolve(callback({
        data: filteredProducts,
        error: null
      }));
    })
  })
};

// Mock database connection
jest.unstable_mockModule('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));

// Mock UserModel
jest.unstable_mockModule('../models/supabase/userModel.js', () => ({
  default: {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => Promise.resolve({
      id: data.id || 'test-user-id',
      email: data.email,
      role: data.role,
      name: data.name,
      created_at: new Date().toISOString()
    })),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null)
  },
  UserModel: {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => Promise.resolve({
      id: data.id || 'test-user-id',
      email: data.email,
      role: data.role,
      name: data.name,
      created_at: new Date().toISOString()
    })),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null)
  }
}));
