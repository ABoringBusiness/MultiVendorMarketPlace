import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import sinon from 'sinon';
import Stripe from 'stripe';

// Load environment variables
config();

// Mock Stripe
const stripeMock = {
  paymentIntents: {
    create: sinon.stub().resolves({
      id: 'pi_test',
      client_secret: 'test_secret'
    })
  },
  webhooks: {
    constructEvent: sinon.stub().returns({
      type: 'payment_intent.succeeded',
      data: { object: { metadata: { order_id: 'test_order' } } }
    })
  }
};

// Replace Stripe instance with mock
sinon.stub(Stripe.prototype, 'constructor').returns(stripeMock);

// Initialize Supabase client for tests
export const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || 'test-anon-key'
);

// Mock Supabase responses
const supabaseMock = {
  auth: {
    signUp: sinon.stub().resolves({ user: { id: 'test_user' }, session: { access_token: 'test_token' } }),
    signIn: sinon.stub().resolves({ user: { id: 'test_user' }, session: { access_token: 'test_token' } })
  },
  from: () => ({
    insert: sinon.stub().resolves({ data: [{ id: 'test_id' }] }),
    select: sinon.stub().resolves({ data: [] }),
    delete: sinon.stub().resolves({ data: [] })
  })
};

// Replace Supabase client with mock
sinon.stub(supabase, 'constructor').returns(supabaseMock);

// Clean up mocks after tests
export const cleanupTestData = async () => {
  sinon.restore();
};
