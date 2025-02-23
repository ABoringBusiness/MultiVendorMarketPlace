import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

describe('Product Management APIs', () => {
  let sellerToken;
  let adminToken;
  let testProduct;

  beforeAll(async () => {
    // Mock tokens for testing
    sellerToken = 'mock-seller-token';
    adminToken = 'mock-admin-token';
    
    // Mock test product
    testProduct = {
      id: '1',
      title: 'Digital Art 1',
      description: 'Beautiful digital art',
      price: 99.99,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'active'
    };
  });

  beforeEach(async () => {
    // Reset test data before each test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await supabase.from('products').delete().neq('id', '0');
  });

  describe('GET /products/list', () => {
    it('should list all active products', async () => {
      const res = await request(app)
        .get('/api/v1/products/list');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0]).toHaveProperty('id');
      expect(res.body.products[0]).toHaveProperty('title');
      expect(res.body.products[0]).toHaveProperty('price');
    });
  });

  describe('GET /products/{id}', () => {
    it('should get product details', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${testProduct.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toHaveProperty('id', testProduct.id);
      expect(res.body.product).toHaveProperty('title', testProduct.title);
      expect(res.body.product).toHaveProperty('price', testProduct.price);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/v1/products/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /products/create', () => {
    it('should create a new product when seller is authenticated', async () => {
      const productData = {
        title: 'New Product',
        description: 'New description',
        price: 149.99,
        category_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const res = await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toHaveProperty('id');
      expect(res.body.product).toHaveProperty('title', productData.title);
      expect(res.body.product).toHaveProperty('price', productData.price);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/products/create')
        .send({
          title: 'New Product',
          description: 'New description',
          price: 149.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when not a seller', async () => {
      const res = await request(app)
        .post('/api/v1/products/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Product',
          description: 'New description',
          price: 149.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /products/{id}/update', () => {
    it('should update product when seller is authenticated', async () => {
      const updateData = {
        title: 'Updated Product',
        description: 'Updated description',
        price: 199.99
      };

      const res = await request(app)
        .put(`/api/v1/products/${testProduct.id}/update`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toHaveProperty('id', testProduct.id);
      expect(res.body.product).toHaveProperty('title', updateData.title);
      expect(res.body.product).toHaveProperty('price', updateData.price);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${testProduct.id}/update`)
        .send({
          title: 'Updated Product',
          price: 199.99
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when not the owner', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${testProduct.id}/update`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Product',
          price: 199.99
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /products/{id}/disable', () => {
    it('should disable product when admin is authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${testProduct.id}/disable`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toHaveProperty('id', testProduct.id);
      expect(res.body.product).toHaveProperty('status', 'disabled');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${testProduct.id}/disable`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when not an admin', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${testProduct.id}/disable`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
