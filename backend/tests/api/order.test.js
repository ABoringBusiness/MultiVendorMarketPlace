import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

let server;
let sellerToken;
let buyerToken;
let adminToken;
let testProduct;
let testOrder;

describe('Order API', () => {
  beforeAll(async () => {
    server = app.listen();
    try {
      // Create test seller
      const { body: sellerData } = await request(app)
        .post('/auth/register')
        .send({
          email: 'seller@test.com',
          password: 'test123',
          name: 'Test Seller',
          role: ROLES.SELLER
        });
      sellerToken = sellerData.token;

      // Create test buyer
      const { body: buyerData } = await request(app)
        .post('/auth/register')
        .send({
          email: 'buyer@test.com',
          password: 'test123',
          name: 'Test Buyer',
          role: ROLES.BUYER
        });
      buyerToken = buyerData.token;

      // Create test admin
      const { body: adminData } = await request(app)
        .post('/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'test123',
          name: 'Test Admin',
          role: ROLES.ADMIN
        });
      adminToken = adminData.token;

      // Create test product
      const { body: productData } = await request(app)
        .post('/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000'
        });
      testProduct = productData.product;
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    try {
      // Clear test data
      await supabase.from('orders').delete().neq('id', '0');
      
      // Create test order
      const { body: orderData } = await request(app)
        .post('/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          product_id: testProduct.id,
          quantity: 1
        });
      testOrder = orderData.order;
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Order Management', () => {
    describe('POST /orders/create', () => {
      it('should create a new order as buyer', async () => {
        const res = await request(app)
          .post('/orders/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            product_id: testProduct.id,
            quantity: 2
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.order.product_id).toBe(testProduct.id);
        expect(res.body.order.quantity).toBe(2);
        expect(res.body.client_secret).toBeDefined();
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
        expect(res.body.orders.length).toBeGreaterThan(0);
      });

      it('should list seller orders', async () => {
        const res = await request(app)
          .get('/orders/list')
          .set('Authorization', `Bearer ${sellerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.orders)).toBe(true);
      });
    });

    describe('GET /orders/:id', () => {
      it('should get order details as buyer', async () => {
        const res = await request(app)
          .get(`/orders/${testOrder.id}`)
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.order.id).toBe(testOrder.id);
      });

      it('should get order details as seller', async () => {
        const res = await request(app)
          .get(`/orders/${testOrder.id}`)
          .set('Authorization', `Bearer ${sellerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.order.id).toBe(testOrder.id);
      });

      it('should return 404 for non-existent order', async () => {
        const res = await request(app)
          .get('/orders/non-existent-id')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
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

      it('should update order status as admin', async () => {
        const res = await request(app)
          .put(`/orders/${testOrder.id}/update-status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'cancelled' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.order.status).toBe('cancelled');
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
});
