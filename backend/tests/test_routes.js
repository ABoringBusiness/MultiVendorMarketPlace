import request from 'supertest';
import express from 'express';
import { expect } from 'chai';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { createMockStripe, createMockSupabase } from './mockFactories.js';

// Import routes
import authRouter from '../router/auth.js';
import productRouter from '../router/productRoutes.js';
import sellerRouter from '../router/sellerRoutes.js';
import orderRouter from '../router/orderRoutes.js';
import adminRouter from '../router/adminRoutes.js';
import searchRouter from '../router/searchRoutes.js';
import reviewRouter from '../router/reviewRoutes.js';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Create mock instances
const mockStripe = createMockStripe();
const mockSupabase = createMockSupabase();

// Import routes
import authRouter from '../router/auth.js';
import productRouter from '../router/productRoutes.js';
import sellerRouter from '../router/sellerRoutes.js';
import orderRouter from '../router/orderRoutes.js';
import adminRouter from '../router/adminRoutes.js';
import searchRouter from '../router/searchRoutes.js';
import reviewRouter from '../router/reviewRoutes.js';

// Create test app
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

// Mock auth middleware
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = {
      id: 'test_user_id',
      role: req.headers['x-test-role'] || 'buyer'
    };
    next();
  } else if (req.path.startsWith('/api/v1/auth/') || req.path.startsWith('/api/v1/search')) {
    // Allow auth routes and search without token
    next();
  } else {
    res.status(401).json({ success: false, message: 'No token provided.' });
  }
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/sellers', sellerRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/reviews', reviewRouter);

describe('API Routes', () => {
  let authToken;
  let testUser;
  let testProduct;

  before(function() {
    // Create test app
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

    // Mock external services
    const mockSupabaseClient = createMockSupabase();
    const mockStripeClient = createMockStripe();
    app.set('supabase', mockSupabaseClient);
    app.set('stripe', mockStripeClient);

    // Set test data
    testUser = {
      id: 'test_user_id',
      email: 'test@example.com',
      role: 'seller'
    };
    testProduct = {
      id: 'test_product_id',
      title: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      seller_id: testUser.id
    };
    
    // Set test token
    authToken = 'test_token';

    // Mock auth middleware
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        req.user = testUser;
        next();
      } else if (req.path.startsWith('/api/v1/auth/') || req.path.startsWith('/api/v1/search')) {
        next();
      } else {
        res.status(401).json({ success: false, message: 'No token provided.' });
      }
    });

    // Mount routes
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/products', productRouter);
    app.use('/api/v1/sellers', sellerRouter);
    app.use('/api/v1/orders', orderRouter);
    app.use('/api/v1/admin', adminRouter);
    app.use('/api/v1/search', searchRouter);
    app.use('/api/v1/reviews', reviewRouter);

    this.app = app;
  });

  // Auth Routes
  describe('Auth Routes', () => {
    it('should register a new user', (done) => {
      request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          role: 'seller'
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          authToken = res.body.token;
          done();
        });
    });
  });

  // Product Routes
  describe('Product Routes', () => {
    it('should list products', (done) => {
      request(app)
        .get('/api/v1/products/list')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          expect(res.body.products).to.be.an('array');
          done();
        });
    });

    it('should create product as seller', (done) => {
      request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-test-role', 'seller')
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          category_id: '1'
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          done();
        });
    });
  });

  // Search Routes
  describe('Search Routes', () => {
    it('should search products', (done) => {
      request(app)
        .get('/api/v1/search')
        .query({ query: 'test', min_price: 10, max_price: 100 })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          expect(res.body.products).to.be.an('array');
          done();
        });
    });
  });

  // Review Routes
  describe('Review Routes', () => {
    it('should create review', (done) => {
      request(app)
        .post('/api/v1/reviews/sellers/test_seller_id/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-test-role', 'buyer')
        .send({
          rating: 5,
          comment: 'Great seller!'
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          done();
        });
    });
  });

  // Admin Routes
  describe('Admin Routes', () => {
    it('should disable seller as admin', (done) => {
      request(app)
        .post('/api/v1/admin/sellers/test_seller_id/disable')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-test-role', 'admin')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).to.be.true;
          done();
        });
    });
  });
});
