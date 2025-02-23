import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

let server;

describe('Order API', () => {
  let sellerToken;
  let buyerToken;
  let testProduct;
  let testOrder;

  beforeAll(async () => {
    server = app.listen();
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

    // Create test product
    const productRes = await request(app)
      .post('/products/create')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99
      });
    testProduct = productRes.body.product;
  });

  beforeEach(async () => {
    // Clear test data
    await supabase.from('orders').delete().neq('id', '0');
    await supabase.from('products').delete().neq('id', '0');
    
    // Create test product for each test
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
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /orders/create', () => {
    it('should create a new order as buyer', async () => {
      const res = await request(app)
        .post('/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          product_id: testProduct.id,
          quantity: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.product_id).toBe(testProduct.id);
      expect(res.body.client_secret).toBeDefined();
      testOrder = res.body.order;
    });

    it('should not create order as seller', async () => {
      const res = await request(app)
        .post('/orders/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          product_id: testProduct.id,
          quantity: 1
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /orders/list', () => {
    it('should list buyer orders', async () => {
      const res = await request(app)
        .get('/orders/list')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('PUT /orders/:id/update-status', () => {
    it('should update order status as seller', async () => {
      // First mark order as paid (simulating Stripe webhook)
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', testOrder.id);

      const res = await request(app)
        .put(`/orders/${testOrder.id}/update-status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('completed');
    });

    it('should not update order status as buyer', async () => {
      const res = await request(app)
        .put(`/orders/${testOrder.id}/update-status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
