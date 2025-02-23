import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
