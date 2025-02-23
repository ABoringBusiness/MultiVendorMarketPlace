import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

let server;

describe('Product API', () => {
  let sellerToken;
  let buyerToken;
  let adminToken;
  let testProduct;
  let testSeller;

  beforeAll(async () => {
    server = app.listen();
    
    // Create test users
    const sellerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'test123',
        name: 'Test Seller',
        role: ROLES.SELLER
      });
    sellerToken = sellerRes.body.token;
    testSeller = sellerRes.body.user;

    const buyerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'buyer@test.com',
        password: 'test123',
        name: 'Test Buyer',
        role: ROLES.BUYER
      });
    buyerToken = buyerRes.body.token;

    const adminRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'test123',
        name: 'Test Admin',
        role: ROLES.ADMIN
      });
    adminToken = adminRes.body.token;
    // Create test seller
    const sellerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'test123',
        name: 'Test Seller',
        role: ROLES.SELLER
      });
    sellerToken = sellerRes.body.token;
    testSeller = sellerRes.body.user;

    // Create test buyer
    const buyerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'buyer@test.com',
        password: 'test123',
        name: 'Test Buyer',
        role: ROLES.BUYER
      });
    buyerToken = buyerRes.body.token;

    // Create test admin
    const adminRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'test123',
        name: 'Test Admin',
        role: ROLES.ADMIN
      });
    adminToken = adminRes.body.token;
  });

  beforeEach(async () => {
    try {
      // Clear test data
      await supabase.from('products').delete().neq('id', '0');
      
      // Create test product
      const productRes = await request(app)
        .post('/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000'
        });
      testProduct = productRes.body.product;
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Product Management', () => {
    describe('POST /products/create', () => {
      it('should create a new product as seller', async () => {
        const res = await request(app)
          .post('/products/create')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            title: 'Test Product',
            description: 'Test Description',
            price: 99.99,
            category_id: '123e4567-e89b-12d3-a456-426614174000'
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.product.title).toBe('Test Product');
        testProduct = res.body.product;
      });

      it('should not create product as buyer', async () => {
        const res = await request(app)
          .post('/products/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            title: 'Test Product',
            description: 'Test Description',
            price: 99.99
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /products/list', () => {
      it('should list all active products', async () => {
        const res = await request(app)
          .get('/products/list');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
      });
    });

    describe('GET /products/:id', () => {
      it('should get product details', async () => {
        const res = await request(app)
          .get(`/products/${testProduct.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.product.id).toBe(testProduct.id);
      });

      it('should return 404 for non-existent product', async () => {
        const res = await request(app)
          .get('/products/non-existent-id');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /products/:id/update', () => {
      it('should update product as seller owner', async () => {
        const res = await request(app)
          .put(`/products/${testProduct.id}/update`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            title: 'Updated Product',
            price: 149.99
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.product.title).toBe('Updated Product');
        expect(res.body.product.price).toBe(149.99);
      });

      it('should not update product as different seller', async () => {
        // Create another seller
        const otherSellerRes = await request(app)
          .post('/auth/register')
          .send({
            email: 'other.seller@test.com',
            password: 'test123',
            name: 'Other Seller',
            role: ROLES.SELLER
          });

        const res = await request(app)
          .put(`/products/${testProduct.id}/update`)
          .set('Authorization', `Bearer ${otherSellerRes.body.token}`)
          .send({
            title: 'Updated Product',
            price: 149.99
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /products/:id/disable', () => {
      it('should disable product as admin', async () => {
        const res = await request(app)
          .post(`/products/${testProduct.id}/disable`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.product.status).toBe('disabled');
      });

      it('should not disable product as seller', async () => {
        const res = await request(app)
          .post(`/products/${testProduct.id}/disable`)
          .set('Authorization', `Bearer ${sellerToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Seller Management', () => {
    describe('GET /sellers/list', () => {
      it('should list all active sellers', async () => {
        const res = await request(app)
          .get('/sellers/list');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.sellers)).toBe(true);
      });
    });

    describe('GET /sellers/:id', () => {
      it('should get seller profile', async () => {
        const res = await request(app)
          .get(`/sellers/${testSeller.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.seller.id).toBe(testSeller.id);
      });

      it('should return 404 for non-existent seller', async () => {
        const res = await request(app)
          .get('/sellers/non-existent-id');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /sellers/:id/disable', () => {
      it('should disable seller as admin', async () => {
        const res = await request(app)
          .post(`/sellers/${testSeller.id}/disable`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.seller.status).toBe('disabled');
      });

      it('should not disable seller as another seller', async () => {
        // Create another seller
        const otherSellerRes = await request(app)
          .post('/auth/register')
          .send({
            email: 'other.seller2@test.com',
            password: 'test123',
            name: 'Other Seller 2',
            role: ROLES.SELLER
          });

        const res = await request(app)
          .post(`/sellers/${testSeller.id}/disable`)
          .set('Authorization', `Bearer ${otherSellerRes.body.token}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });
  });
});
