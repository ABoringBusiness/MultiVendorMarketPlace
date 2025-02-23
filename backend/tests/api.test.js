import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { createMockStripe, createMockSupabase } from './mockFactories.js';
import { setSupabaseForTesting } from '../database/connection.js';
import { ROLES } from '../constants/roles.js';

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
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET_KEY = 'test-jwt-secret';
process.env.BCRYPT_SALT_ROUNDS = '10';

describe('API Routes', () => {
  let app;
  let mockSupabase;
  let mockStripe;
  let testUser;
  let testProduct;
  let authToken;

  before(() => {
    app = express();
    app.use(express.json());
    app.use(cors());
    app.use(cookieParser());
    app.use(fileUpload());

    // Mount routes
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/products', productRouter);
    app.use('/api/v1/sellers', sellerRouter);
    app.use('/api/v1/orders', orderRouter);
    app.use('/api/v1/admin', adminRouter);
    app.use('/api/v1/search', searchRouter);
    app.use('/api/v1/reviews', reviewRouter);
  });

  beforeEach(async () => {
    mockSupabase = createMockSupabase();
    mockStripe = createMockStripe();
    setSupabaseForTesting(mockSupabase);
  });

  describe('Auth Routes', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        role: ROLES.SELLER,
        name: 'Test Seller'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal(userData.email);
      expect(response.body.user.role).to.equal(userData.role);
      expect(response.body.token).to.be.a('string');
    });

    it('should login user', async () => {
      // First register a user
      const userData = {
        email: 'login@example.com',
        password: 'Test123!',
        role: ROLES.BUYER,
        name: 'Test Login User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Then try to login
      const loginData = {
        email: 'login@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.user).to.have.property('id');
      expect(response.body.token).to.be.a('string');
    });
  });

  describe('Product Routes', () => {
    let sellerToken;
    let buyerToken;
    let testUser;

    beforeEach(async () => {
      // Create a seller user
      const sellerData = {
        email: 'seller@example.com',
        password: 'Test123!',
        role: ROLES.SELLER,
        name: 'Test Seller'
      };

      const sellerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(sellerData);

      sellerToken = sellerResponse.body.token;
      testUser = sellerResponse.body.user;

      // Create a buyer user
      const buyerData = {
        email: 'buyer@example.com',
        password: 'Test123!',
        role: ROLES.BUYER,
        name: 'Test Buyer'
      };

      const buyerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(buyerData);

      buyerToken = buyerResponse.body.token;
    });

    it('should create product as seller', async () => {
      const productData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99
      };

      const response = await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.product).to.have.property('id');
      expect(response.body.product.title).to.equal(productData.title);
      expect(response.body.product.seller_id).to.equal('test_user_seller');
    });

    it('should not allow buyer to create product', async () => {
      const productData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99
      };

      await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(productData)
        .expect(403);
    });

    it('should not create product with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test Description',
        price: -10 // Negative price
      };

      await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should list products', async () => {
      const response = await request(app)
        .get('/api/v1/products/list')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.products).to.be.an('array');
    });
  });

  describe('Search Routes', () => {
    it('should search products', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({
          query: 'test',
          min_price: 10,
          max_price: 100
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.products).to.be.an('array');
    });
  });

  describe('Review Routes', () => {
    let buyerToken;
    let sellerToken;
    let sellerId;

    beforeEach(async () => {
      // Create seller
      const sellerData = {
        email: 'seller@example.com',
        password: 'Test123!',
        role: ROLES.SELLER,
        name: 'Test Seller'
      };

      const sellerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(sellerData);

      sellerId = sellerResponse.body.user.id;
      sellerToken = sellerResponse.body.token;

      // Create buyer
      const buyerData = {
        email: 'buyer@example.com',
        password: 'Test123!',
        role: ROLES.BUYER,
        name: 'Test Buyer'
      };

      const buyerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(buyerData);

      buyerToken = buyerResponse.body.token;
    });

    it('should create review', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great seller!'
      };

      const response = await request(app)
        .post(`/api/v1/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.review).to.have.property('id');
      expect(response.body.review.seller_id).to.equal(sellerId);
      expect(response.body.review.rating).to.equal(reviewData.rating);
    });

    it('should not allow seller to review themselves', async () => {
      const reviewData = {
        rating: 5,
        comment: 'I am great!'
      };

      await request(app)
        .post(`/api/v1/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(reviewData)
        .expect(400);
    });

    it('should not create review with invalid rating', async () => {
      const invalidReviewData = {
        rating: 6, // Rating should be 1-5
        comment: 'Invalid rating'
      };

      await request(app)
        .post(`/api/v1/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(invalidReviewData)
        .expect(400);
    });

    it('should not create review for non-existent seller', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great seller!'
      };

      await request(app)
        .post(`/api/v1/reviews/sellers/00000000-0000-0000-0000-000000000000/create`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(reviewData)
        .expect(404);
    });
  });

  describe('Admin Routes', () => {
    let adminToken;
    let sellerToken;
    let sellerId;

    beforeEach(async () => {
      // Create admin user
      const adminData = {
        email: 'admin@example.com',
        password: 'Test123!',
        role: ROLES.ADMIN,
        name: 'Test Admin'
      };

      const adminResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(adminData);

      adminToken = adminResponse.body.token;

      // Create seller to disable
      const sellerData = {
        email: 'seller@example.com',
        password: 'Test123!',
        role: ROLES.SELLER,
        name: 'Test Seller'
      };

      const sellerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(sellerData);

      sellerId = sellerResponse.body.user.id;
      sellerToken = sellerResponse.body.token;
    });

    it('should disable seller as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/disable`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
    });
  });

  describe('Order Routes', () => {
    let buyerToken;
    let sellerToken;
    let testProduct;

    beforeEach(async () => {
      // Create seller and product
      const sellerData = {
        email: 'seller@example.com',
        password: 'Test123!',
        role: ROLES.SELLER,
        name: 'Test Seller'
      };

      const sellerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(sellerData);

      sellerToken = sellerResponse.body.token;

      const productData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99
      };

      const productResponse = await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);

      testProduct = productResponse.body.product;
      if (!testProduct || !testProduct.id) {
        throw new Error('Failed to create test product');
      }

      // Create buyer
      const buyerData = {
        email: 'buyer@example.com',
        password: 'Test123!',
        role: ROLES.BUYER,
        name: 'Test Buyer'
      };

      const buyerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(buyerData);

      buyerToken = buyerResponse.body.token;
    });

    it('should create order', async () => {
      const orderData = {
        product_id: testProduct.id,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/v1/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.order).to.have.property('id');
      expect(response.body.order.product_id).to.equal(testProduct.id);
      expect(response.body.client_secret).to.be.a('string');
    });

    it('should not allow seller to buy their own product', async () => {
      const orderData = {
        product_id: testProduct.id,
        quantity: 1
      };

      await request(app)
        .post('/api/v1/orders/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(orderData)
        .expect(400);
    });

    it('should not create order with invalid data', async () => {
      const invalidOrderData = {
        product_id: 'invalid-id',
        quantity: -1
      };

      await request(app)
        .post('/api/v1/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(invalidOrderData)
        .expect(400);
    });

    it('should not create order for non-existent product', async () => {
      const orderData = {
        product_id: '00000000-0000-0000-0000-000000000000',
        quantity: 1
      };

      await request(app)
        .post('/api/v1/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(orderData)
        .expect(404);
    });
  });
});
