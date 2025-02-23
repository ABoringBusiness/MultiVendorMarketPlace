import request from 'supertest';
import { expect } from 'chai';
import { createClient } from '@supabase/supabase-js';
import { createStripeClient } from '../controllers/orderController.js';
import app from '../app.js';

// Mock Stripe client creation
const mockStripe = {
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

// Override Stripe client creation
createStripeClient = () => mockStripe;

// Set test environment variables
process.env.STRIPE_SECRET_KEY = 'test_key';
process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Stripe
const stripeMock = {
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

// Override Stripe constructor
global.Stripe = function() {
  return stripeMock;
};

// Mock Supabase client
const supabaseMock = {
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

// Override createClient
global.createClient = () => supabaseMock;

// Clean up test data after all tests
after(async () => {
  await cleanupTestData();
});

describe('API Endpoints', () => {
  let token;
  let sellerId;
  let productId;
  let reviewId;

  // Auth Tests
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          role: 'seller'
        });
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
    });

    it('should login user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });
      expect(res.status).to.equal(200);
      expect(res.body.token).to.exist;
      token = res.body.token;
    });
  });

  // Product Tests
  describe('Products', () => {
    it('should create a product', async () => {
      const res = await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '99.99')
        .field('category_id', '1')
        .attach('images', Buffer.from('fake-image'), 'test.jpg');
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      productId = res.body.product.id;
    });

    it('should list products', async () => {
      const res = await request(app)
        .get('/api/v1/products/list');
      expect(res.status).to.equal(200);
      expect(res.body.products).to.be.an('array');
    });
  });

  // Search Tests
  describe('Search', () => {
    it('should search products', async () => {
      const res = await request(app)
        .get('/api/v1/search?query=test');
      expect(res.status).to.equal(200);
      expect(res.body.products).to.be.an('array');
    });

    it('should filter by price range', async () => {
      const res = await request(app)
        .get('/api/v1/search/price-range?min_price=10&max_price=100');
      expect(res.status).to.equal(200);
      expect(res.body.products).to.be.an('array');
    });
  });

  // Review Tests
  describe('Reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Great seller!'
        });
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      reviewId = res.body.review.id;
    });

    it('should get seller reviews', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/sellers/${sellerId}`);
      expect(res.status).to.equal(200);
      expect(res.body.reviews).to.be.an('array');
    });
  });

  // Admin Tests
  describe('Admin Controls', () => {
    it('should disable a product', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/products/${productId}/disable`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should disable a seller', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/disable`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
