import { jest } from '@jest/globals';
import { config } from 'dotenv';

// Load environment variables
config();

// Mock UserModel
const mockUserModel = {
  findByEmail: jest.fn().mockImplementation(() => Promise.resolve(null)),
  create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'test-user-id', ...data })),
  findById: jest.fn().mockImplementation(() => Promise.resolve(null)),
  update: jest.fn().mockImplementation(() => Promise.resolve(null))
};

jest.mock('../models/supabase/userModel.js', () => ({
  UserModel: mockUserModel
}));
  UserModel: {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'test-user-id',
      ...data
    })),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null)
  }
}));

// Mock Stripe
const stripeMock = {
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

// Mock Stripe
jest.mock('stripe', () => jest.fn(() => stripeMock));

// Mock Supabase client
jest.mock('../database/connection.js', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'test-token' }
        },
        error: null
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'test-token' }
        },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
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
    })),
    storage: {
      from: jest.fn()
    }
  }
}));
