import { jest } from '@jest/globals';
import { config } from 'dotenv';

// Load environment variables
config();

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
    }),
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
  }))
};

jest.mock('../database/connection.js', () => ({
  supabase: mockSupabase
}));

// Mock UserModel
// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn().mockResolvedValue({
      data: { 
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { 
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      },
      error: null
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
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
  }))
};

jest.mock('../database/connection.js', () => ({
  supabase: mockSupabase
}));

// Mock UserModel
jest.mock('../models/supabase/userModel.js', () => ({
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

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test',
      client_secret: 'test_secret'
    })
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { metadata: { order_id: 'test_order' } } }
    })
  }
};

jest.mock('stripe', () => jest.fn(() => mockStripe));
