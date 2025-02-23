import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';

// Load environment variables
config();

// Mock external services
export const mockStripe = {
  paymentIntents: {
    create: async () => ({
      id: 'pi_test',
      client_secret: 'test_secret'
    })
  },
  webhooks: {
    constructEvent: () => ({
      type: 'payment_intent.succeeded',
      data: { object: { metadata: { order_id: 'test_order' } } }
    })
  }
};

export const mockSupabase = {
  auth: {
    signUp: async () => ({ user: { id: 'test_user' }, session: { access_token: 'test_token' } }),
    signIn: async () => ({ user: { id: 'test_user' }, session: { access_token: 'test_token' } })
  },
  from: () => ({
    insert: async () => ({ data: [{ id: 'test_id' }] }),
    select: async () => ({ data: [] }),
    delete: async () => ({ data: [] })
  })
};

// Create test server
const createTestServer = () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(cookieParser());
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));

  // Mock environment
  process.env.STRIPE_SECRET_KEY = 'test_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';

  // Mock dependencies
  app.set('stripe', mockStripe);
  app.set('supabase', mockSupabase);

  return app;
};

export default createTestServer;
