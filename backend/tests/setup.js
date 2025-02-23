import { jest } from '@jest/globals';
import dotenv from 'dotenv';

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
  await supabase.from('orders').delete().neq('id', '0');
  await supabase.from('products').delete().neq('id', '0');
  await supabase.from('reviews').delete().neq('id', '0');
  await supabase.from('users').delete().neq('id', '0');
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
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'test-user-id',
        email: 'test@test.com',
        role: 'buyer',
        name: 'Test User',
        created_at: new Date().toISOString()
      },
      error: null
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
